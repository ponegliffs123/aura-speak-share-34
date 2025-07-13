import { useState, useCallback, useEffect } from 'react';
import { useMeeting, usePubSub } from '@videosdk.live/react-sdk';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export const useVideoSDK = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [meetingId, setMeetingId] = useState<string | null>(null);

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
      console.log('Meeting joined successfully');
      setIsConnected(true);
      setIsConnecting(false);
      toast({
        title: "Call connected",
        description: "Video call is now active",
      });
    },
    onMeetingLeft: () => {
      console.log('Meeting left');
      setIsConnected(false);
      setIsConnecting(false);
      setMeetingId(null);
    },
    onParticipantJoined: (participant) => {
      console.log('Participant joined:', participant.displayName);
    },
    onParticipantLeft: (participant) => {
      console.log('Participant left:', participant.displayName);
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
      const response = await fetch('/api/videosdk/create-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create meeting');
      }

      const data = await response.json();
      return data.meetingId;
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }, [user?.id]);

  const startCall = useCallback(async (contactId: string, chatId: string, callType: 'voice' | 'video') => {
    try {
      console.log('Starting VideoSDK call:', { contactId, chatId, callType });
      setIsConnecting(true);

      // Create a new meeting
      const newMeetingId = await createMeeting();
      setMeetingId(newMeetingId);

      // Send meeting invitation through Supabase realtime
      // This will be handled by the existing realtime infrastructure
      
      // Join the meeting
      join();

      console.log('VideoSDK call initiated with meeting ID:', newMeetingId);

    } catch (error) {
      console.error('VideoSDK call failed:', error);
      setIsConnecting(false);
      
      toast({
        title: "Call failed",
        description: "Could not start video call. Please try again.",
        variant: "destructive",
      });
    }
  }, [createMeeting, join, toast]);

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

  return {
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    isConnected,
    isConnecting,
    localStream,
    remoteStream,
    meetingId: currentMeetingId,
    participants: Array.from(participants.values()),
  };
};