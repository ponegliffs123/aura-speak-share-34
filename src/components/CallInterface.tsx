
import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, Speaker } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallInterfaceProps {
  contact: {
    id: string;
    name: string;
    avatar: string;
    callType: 'voice' | 'video';
  };
  onEndCall: () => void;
}

const CallInterface: React.FC<CallInterfaceProps> = ({ contact, onEndCall }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(contact.callType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnected(true);
    }, 3000);

    const durationTimer = setInterval(() => {
      if (isConnected) {
        setCallDuration(prev => prev + 1);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(durationTimer);
    };
  }, [isConnected]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      {/* Video Background (if video call) */}
      {contact.callType === 'video' && (
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gradient-to-br from-purple-800 to-blue-800 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl font-bold">
              {contact.avatar}
            </div>
          </div>
          
          {/* Self Video (small window) */}
          <div className="absolute top-4 right-4 w-24 h-32 bg-black/50 rounded-lg flex items-center justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-xs font-bold">
              ME
            </div>
          </div>
        </div>
      )}

      {/* Call Info */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center mb-8">
          {contact.callType === 'voice' && (
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl font-bold mb-6 mx-auto">
              {contact.avatar}
            </div>
          )}
          
          <h2 className="text-2xl font-bold mb-2">{contact.name}</h2>
          <p className="text-lg text-white/70">
            {!isConnected ? 'Calling...' : `${formatDuration(callDuration)}`}
          </p>
          <p className="text-sm text-white/50 mt-1">
            {contact.callType === 'video' ? 'Video Call' : 'Voice Call'}
          </p>
        </div>

        {/* Call Controls */}
        <div className="flex items-center justify-center space-x-6 mt-auto">
          {/* Mute */}
          <Button
            onClick={() => setIsMuted(!isMuted)}
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
            onClick={onEndCall}
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
            {isSpeakerOn ? (
              <Speaker className="h-6 w-6 text-white" />
            ) : (
              <Volume2 className="h-6 w-6 text-white" />
            )}
          </Button>
        </div>

        {/* Video Controls (if video call) */}
        {contact.callType === 'video' && (
          <div className="flex items-center justify-center space-x-4 mt-6">
            <Button
              onClick={() => setIsVideoOn(!isVideoOn)}
              variant="ghost"
              size="icon"
              className={`w-12 h-12 rounded-full ${
                !isVideoOn ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {isVideoOn ? (
                <Video className="h-5 w-5 text-white" />
              ) : (
                <VideoOff className="h-5 w-5 text-white" />
              )}
            </Button>
          </div>
        )}

        {/* Connection Status */}
        {!isConnected && (
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

export default CallInterface;
