import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// VideoSDK types
interface VideoSDKParticipant {
  id: string;
  displayName: string;
  webcamOn: boolean;
  micOn: boolean;
}

interface VideoSDKMeeting {
  join: () => void;
  leave: () => void;
  muteMic: () => void;
  unmuteMic: () => void;
  enableWebcam: () => void;
  disableWebcam: () => void;
  localParticipant: VideoSDKParticipant;
  participants: Map<string, VideoSDKParticipant>;
  on: (event: string, callback: (data: any) => void) => void;
}

declare global {
  interface Window {
    VideoSDK: {
      config: (token: string) => void;
      initMeeting: (config: {
        meetingId: string;
        name: string;
        micEnabled: boolean;
        webcamEnabled: boolean;
      }) => VideoSDKMeeting;
    };
  }
}

export const useVideoSDKMeeting = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [participants, setParticipants] = useState<VideoSDKParticipant[]>([]);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isWebcamOn, setIsWebcamOn] = useState(false);
  const meetingRef = useRef<VideoSDKMeeting | null>(null);

  // Create a new meeting and get token
  const createMeeting = useCallback(async () => {
    try {
      console.log('VideoSDK: Creating meeting for user:', user?.id);
      const { data, error } = await supabase.functions.invoke('videosdk-auth', {
        body: { userId: user?.id }
      });

      if (error) {
        console.error('VideoSDK: Error from edge function:', error);
        throw error;
      }

      console.log('VideoSDK: Meeting created successfully:', data);
      return { token: data.token, meetingId: data.meetingId };
    } catch (error) {
      console.error('VideoSDK: Error creating meeting:', error);
      throw error;
    }
  }, [user?.id]);

  // Initialize VideoSDK
  const initializeVideoSDK = useCallback(async (callType: 'voice' | 'video') => {
    try {
      console.log('VideoSDK: Initializing...');
      
      // Check if VideoSDK is loaded
      if (!window.VideoSDK) {
        throw new Error('VideoSDK not loaded. Please include the VideoSDK script.');
      }

      // Create meeting and get token
      const meetingData = await createMeeting();
      setToken(meetingData.token);
      setMeetingId(meetingData.meetingId);

      // Configure VideoSDK with token
      console.log('VideoSDK: Configuring with token');
      window.VideoSDK.config(meetingData.token);

      // Initialize meeting
      console.log('VideoSDK: Initializing meeting with ID:', meetingData.meetingId);
      const meeting = window.VideoSDK.initMeeting({
        meetingId: meetingData.meetingId,
        name: user?.email || 'User',
        micEnabled: true,
        webcamEnabled: callType === 'video',
      });

      meetingRef.current = meeting;

      // Set up event listeners
      meeting.on('meeting-joined', () => {
        console.log('VideoSDK: Meeting joined successfully');
        setIsConnected(true);
        setIsConnecting(false);
        toast({
          title: "Call connected",
          description: "Video call is now active",
        });
      });

      meeting.on('meeting-left', () => {
        console.log('VideoSDK: Meeting left');
        setIsConnected(false);
        setIsConnecting(false);
        setMeetingId(null);
        setParticipants([]);
      });

      meeting.on('participant-joined', (participant: VideoSDKParticipant) => {
        console.log('VideoSDK: Participant joined:', participant.displayName);
        setParticipants(prev => [...prev, participant]);
        toast({
          title: "Participant joined",
          description: `${participant.displayName} joined the call`,
        });
      });

      meeting.on('participant-left', (participant: VideoSDKParticipant) => {
        console.log('VideoSDK: Participant left:', participant.displayName);
        setParticipants(prev => prev.filter(p => p.id !== participant.id));
        toast({
          title: "Participant left",
          description: `${participant.displayName} left the call`,
        });
      });

      // Join the meeting
      console.log('VideoSDK: Joining meeting...');
      meeting.join();

    } catch (error) {
      console.error('VideoSDK: Initialization failed:', error);
      setIsConnecting(false);
      toast({
        title: "Call failed",
        description: error.message || "Failed to initialize video call",
        variant: "destructive",
      });
    }
  }, [createMeeting, user?.email, toast]);

  const startCall = useCallback(async (contactId: string, chatId: string, callType: 'voice' | 'video') => {
    try {
      console.log('VideoSDK: Starting call:', { contactId, chatId, callType });
      setIsConnecting(true);
      await initializeVideoSDK(callType);
    } catch (error) {
      console.error('VideoSDK: Call failed:', error);
      setIsConnecting(false);
      toast({
        title: "Call failed",
        description: "Could not start video call. Please try again.",
        variant: "destructive",
      });
    }
  }, [initializeVideoSDK, toast]);

  const endCall = useCallback(() => {
    console.log('VideoSDK: Ending call');
    if (meetingRef.current) {
      meetingRef.current.leave();
    }
    setMeetingId(null);
    setToken(null);
    setParticipants([]);
  }, []);

  const toggleMute = useCallback(() => {
    if (meetingRef.current) {
      if (isMicOn) {
        meetingRef.current.muteMic();
        setIsMicOn(false);
      } else {
        meetingRef.current.unmuteMic();
        setIsMicOn(true);
      }
    }
  }, [isMicOn]);

  const toggleVideo = useCallback(() => {
    if (meetingRef.current) {
      if (isWebcamOn) {
        meetingRef.current.disableWebcam();
        setIsWebcamOn(false);
      } else {
        meetingRef.current.enableWebcam();
        setIsWebcamOn(true);
      }
    }
  }, [isWebcamOn]);

  return {
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    isConnected,
    isConnecting,
    meetingId,
    participants,
    token,
    isMicOn,
    isWebcamOn,
  };
};