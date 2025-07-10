import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { WebRTCConnection } from '@/utils/webrtc-connection';
import { RealtimeChannel } from '@/utils/realtime-channel';
import { CallOffer, IceCandidate, WebRTCConfig } from '@/types/webrtc';

export const useWebRTC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const webrtcConnection = useRef<WebRTCConnection | null>(null);
  const realtimeChannel = useRef<RealtimeChannel | null>(null);

  const rtcConfig: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const endCall = useCallback(() => {
    console.log('Ending call...');
    
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Send call end signal before closing
    realtimeChannel.current?.sendCallEnd();

    // Close connections
    webrtcConnection.current?.close();
    realtimeChannel.current?.close();

    // Reset refs
    webrtcConnection.current = null;
    realtimeChannel.current = null;

    setRemoteStream(null);
    setIsConnected(false);
    setIsConnecting(false);
  }, [localStream]);

  const initializeWebRTC = useCallback(async () => {
    if (!user?.id) {
      console.error('No user ID available for WebRTC');
      throw new Error('No user ID available for WebRTC');
    }
    
    // Close existing connection if any
    if (webrtcConnection.current) {
      console.log('Closing existing WebRTC connection');
      webrtcConnection.current.close();
    }

    try {
      console.log('Creating new WebRTC connection');
      webrtcConnection.current = new WebRTCConnection(rtcConfig, user.id);
      webrtcConnection.current.initialize();
      console.log('WebRTC connection initialized successfully');
    } catch (error) {
      console.error('WebRTC initialization failed:', error);
      webrtcConnection.current = null;
      throw error;
    }

    // Set up WebRTC event handlers
    webrtcConnection.current.onIceCandidate((candidate) => {
      const remoteUserId = webrtcConnection.current?.getRemoteUserId();
      if (remoteUserId && realtimeChannel.current) {
        realtimeChannel.current.sendIceCandidate({
          candidate: candidate.candidate || '',
          sdpMLineIndex: candidate.sdpMLineIndex || 0,
          sdpMid: candidate.sdpMid || '',
          from: user.id,
          to: remoteUserId,
        });
      }
    });

    webrtcConnection.current.onTrack((stream) => {
      setRemoteStream(stream);
    });

    webrtcConnection.current.onConnectionStateChange((state) => {
      setIsConnected(state === 'connected');
      setIsConnecting(state === 'connecting');
      
      if (state === 'disconnected' || state === 'failed') {
        endCall();
      }
    });
  }, [user?.id, endCall]);

  const setupRealtimeChannel = useCallback((chatId: string) => {
    if (!user?.id) {
      console.error('No user ID available for realtime channel');
      return;
    }
    
    if (realtimeChannel.current) {
      console.log('Realtime channel already exists, closing previous one');
      realtimeChannel.current.close();
    }

    console.log('Creating new realtime channel for chat:', chatId);
    realtimeChannel.current = new RealtimeChannel(chatId, user.id);
    realtimeChannel.current.initialize();

    // Set up realtime event handlers
    realtimeChannel.current.onCallOffer(async (offer: CallOffer) => {
      if (offer.to === user.id) {
        try {
          webrtcConnection.current?.setRemoteUserId(offer.from);
          setIsConnecting(true);

          if (offer.type === 'offer') {
            // Get user media for the receiver
            const constraints = {
              audio: true,
              video: offer.callType === 'video'
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);
            console.log('Receiver got local stream:', stream);

            // Initialize WebRTC if not already done
            if (!webrtcConnection.current) {
              await initializeWebRTC();
            }

            // Add tracks to peer connection
            stream.getTracks().forEach(track => {
              webrtcConnection.current?.addTrack(track, stream);
            });

            await webrtcConnection.current?.setRemoteDescription({
              type: offer.type,
              sdp: offer.sdp,
            });

            const answer = await webrtcConnection.current?.createAnswer();
            if (answer) {
              realtimeChannel.current?.sendCallOffer({
                sdp: answer.sdp || '',
                type: 'answer',
                from: user.id,
                to: offer.from,
                callType: offer.callType,
              });
            }
          } else if (offer.type === 'answer') {
            await webrtcConnection.current?.setRemoteDescription({
              type: offer.type,
              sdp: offer.sdp,
            });
          }
        } catch (error) {
          console.error('Error handling call offer:', error);
          setIsConnecting(false);
        }
      }
    });

    realtimeChannel.current.onIceCandidate(async (candidate: IceCandidate) => {
      try {
        await webrtcConnection.current?.addIceCandidate({
          candidate: candidate.candidate,
          sdpMLineIndex: candidate.sdpMLineIndex,
          sdpMid: candidate.sdpMid,
        });
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    realtimeChannel.current.onCallEnd(() => {
      endCall();
    });
  }, [user?.id, initializeWebRTC, endCall]);

  const startCall = useCallback(async (contactId: string, chatId: string, callType: 'voice' | 'video') => {
    try {
      console.log('Starting call with user:', contactId, 'in chat:', chatId);
      setIsConnecting(true);
      
      // Get user media first
      const constraints = {
        audio: true,
        video: callType === 'video'
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      console.log('Got local stream');

      // Initialize connections with proper sequencing
      console.log('Initializing WebRTC...');
      await initializeWebRTC();
      console.log('WebRTC initialized, current connection:', !!webrtcConnection.current);
      
      console.log('Setting up realtime channel...');
      setupRealtimeChannel(chatId);
      console.log('Realtime channel setup, current channel:', !!realtimeChannel.current);
      
      // Wait a moment for realtime channel to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Store references to avoid race conditions
      const webrtcRef = webrtcConnection.current;
      const realtimeRef = realtimeChannel.current;
      
      console.log('Final connection check:', {
        webrtc: !!webrtcRef,
        realtime: !!realtimeRef,
        userId: user?.id,
        chatId: chatId
      });
      
      if (!webrtcRef) {
        console.error('WebRTC connection failed to initialize');
        throw new Error('Failed to initialize WebRTC connection');
      }
      
      if (!realtimeRef) {
        console.error('Realtime channel failed to initialize');
        throw new Error('Failed to initialize realtime channel');
      }

      // Set remote user and add tracks
      webrtcConnection.current.setRemoteUserId(contactId);
      stream.getTracks().forEach(track => {
        webrtcConnection.current?.addTrack(track, stream);
      });

      // Create and send offer
      const offer = await webrtcConnection.current.createOffer();
      realtimeChannel.current.sendCallOffer({
        sdp: offer.sdp || '',
        type: 'offer',
        from: user?.id || '',
        to: contactId,
        callType,
      });

      console.log('Call offer sent to:', contactId);

    } catch (error) {
      console.error('Call failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      endCall();
      
      // More specific error messages
      let errorMessage = "Could not start call.";
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera/microphone access denied. Please allow permissions and try again.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera or microphone found.";
      } else if (error.message.includes('WebRTC')) {
        errorMessage = "WebRTC connection failed. Please check your internet connection.";
      } else if (error.message.includes('realtime')) {
        errorMessage = "Realtime channel failed. Please try again.";
      }
      
      toast({
        title: "Call failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [user?.id, initializeWebRTC, setupRealtimeChannel, toast]);


  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    isConnected,
    isConnecting,
    localStream,
    remoteStream,
  };
};