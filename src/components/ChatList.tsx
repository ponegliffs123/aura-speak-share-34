
import React, { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChats } from '@/hooks/useChats';
import UserSearch from './UserSearch';
import { formatDistanceToNow } from 'date-fns';

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  searchQuery: string;
  selectedChatId?: string;
}

const ChatList: React.FC<ChatListProps> = ({ onSelectChat, searchQuery, selectedChatId }) => {
  const { chats, loading } = useChats();
  const [showUserSearch, setShowUserSearch] = useState(false);

  const filteredChats = chats.filter(chat =>
    (chat.display_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (chat.last_message?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="px-4 pb-20 flex items-center justify-center h-32">
        <div className="text-white/60">Loading chats...</div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 pb-20">
        {/* New Chat Button */}
        <div className="mb-4">
          <Button
            onClick={() => setShowUserSearch(true)}
            data-new-conversation
            className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Conversation</span>
          </Button>
        </div>

        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <MessageSquare className="h-12 w-12 text-white/30 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </h3>
            <p className="text-white/60 text-center mb-4">
              {searchQuery 
                ? 'Try adjusting your search terms.'
                : 'Start a conversation by clicking the "New Conversation" button above.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredChats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                onClick={() => onSelectChat(chat.id)}
                className={`w-full p-4 h-auto transition-all duration-200 rounded-xl ${
                  selectedChatId === chat.id 
                    ? 'bg-purple-600/20 border border-purple-500/30' 
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                      {getInitials(chat.display_name)}
                    </div>
                  </div>
                  
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white truncate">
                        {chat.display_name || 'Unknown'}
                      </h3>
                      <span className="text-xs text-white/60 flex-shrink-0 ml-2">
                        {formatTime(chat.last_message_time)}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 truncate mt-1">
                      {chat.last_message || 'No messages yet'}
                    </p>
                  </div>
                  
                  {chat.unread_count > 0 && (
                    <div className="bg-purple-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {chat.unread_count > 99 ? '99+' : chat.unread_count}
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>

      <UserSearch
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onChatCreated={onSelectChat}
      />
    </>
  );
};

export default ChatList;
