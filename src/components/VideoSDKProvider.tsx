import React from 'react';
import { MeetingProvider } from '@videosdk.live/react-sdk';

interface VideoSDKProviderProps {
  children: React.ReactNode;
  meetingId?: string;
  participantId?: string;
  displayName?: string;
  token?: string;
}

export const VideoSDKProvider: React.FC<VideoSDKProviderProps> = ({
  children,
  meetingId,
  participantId,
  displayName = 'User',
  token,
}) => {
  const config = {
    meetingId: meetingId || '',
    micEnabled: true,
    webcamEnabled: true,
    name: displayName,
    participantId: participantId,
    debugMode: false,
  };

  if (!token) {
    return <div>Loading VideoSDK...</div>;
  }

  return (
    <MeetingProvider
      config={config}
      token={token}
    >
      {children}
    </MeetingProvider>
  );
};