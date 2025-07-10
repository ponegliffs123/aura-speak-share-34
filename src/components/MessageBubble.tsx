
import React from 'react';
import { Download, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MessageStatusIndicator from './MessageStatusIndicator';

interface Message {
  id: string;
  text?: string;
  mediaUrl?: string;
  timestamp: string;
  sent: boolean;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  fileName?: string;
  fileSize?: string;
  status?: 'sending' | 'delivered' | 'read';
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isFromMe = message.sent;
  
  const bubbleClasses = `
    max-w-xs p-3 rounded-2xl relative
    ${isFromMe 
      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white ml-auto' 
      : 'bg-white/10 text-white backdrop-blur-sm'
    }
  `;

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-2">
            <img
              src={message.mediaUrl}
              alt="Shared image"
              className="w-full h-48 object-cover rounded-lg"
            />
            {message.text && <p className="text-sm">{message.text}</p>}
          </div>
        );
      
      case 'video':
        return (
          <div className="space-y-2">
            <div className="relative w-full h-48 bg-black/50 rounded-lg flex items-center justify-center">
              <video
                src={message.mediaUrl}
                className="w-full h-full object-cover rounded-lg"
                poster={message.mediaUrl}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute text-white hover:bg-white/20"
              >
                <Play className="h-8 w-8" />
              </Button>
            </div>
            {message.text && <p className="text-sm">{message.text}</p>}
          </div>
        );
      
      case 'audio':
        return (
          <div className="flex items-center space-x-3 p-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <Play className="h-5 w-5" />
            </Button>
            <div className="flex-1 h-2 bg-white/20 rounded-full">
              <div className="w-1/3 h-full bg-purple-400 rounded-full"></div>
            </div>
            <span className="text-xs text-white/70">0:45</span>
          </div>
        );
      
      case 'file':
        return (
          <div className="flex items-center space-x-3 p-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{message.fileName}</p>
              <p className="text-xs text-white/60">{message.fileSize}</p>
            </div>
          </div>
        );
      
      default:
        return <p className="text-sm">{message.text}</p>;
    }
  };

  return (
    <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
      <div className={bubbleClasses}>
        {renderContent()}
        <div className={`flex items-center justify-between mt-1`}>
          <div className={`text-xs ${isFromMe ? 'text-white/70' : 'text-white/50'}`}>
            {message.timestamp}
          </div>
          <MessageStatusIndicator 
            status={message.status || 'delivered'} 
            isOwnMessage={isFromMe} 
          />
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
