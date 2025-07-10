
import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, Speaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useWebRTC } from '@/hooks/useWebRTC';

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
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(contact.callType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const { toast } = useToast();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const {
    startCall,
    endCall,
    toggleMute: webRTCToggleMute,
    toggleVideo: webRTCToggleVideo,
    isConnected,
    isConnecting,
    localStream,
    remoteStream,
  } = useWebRTC();

  // Start the call when component mounts (only once)
  useEffect(() => {
    if (!isConnecting && !isConnected) {
      startCall(contact.id, chatId, contact.callType);
    }
  }, []); // Empty dependency array to run only once

  // Call duration timer
  useEffect(() => {
    let durationTimer: NodeJS.Timeout;
    
    if (isConnected) {
      durationTimer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (durationTimer) {
        clearInterval(durationTimer);
      }
    };
  }, [isConnected]);

  // Set up local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set up remote video stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleMute = () => {
    webRTCToggleMute();
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    webRTCToggleVideo();
    setIsVideoOn(!isVideoOn);
  };

  const handleEndCall = () => {
    endCall();
    onEndCall();
  };

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
          {/* Remote video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover bg-gradient-to-br from-purple-800 to-blue-800"
          />
          
          {/* Fallback when no remote stream */}
          {!remoteStream && (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-800 to-blue-800 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl font-bold">
                {contact.avatar}
              </div>
            </div>
          )}
          
          {/* Local Video (small window) */}
          <div className="absolute top-4 right-4 w-24 h-32 bg-black/50 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Connection Status Warning */}
      {!isConnected && !isConnecting && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500/20 backdrop-blur-lg border border-red-500/30 rounded-lg p-3">
          <p className="text-sm text-white">
            Call failed to connect
          </p>
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
            {isConnecting ? 'Connecting...' : !isConnected ? 'Calling...' : `${formatDuration(callDuration)}`}
          </p>
          <p className="text-sm text-white/50 mt-1">
            {contact.callType === 'video' ? 'Video Call' : 'Voice Call'}
          </p>
        </div>

        {/* Call Controls */}
        <div className="flex items-center justify-center space-x-6 mt-auto">
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
              onClick={toggleVideo}
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
        {(isConnecting || !isConnected) && (
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
