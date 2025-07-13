import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJitsiMeet } from '@/hooks/useJitsiMeet';
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

const CallInterface: React.FC<CallInterfaceProps> = ({ contact, chatId, onEndCall }) => {
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
    isMuted,
    isVideoOn,
    containerRef,
  } = useJitsiMeet();

  // Start call when component mounts
  useEffect(() => {
    if (user?.id) {
      console.log('CallInterface: Starting call for user:', user.id);
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

  const handleEndCall = () => {
    endCall();
    onEndCall();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      {/* Jitsi Meet Container */}
      {isConnected && (
        <div 
          ref={containerRef}
          className="absolute inset-0 w-full h-full"
        />
      )}
      
      {/* Call Info Overlay (when not connected) */}
      {!isConnected && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          <div className="text-center mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl font-bold mb-6 mx-auto">
              {contact.avatar || contact.name[0]}
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{contact.name}</h2>
            <p className="text-lg text-white/70">
              {isConnecting ? 'Connecting...' : 'Initializing...'}
            </p>
            <p className="text-sm text-white/50 mt-1">
              {contact.callType === 'video' ? 'Video Call' : 'Voice Call'} • Jitsi Meet
            </p>
            {participants.length > 0 && (
              <p className="text-xs text-white/40 mt-2">
                {participants.length} participant{participants.length !== 1 ? 's' : ''} in call
              </p>
            )}
          </div>

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
      )}

      {/* Connection Status */}
      {isConnecting && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500/20 backdrop-blur-lg border border-blue-500/30 rounded-lg p-3 z-50">
          <p className="text-sm text-white">
            Connecting to Jitsi Meet...
          </p>
        </div>
      )}

      {isConnected && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500/20 backdrop-blur-lg border border-green-500/30 rounded-lg p-3 z-50">
          <p className="text-sm text-white">
            Connected • {formatDuration(callDuration)}
          </p>
        </div>
      )}

      {/* Call Controls Overlay */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center justify-center space-x-6">
          {/* Mute */}
          <Button
            onClick={toggleMute}
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

          {/* Video Controls (if video call) */}
          {contact.callType === 'video' && (
            <Button
              onClick={toggleVideo}
              variant="ghost"
              size="icon"
              className={`w-14 h-14 rounded-full ${
                !isVideoOn ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {isVideoOn ? (
                <Video className="h-6 w-6 text-white" />
              ) : (
                <VideoOff className="h-6 w-6 text-white" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-20 left-4 bg-black/50 backdrop-blur-lg rounded-lg p-2 text-xs z-50">
          <p>Meeting ID: {meetingId || 'Not set'}</p>
          <p>Participants: {participants.length}</p>
          <p>Connecting: {isConnecting ? 'Yes' : 'No'}</p>
          <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
          <p>Muted: {isMuted ? 'Yes' : 'No'}</p>
          <p>Video: {isVideoOn ? 'On' : 'Off'}</p>
        </div>
      )}
    </div>
  );
};

export default CallInterface;