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

  const initializeWebRTC = useCallback(() => {
    if (!user?.id || webrtcConnection.current) return;

    webrtcConnection.current = new WebRTCConnection(rtcConfig, user.id);
    webrtcConnection.current.initialize();

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
  }, [user?.id]);

  const setupRealtimeChannel = useCallback((chatId: string) => {
    if (!user?.id || realtimeChannel.current) return;

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
              initializeWebRTC();
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
  }, [user?.id, initializeWebRTC]);

  const startCall = useCallback(async (contactId: string, chatId: string, callType: 'voice' | 'video') => {
    try {
      console.log('Starting call:', { contactId, chatId, callType });
      setIsConnecting(true);
      
      // Get user media
      const constraints = {
        audio: true,
        video: callType === 'video'
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      console.log('Got local stream:', stream);

      // Initialize connections
      initializeWebRTC();
      setupRealtimeChannel(chatId);
      
      // Set remote user ID
      webrtcConnection.current?.setRemoteUserId(contactId);

      // Wait a bit for channel to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        webrtcConnection.current?.addTrack(track, stream);
      });

      // Create and send offer
      const offer = await webrtcConnection.current?.createOffer();
      if (offer && realtimeChannel.current) {
        realtimeChannel.current.sendCallOffer({
          sdp: offer.sdp || '',
          type: 'offer',
          from: user?.id || '',
          to: contactId,
          callType,
        });
      } else {
        throw new Error('Failed to create offer or realtime channel not ready');
      }

      toast({
        title: "Call initiated",
        description: `${callType === 'video' ? 'Video' : 'Voice'} call started`,
      });

    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: "Call failed",
        description: "Failed to start call. Please check your permissions.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  }, [user?.id, initializeWebRTC, setupRealtimeChannel, toast]);

  const endCall = useCallback(() => {
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