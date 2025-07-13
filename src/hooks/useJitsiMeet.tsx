import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export const useJitsiMeet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  
  const apiRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Jitsi Meet External API script
  useEffect(() => {
    const loadJitsiScript = () => {
      if (window.JitsiMeetExternalAPI) return Promise.resolve();

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    loadJitsiScript().catch((error) => {
      console.error('Failed to load Jitsi Meet script:', error);
      toast({
        title: "Failed to load video calling",
        description: "Could not load Jitsi Meet. Please refresh and try again.",
        variant: "destructive",
      });
    });
  }, [toast]);

  const startCall = useCallback(async (contactId: string, chatId: string, callType: 'voice' | 'video') => {
    try {
      console.log('Jitsi: Starting call:', { contactId, chatId, callType });
      setIsConnecting(true);

      if (!window.JitsiMeetExternalAPI) {
        throw new Error('Jitsi Meet API not loaded');
      }

      if (!containerRef.current) {
        throw new Error('Container not ready');
      }

      // Generate a unique room name
      const roomName = `chat_${chatId}_${Date.now()}`;
      setMeetingId(roomName);

      // Configure Jitsi Meet
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: callType === 'voice',
          prejoinPageEnabled: false,
          disableModeratorIndicator: true,
          startScreenSharing: false,
          enableEmailInStats: false,
        },
        interfaceConfigOverwrite: {
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          DISABLE_PRESENCE_STATUS: true,
          HIDE_INVITE_MORE_HEADER: true,
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'hangup',
            'fodeviceselection',
            'shortcuts',
            'settings'
          ],
        },
        userInfo: {
          displayName: user?.email?.split('@')[0] || 'User',
        }
      };

      // Create Jitsi Meet instance
      apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', options);

      // Set up event listeners
      apiRef.current.addEventListener('videoConferenceJoined', () => {
        console.log('Jitsi: Meeting joined successfully');
        setIsConnected(true);
        setIsConnecting(false);
        toast({
          title: "Call connected",
          description: "Video call is now active",
        });
      });

      apiRef.current.addEventListener('videoConferenceLeft', () => {
        console.log('Jitsi: Meeting left');
        setIsConnected(false);
        setIsConnecting(false);
        setMeetingId(null);
      });

      apiRef.current.addEventListener('participantJoined', (participant: any) => {
        console.log('Jitsi: Participant joined:', participant.displayName);
        setParticipants(prev => [...prev, participant]);
        toast({
          title: "Participant joined",
          description: `${participant.displayName} joined the call`,
        });
      });

      apiRef.current.addEventListener('participantLeft', (participant: any) => {
        console.log('Jitsi: Participant left:', participant.displayName);
        setParticipants(prev => prev.filter(p => p.id !== participant.id));
        toast({
          title: "Participant left",
          description: `${participant.displayName} left the call`,
        });
      });

      apiRef.current.addEventListener('audioMuteStatusChanged', (event: any) => {
        setIsMuted(event.muted);
      });

      apiRef.current.addEventListener('videoMuteStatusChanged', (event: any) => {
        setIsVideoOn(!event.muted);
      });

      // Handle errors
      apiRef.current.addEventListener('error', (error: any) => {
        console.error('Jitsi error:', error);
        setIsConnecting(false);
        toast({
          title: "Call failed",
          description: error.message || "Failed to connect to video call",
          variant: "destructive",
        });
      });

    } catch (error: any) {
      console.error('Jitsi: Call failed:', error);
      setIsConnecting(false);
      
      toast({
        title: "Call failed",
        description: error.message || "Could not start video call. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const endCall = useCallback(() => {
    console.log('Ending Jitsi call');
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setMeetingId(null);
    setParticipants([]);
  }, []);

  const toggleMute = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleAudio');
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleVideo');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, []);

  return {
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    isConnected,
    isConnecting,
    meetingId,
    participants,
    isMuted,
    isVideoOn,
    containerRef,
  };
};