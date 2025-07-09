
import React, { useState, useEffect } from 'react';
import { MessageSquare, Camera, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  online: boolean;
  lastMessageType: string;
  isGroup?: boolean;
}

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  searchQuery: string;
}

const ChatList: React.FC<ChatListProps> = ({ onSelectChat, searchQuery }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  const fetchChats = async () => {
    try {
      // Fetch chats that the user participates in
      const { data: chatParticipants, error } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          chats (
            id,
            name,
            is_group,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      // For now, we'll show empty state since there are no real chats yet
      setChats([]);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="px-4 pb-20 flex items-center justify-center h-32">
        <div className="text-white/60">Loading chats...</div>
      </div>
    );
  }

  if (filteredChats.length === 0) {
    return (
      <div className="px-4 pb-20 flex flex-col items-center justify-center h-64">
        <MessageSquare className="h-12 w-12 text-white/30 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No conversations yet</h3>
        <p className="text-white/60 text-center">
          Start a conversation by adding contacts and sending your first message.
        </p>
      </div>
    );
  }

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
