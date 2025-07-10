import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface CallOffer {
  sdp: string;
  type: 'offer' | 'answer';
  from: string;
  to: string;
  callType: 'voice' | 'video';
}

interface IceCandidate {
  candidate: string;
  sdpMLineIndex: number;
  sdpMid: string;
  from: string;
  to: string;
}

export const useWebRTC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const initializePeerConnection = useCallback(() => {
    if (peerConnection.current) return;

    peerConnection.current = new RTCPeerConnection(rtcConfig);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
            from: user?.id,
          },
        });
      }
    };

    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current?.connectionState;
      setIsConnected(state === 'connected');
      setIsConnecting(state === 'connecting');
      
      if (state === 'disconnected' || state === 'failed') {
        endCall();
      }
    };
  }, [user?.id]);

  const setupRealtimeChannel = useCallback((chatId: string) => {
    if (channelRef.current) return;

    channelRef.current = supabase.channel(`call-${chatId}`)
      .on('broadcast', { event: 'call-offer' }, async (payload) => {
        const offer: CallOffer = payload.payload;
        if (offer.to === user?.id && peerConnection.current) {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription({
            type: offer.type,
            sdp: offer.sdp,
          }));

          if (offer.type === 'offer') {
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            channelRef.current.send({
              type: 'broadcast',
              event: 'call-offer',
              payload: {
                sdp: answer.sdp,
                type: 'answer',
                from: user?.id,
                to: offer.from,
                callType: offer.callType,
              },
            });
          }
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async (payload) => {
        const candidate: IceCandidate = payload.payload;
        if (candidate.to === user?.id && peerConnection.current) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate({
            candidate: candidate.candidate,
            sdpMLineIndex: candidate.sdpMLineIndex,
            sdpMid: candidate.sdpMid,
          }));
        }
      })
      .on('broadcast', { event: 'call-end' }, () => {
        endCall();
      })
      .subscribe();
  }, [user?.id]);

  const startCall = useCallback(async (contactId: string, chatId: string, callType: 'voice' | 'video') => {
    try {
      setIsConnecting(true);
      
      // Get user media
      const constraints = {
        audio: true,
        video: callType === 'video'
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      // Initialize peer connection
      initializePeerConnection();
      setupRealtimeChannel(chatId);

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream);
      });

      // Create offer
      const offer = await peerConnection.current!.createOffer();
      await peerConnection.current!.setLocalDescription(offer);

      // Send offer through realtime
      channelRef.current.send({
        type: 'broadcast',
        event: 'call-offer',
        payload: {
          sdp: offer.sdp,
          type: 'offer',
          from: user?.id,
          to: contactId,
          callType,
        },
      });

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
  }, [user?.id, initializePeerConnection, setupRealtimeChannel, toast]);

  const endCall = useCallback(() => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Clean up realtime channel
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'call-end',
        payload: { from: user?.id },
      });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setRemoteStream(null);
    setIsConnected(false);
    setIsConnecting(false);
  }, [localStream, user?.id]);

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