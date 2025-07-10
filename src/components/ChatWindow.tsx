
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Video, Send, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MessageBubble from './MessageBubble';
import { useMessages } from '@/hooks/useMessages';
import { useChats } from '@/hooks/useChats';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ChatWindowProps {
  chatId: string;
  onBack: () => void;
  onStartCall: (contact: any, type: 'voice' | 'video') => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, onBack, onStartCall }) => {
  const [message, setMessage] = useState('');
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [chatInfoLoading, setChatInfoLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading: messagesLoading } = useMessages(chatId);
  const { sendMessage } = useChats();
  const { user } = useAuth();

  // Fetch chat info with better error handling and fallback
  useEffect(() => {
    const fetchChatInfo = async () => {
      if (!chatId || !user) return;
      
      try {
        setChatInfoLoading(true);
        console.log('Fetching chat info for:', chatId);
        
        // First try to get from chat_summaries view
        const { data: summaryData, error: summaryError } = await supabase
          .from('chat_summaries')
          .select('*')
          .eq('id', chatId)
          .single();

        if (!summaryError && summaryData) {
          console.log('Chat info from summary:', summaryData);
          setChatInfo(summaryData);
          setChatInfoLoading(false);
          return;
        }

        console.log('Summary not found, trying direct chat query');

        // Fallback: get chat info directly
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('*')
          .eq('id', chatId)
          .single();
        
        if (chatError) {
          console.error('Error fetching chat:', chatError);
          setChatInfo({
            id: chatId,
            display_name: 'Chat',
            is_group: false
          });
          setChatInfoLoading(false);
          return;
        }

        // Get chat participants
        const { data: participantsData } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('chat_id', chatId);

        console.log('Chat participants:', participantsData);
        
        // For DM chats, find the other participant and get their profile
        let displayName = chatData.name || 'Chat';
        
        if (!chatData.is_group && participantsData && participantsData.length > 0) {
          const otherParticipantId = participantsData.find(
            (p: any) => p.user_id !== user.id
          )?.user_id;
          
          if (otherParticipantId) {
            // Fetch the other participant's profile separately
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id, username, full_name')
              .eq('id', otherParticipantId)
              .maybeSingle();

            if (profileData) {
              displayName = profileData.full_name || 
                          profileData.username || 
                          'Unknown User';
            }
          }
        }

        setChatInfo({
          ...chatData,
          display_name: displayName
        });
        
      } catch (error) {
        console.error('Unexpected error fetching chat info:', error);
        // Set minimal chat info to prevent crashes
        setChatInfo({
          id: chatId,
          display_name: 'Chat',
          is_group: false
        });
      } finally {
        setChatInfoLoading(false);
      }
    };

    fetchChatInfo();
  }, [chatId, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (message.trim() && user && chatId) {
      console.log('Sending message:', message.trim());
      await sendMessage(chatId, message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Show loading only while fetching chat info
  if (chatInfoLoading) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 items-center justify-center">
        <div className="text-white/60">Loading chat...</div>
      </div>
    );
  }

  const contact = chatInfo ? {
    id: chatId,
    name: chatInfo.display_name || 'Chat',
    avatar: getInitials(chatInfo.display_name),
    online: true,
    lastSeen: 'online'
  } : {
    id: chatId,
    name: 'Chat',
    avatar: '?',
    online: false,
    lastSeen: 'offline'
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/10 md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-semibold text-white">
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
      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-lg font-semibold text-white mx-auto mb-4">
                {contact.avatar}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{contact.name}</h3>
              <p className="text-white/60">Start your conversation</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={{
                id: msg.id,
                text: msg.content || '',
                timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                sent: msg.sender_id === user?.id,
                type: msg.message_type as any,
                mediaUrl: msg.media_url || undefined,
                fileName: msg.file_name || undefined,
                fileSize: msg.file_size ? `${Math.round(msg.file_size / 1024)}KB` : undefined
              }} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-black/20 backdrop-blur-lg border-t border-white/10 p-4 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
