import React, { useState, useRef } from 'react';
import { ArrowLeft, Phone, Video, Camera, Mic, Send, Paperclip, Smile, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MessageBubble from './MessageBubble';
import MediaPicker from './MediaPicker';

interface Message {
  id: string;
  text?: string;
  mediaUrl?: string;
  timestamp: string;
  sent: boolean;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  fileName?: string;
  fileSize?: string;
}

interface ChatWindowProps {
  chatId: string;
  onBack: () => void;
  onStartCall: (contact: any, type: 'voice' | 'video') => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, onBack, onStartCall }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contact = {
    id: chatId,
    name: 'Sarah Johnson',
    avatar: 'SJ',
    online: true,
    lastSeen: 'online'
  };

  const messages: Message[] = [
    {
      id: '1',
      text: 'Hey! How are you doing?',
      timestamp: '2:30 PM',
      sent: false,
      type: 'text' as const
    },
    {
      id: '2',
      text: 'I\'m doing great! Just finished my workout 💪',
      timestamp: '2:31 PM',
      sent: true,
      type: 'text' as const
    },
    {
      id: '3',
      text: 'That\'s awesome! I should start working out too',
      timestamp: '2:32 PM',
      sent: false,
      type: 'text' as const
    },
    {
      id: '4',
      text: 'Check out this cool photo I took!',
      timestamp: '2:33 PM',
      sent: true,
      type: 'text' as const
    },
    {
      id: '5',
      mediaUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
      timestamp: '2:34 PM',
      sent: true,
      type: 'image' as const
    }
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
      // Handle file upload logic here
    }
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      console.log('Stopping voice recording');
      setIsRecording(false);
    } else {
      console.log('Starting voice recording');
      setIsRecording(true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-semibold">
                {contact.avatar}
              </div>
              {contact.online && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-gray-900"></div>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-white">{contact.name}</h2>
              <p className="text-xs text-white/60">{contact.lastSeen}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onStartCall(contact, 'voice')}
              className="text-white hover:bg-white/10"
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onStartCall(contact, 'video')}
              className="text-white hover:bg-white/10"
            >
              <Video className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Media Picker */}
      {showMediaPicker && (
        <MediaPicker
          onClose={() => setShowMediaPicker(false)}
          onMediaSelect={(media) => {
            console.log('Media selected:', media);
            setShowMediaPicker(false);
          }}
        />
      )}

      {/* Input Area */}
      <div className="bg-black/20 backdrop-blur-lg border-t border-white/10 p-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMediaPicker(true)}
            className="text-white hover:bg-white/10"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="text-white hover:bg-white/10"
          >
            <Camera className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400 pr-10"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/10"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          
          {message.trim() ? (
            <Button
              onClick={handleSendMessage}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleVoiceRecord}
              className={`${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*,*/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default ChatWindow;
