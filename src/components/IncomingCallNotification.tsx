import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IncomingCallNotificationProps {
  caller: {
    id: string;
    name: string;
    avatar: string;
  };
  callType: 'voice' | 'video';
  onAccept: () => void;
  onDecline: () => void;
}

const IncomingCallNotification: React.FC<IncomingCallNotificationProps> = ({
  caller,
  callType,
  onAccept,
  onDecline,
}) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center z-50">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      {/* Incoming Call UI */}
      <div className="relative z-10 text-center">
        {/* Caller Avatar */}
        <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-6 mx-auto animate-pulse">
          {caller.avatar}
        </div>
        
        {/* Call Info */}
        <h2 className="text-3xl font-bold text-white mb-2">{caller.name}</h2>
        <p className="text-lg text-white/70 mb-2">
          Incoming {callType === 'video' ? 'video' : 'voice'} call
        </p>
        
        {/* Call Type Icon */}
        <div className="mb-8">
          {callType === 'video' ? (
            <Video className="h-8 w-8 text-white/60 mx-auto" />
          ) : (
            <Phone className="h-8 w-8 text-white/60 mx-auto" />
          )}
        </div>
        
        {/* Call Actions */}
        <div className="flex items-center justify-center space-x-8">
          {/* Decline */}
          <Button
            onClick={onDecline}
            variant="ghost"
            size="icon"
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
          
          {/* Accept */}
          <Button
            onClick={onAccept}
            variant="ghost"
            size="icon"
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white"
          >
            <Phone className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Instructions */}
        <p className="text-sm text-white/40 mt-6">
          Swipe or tap to answer
        </p>
      </div>
      
      {/* Ripple Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-64 h-64 border border-white/20 rounded-full animate-ping"></div>
          <div className="w-48 h-48 border border-white/30 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          <div className="w-32 h-32 border border-white/40 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallNotification;