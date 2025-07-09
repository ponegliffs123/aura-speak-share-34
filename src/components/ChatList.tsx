
import React from 'react';
import { MessageSquare, Camera, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  searchQuery: string;
}

const ChatList: React.FC<ChatListProps> = ({ onSelectChat, searchQuery }) => {
  const chats = [
    {
      id: '1',
      name: 'Sarah Johnson',
      lastMessage: 'Hey! How are you doing?',
      time: '2:30 PM',
      unread: 2,
      avatar: 'SJ',
      online: true,
      lastMessageType: 'text'
    },
    {
      id: '2',
      name: 'Mike Chen',
      lastMessage: 'Sent a photo',
      time: '1:15 PM',
      unread: 0,
      avatar: 'MC',
      online: false,
      lastMessageType: 'photo'
    },
    {
      id: '3',
      name: 'Emma Wilson',
      lastMessage: 'Voice message',
      time: '12:45 PM',
      unread: 1,
      avatar: 'EW',
      online: true,
      lastMessageType: 'voice'
    },
    {
      id: '4',
      name: 'Team Alpha',
      lastMessage: 'John: Let\'s meet tomorrow',
      time: '11:20 AM',
      unread: 5,
      avatar: 'TA',
      online: false,
      lastMessageType: 'text',
      isGroup: true
    }
  ];

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Camera className="h-4 w-4 text-white/60" />;
      case 'voice':
        return <Mic className="h-4 w-4 text-white/60" />;
      default:
        return null;
    }
  };

  return (
    <div className="px-4 pb-20">
      <div className="space-y-2">
        {filteredChats.map((chat) => (
          <Button
            key={chat.id}
            variant="ghost"
            onClick={() => onSelectChat(chat.id)}
            className="w-full p-4 h-auto bg-white/5 hover:bg-white/10 transition-all duration-200 rounded-xl"
          >
            <div className="flex items-center space-x-3 w-full">
              <div className="relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold ${
                  chat.isGroup 
                    ? 'bg-gradient-to-br from-orange-500 to-red-500' 
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}>
                  {chat.avatar}
                </div>
                {chat.online && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                )}
              </div>
              
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{chat.name}</h3>
                  <span className="text-xs text-white/60">{chat.time}</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  {getMessageIcon(chat.lastMessageType)}
                  <p className="text-sm text-white/70 truncate">{chat.lastMessage}</p>
                </div>
              </div>
              
              {chat.unread > 0 && (
                <div className="bg-purple-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {chat.unread}
                </div>
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ChatList;
