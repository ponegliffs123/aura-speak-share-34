
import React, { useState } from 'react';
import { Download, Play, MoreVertical, Trash2, RotateCcw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MessageStatusIndicator from './MessageStatusIndicator';
import FileViewer from './FileViewer';

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
  onDeleteMessage?: (messageId: string, deleteForEveryone: boolean) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onDeleteMessage }) => {
  const isFromMe = message.sent;
  const [showMenu, setShowMenu] = useState(false);
  const [showFileViewer, setShowFileViewer] = useState(false);
  
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
            <div className="relative group">
              <img
                src={message.mediaUrl}
                alt="Shared image"
                className="w-full h-48 object-cover rounded-lg cursor-pointer"
                onClick={() => setShowFileViewer(true)}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFileViewer(true)}
                  className="text-white hover:bg-white/20"
                >
                  <Eye className="h-6 w-6" />
                </Button>
              </div>
            </div>
            {message.text && <p className="text-sm">{message.text}</p>}
          </div>
        );
      
      case 'video':
        return (
          <div className="space-y-2">
            <div className="relative w-full h-48 bg-black/50 rounded-lg flex items-center justify-center group cursor-pointer"
                 onClick={() => setShowFileViewer(true)}>
              <video
                src={message.mediaUrl}
                className="w-full h-full object-cover rounded-lg"
                poster={message.mediaUrl}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <Play className="h-8 w-8" />
                </Button>
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <Eye className="h-6 w-6" />
                </Button>
              </div>
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
          <div className="flex items-center space-x-3 p-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors"
               onClick={() => setShowFileViewer(true)}>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{message.fileName}</p>
              <p className="text-xs text-white/60">{message.fileSize}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      
      default:
        return <p className="text-sm">{message.text}</p>;
    }
  };

  const handleDeleteForEveryone = () => {
    if (onDeleteMessage) {
      onDeleteMessage(message.id, true);
    }
    setShowMenu(false);
  };

  const handleDeleteForMe = () => {
    if (onDeleteMessage) {
      onDeleteMessage(message.id, false);
    }
    setShowMenu(false);
  };

  const getFileForViewer = () => {
    if (!message.mediaUrl && !message.fileName) return null;
    
    return {
      id: message.id,
      type: message.type as 'image' | 'video' | 'audio' | 'document',
      url: message.mediaUrl || '',
      name: message.fileName || `${message.type}_${message.id}`,
      size: message.fileSize,
    };
  };

  return (
    <>
      <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} group`}>
      <div className={`${bubbleClasses} relative`}>
        {renderContent()}
        <div className={`flex items-center justify-between mt-1`}>
          <div className={`text-xs ${isFromMe ? 'text-white/70' : 'text-white/50'}`}>
            {message.timestamp}
          </div>
          <div className="flex items-center space-x-1">
            <MessageStatusIndicator 
              status={message.status || 'delivered'} 
              isOwnMessage={isFromMe} 
            />
            {isFromMe && (
              <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:bg-white/10"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-lg border-white/10">
                  <DropdownMenuItem 
                    onClick={handleDeleteForEveryone}
                    className="text-red-400 hover:bg-red-900/20 cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete for everyone</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDeleteForMe}
                    className="text-yellow-400 hover:bg-yellow-900/20 cursor-pointer"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    <span>Remove for you</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>

    <FileViewer
      isOpen={showFileViewer}
      onClose={() => setShowFileViewer(false)}
      file={getFileForViewer()}
    />
  </>
  );
};

export default MessageBubble;
