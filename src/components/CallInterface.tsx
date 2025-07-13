import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVideoSDK } from '@/hooks/useVideoSDK';
import { VideoSDKProvider } from '@/components/VideoSDKProvider';
import { useAuth } from '@/hooks/useAuth';

interface CallInterfaceProps {
  contact: {
    id: string;
    name: string;
    avatar: string;
    callType: 'voice' | 'video';
  };
  chatId: string;
  onEndCall: () => void;
}

const CallInterfaceContent: React.FC<CallInterfaceProps> = ({ contact, chatId, onEndCall }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(contact.callType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const { user } = useAuth();

  const {
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    isConnected,
    isConnecting,
    meetingId,
    participants,
  } = useVideoSDK();

  // Start call when component mounts
  useEffect(() => {
    if (user?.id) {
      startCall(contact.id, chatId, contact.callType);
    }
  }, [contact.id, chatId, contact.callType, startCall, user?.id]);

  // Update call duration
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const handleMute = () => {
    toggleMute();
    setIsMuted(!isMuted);
  };

  const handleVideo = () => {
    toggleVideo();
    setIsVideoEnabled(!isVideoEnabled);
  };

  const handleEndCall = () => {
    endCall();
    onEndCall();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get remote participants (excluding local user)
  const remoteParticipants = participants.filter(p => p.id !== user?.id);
  const hasRemoteParticipant = remoteParticipants.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      {/* Video Background (if video call) */}
      {contact.callType === 'video' && (
        <div className="absolute inset-0">
          {/* Remote video placeholder */}
          {hasRemoteParticipant ? (
            <div className="w-full h-full bg-gradient-to-br from-purple-800 to-blue-800 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl font-bold mb-4">
                  {contact.avatar || contact.name[0]}
                </div>
                <p className="text-white/70">Video connected via VideoSDK</p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-800 to-blue-800 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl font-bold">
                {contact.avatar || contact.name[0]}
              </div>
            </div>
          )}
          
          {/* Local Video (small window) */}
          <div className="absolute top-4 right-4 w-24 h-32 bg-black/50 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="text-xs text-white/70 text-center">
              Your video
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {isConnecting && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500/20 backdrop-blur-lg border border-blue-500/30 rounded-lg p-3">
          <p className="text-sm text-white">
            Connecting to VideoSDK...
          </p>
        </div>
      )}

      {isConnected && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500/20 backdrop-blur-lg border border-green-500/30 rounded-lg p-3">
          <p className="text-sm text-white">
            Connected • Meeting ID: {meetingId}
          </p>
        </div>
      )}

      {/* Call Info */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center mb-8">
          {contact.callType === 'voice' && (
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl font-bold mb-6 mx-auto">
              {contact.avatar || contact.name[0]}
            </div>
          )}
          
          <h2 className="text-2xl font-bold mb-2">{contact.name}</h2>
          <p className="text-lg text-white/70">
            {isConnecting ? 'Connecting...' : isConnected ? formatDuration(callDuration) : 'Initiating call...'}
          </p>
          <p className="text-sm text-white/50 mt-1">
            {contact.callType === 'video' ? 'Video Call' : 'Voice Call'} • VideoSDK
          </p>
          {participants.length > 0 && (
            <p className="text-xs text-white/40 mt-2">
              {participants.length} participant{participants.length !== 1 ? 's' : ''} in call
            </p>
          )}
        </div>

        {/* Call Controls */}
        <div className="flex items-center justify-center space-x-6 mt-auto">
          {/* Mute */}
          <Button
            onClick={handleMute}
            variant="ghost"
            size="icon"
            className={`w-14 h-14 rounded-full ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6 text-white" />
            ) : (
              <Mic className="h-6 w-6 text-white" />
            )}
          </Button>

          {/* End Call */}
          <Button
            onClick={handleEndCall}
            variant="ghost"
            size="icon"
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="h-6 w-6 text-white" />
          </Button>

          {/* Speaker */}
          <Button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            variant="ghost"
            size="icon"
            className={`w-14 h-14 rounded-full ${
              isSpeakerOn ? 'bg-blue-500 hover:bg-blue-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Volume2 className="h-6 w-6 text-white" />
          </Button>
        </div>

        {/* Video Controls (if video call) */}
        {contact.callType === 'video' && (
          <div className="flex items-center justify-center space-x-4 mt-6">
            <Button
              onClick={handleVideo}
              variant="ghost"
              size="icon"
              className={`w-12 h-12 rounded-full ${
                !isVideoEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {isVideoEnabled ? (
                <Video className="h-5 w-5 text-white" />
              ) : (
                <VideoOff className="h-5 w-5 text-white" />
              )}
            </Button>
          </div>
        )}

        {/* Connection Status Animation */}
        {isConnecting && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-2">
              <div className="animate-pulse w-2 h-2 bg-white rounded-full"></div>
              <div className="animate-pulse w-2 h-2 bg-white rounded-full" style={{ animationDelay: '0.2s' }}></div>
              <div className="animate-pulse w-2 h-2 bg-white rounded-full" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CallInterface: React.FC<CallInterfaceProps> = (props) => {
  return (
    <VideoSDKProvider
      participantId={props.contact.id}
      displayName={props.contact.name}
    >
      <CallInterfaceContent {...props} />
    </VideoSDKProvider>
  );
};

export default CallInterface;