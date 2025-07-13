import React from 'react';
import { MeetingProvider } from '@videosdk.live/react-sdk';

interface VideoSDKProviderProps {
  children: React.ReactNode;
  meetingId?: string;
  participantId?: string;
  displayName?: string;
}

// VideoSDK configuration
const VIDEOSDK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI2ZmY0YWM4OS1mNjlmLTQ4ZTMtYjc4Zi1kNzlmNmY2ZjZmNmYiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTY5MDM2MDA2MCwiZXhwIjoxNjkwNDQ2NDYwfQ.example"; // This should come from your backend

export const VideoSDKProvider: React.FC<VideoSDKProviderProps> = ({
  children,
  meetingId,
  participantId,
  displayName = 'User',
}) => {
  const config = {
    meetingId: meetingId || '',
    micEnabled: true,
    webcamEnabled: true,
    name: displayName,
    participantId: participantId,
    debugMode: false,
  };

  return (
    <MeetingProvider
      config={config}
      token={VIDEOSDK_TOKEN}
    >
      {children}
    </MeetingProvider>
  );
};