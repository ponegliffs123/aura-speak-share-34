import { useState, useCallback, useEffect } from 'react';
import { useMeeting, usePubSub } from '@videosdk.live/react-sdk';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useVideoSDK = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // VideoSDK meeting configuration
  const {
    join,
    leave,
    toggleMic,
    toggleWebcam,
    participants,
    localParticipant,
    meetingId: currentMeetingId,
  } = useMeeting({
    onMeetingJoined: () => {
      console.log('VideoSDK: Meeting joined successfully');
      setIsConnected(true);
      setIsConnecting(false);
      toast({
        title: "Call connected",
        description: "Video call is now active",
      });
    },
    onMeetingLeft: () => {
      console.log('VideoSDK: Meeting left');
      setIsConnected(false);
      setIsConnecting(false);
      setMeetingId(null);
    },
    onParticipantJoined: (participant) => {
      console.log('VideoSDK: Participant joined:', participant.displayName);
      toast({
        title: "Participant joined",
        description: `${participant.displayName} joined the call`,
      });
    },
    onParticipantLeft: (participant) => {
      console.log('VideoSDK: Participant left:', participant.displayName);
      toast({
        title: "Participant left",
        description: `${participant.displayName} left the call`,
      });
    },
    onError: (error) => {
      console.error('VideoSDK error:', error);
      setIsConnecting(false);
      toast({
        title: "Call failed",
        description: error.message || "Failed to connect to video call",
        variant: "destructive",
      });
    },
  });

  // Create a new meeting
  const createMeeting = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('videosdk-auth', {
        body: { userId: user?.id }
      });

      if (error) {
        throw error;
      }

      return { token: data.token, meetingId: data.meetingId };
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }, [user?.id]);

  const startCall = useCallback(async (contactId: string, chatId: string, callType: 'voice' | 'video') => {
    try {
      console.log('VideoSDK: Starting call:', { contactId, chatId, callType });
      setIsConnecting(true);

      // Create a new meeting and get token
      const meetingData = await createMeeting();
      console.log('VideoSDK: Meeting created:', meetingData);
      
      setMeetingId(meetingData.meetingId);
      setToken(meetingData.token);

      // Send meeting invitation through Supabase realtime
      // This will be handled by the existing realtime infrastructure
      
      // Join the meeting (this will happen in VideoSDKProvider when token is available)
      console.log('VideoSDK: About to join meeting with token');

    } catch (error) {
      console.error('VideoSDK: Call failed:', error);
      setIsConnecting(false);
      
      toast({
        title: "Call failed",
        description: error.message || "Could not start video call. Please try again.",
        variant: "destructive",
      });
    }
  }, [createMeeting, toast]);

  const endCall = useCallback(() => {
    console.log('Ending VideoSDK call');
    leave();
    setMeetingId(null);
  }, [leave]);

  const toggleMute = useCallback(() => {
    toggleMic();
  }, [toggleMic]);

  const toggleVideo = useCallback(() => {
    toggleWebcam();
  }, [toggleWebcam]);

  // Get local and remote streams
  const localStream = localParticipant?.webcamOn ? localParticipant : null;
  const remoteStreams = Array.from(participants.values())
    .filter(p => p.id !== localParticipant?.id && p.webcamOn);
  const remoteStream = remoteStreams[0] || null;

  // Auto-join when token and meetingId are available
  useEffect(() => {
    if (token && meetingId && !isConnected && !isConnecting) {
      console.log('VideoSDK: Auto-joining meeting with ID:', meetingId);
      join();
    }
  }, [token, meetingId, isConnected, isConnecting, join]);

  return {
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    isConnected,
    isConnecting,
    localStream,
    remoteStream,
    meetingId: currentMeetingId || meetingId,
    participants: Array.from(participants.values()),
    token,
  };
};