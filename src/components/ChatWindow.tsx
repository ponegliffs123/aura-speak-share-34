
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Video, Send, MoreVertical, Paperclip, Smile, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import MediaPicker from './MediaPicker';
import MediaPreview from './MediaPreview';
import EmojiPicker from './EmojiPicker';
import { useMessages } from '@/hooks/useMessages';
import { useChats } from '@/hooks/useChats';
import { useAuth } from '@/hooks/useAuth';
import { useMessageReads } from '@/hooks/useMessageReads';
import { useMessageStatus } from '@/hooks/useMessageStatus';
import { useToast } from '@/hooks/use-toast';
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
  const [otherParticipantId, setOtherParticipantId] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenuOptions, setShowMenuOptions] = useState(false);
  const [typingUserNames, setTypingUserNames] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading: messagesLoading } = useMessages(chatId);
  const { sendMessage } = useChats();
  const { user } = useAuth();
  const { markMessagesAsRead } = useMessageReads();
  const { sendTypingStatus, typingUsers } = useMessageStatus(chatId);
  const { toast } = useToast();

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
        console.log('Current user ID:', user.id);
        
        // For DM chats, find the other participant and get their profile
        let displayName = chatData.name || 'Chat';
        let otherUserId = null;
        
        if (!chatData.is_group && participantsData && participantsData.length > 0) {
          otherUserId = participantsData.find(
            (p: any) => p.user_id !== user.id
          )?.user_id;
          
          if (otherUserId) {
            console.log('Found other participant:', otherUserId);
            setOtherParticipantId(otherUserId);
            
            // Fetch the other participant's profile separately
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id, username, full_name')
              .eq('id', otherUserId)
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

  // Mark messages as read when chat is opened or new messages arrive
  useEffect(() => {
    if (chatId && messages.length > 0) {
      markMessagesAsRead(chatId);
    }
  }, [chatId, messages.length, markMessagesAsRead]);

  // Get actual user names for typing indicator
  useEffect(() => {
    const fetchTypingUserNames = async () => {
      if (typingUsers.length === 0) {
        setTypingUserNames([]);
        return;
      }

      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .in('id', typingUsers);

        const names = profiles?.map(profile => 
          profile.full_name || profile.username || 'Someone'
        ) || ['Someone'];
        
        setTypingUserNames(names);
      } catch (error) {
        console.error('Error fetching typing user names:', error);
        setTypingUserNames(['Someone']);
      }
    };

    fetchTypingUserNames();
  }, [typingUsers]);

  const handleSendMessage = async () => {
    if (message.trim() && user && chatId) {
      console.log('Sending message:', message.trim());
      sendTypingStatus(false); // Stop typing when sending
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

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    // Send typing indicator when user starts typing
    if (e.target.value.length > 0) {
      sendTypingStatus(true);
    } else {
      sendTypingStatus(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handleMediaSelect = async (media: any) => {
    console.log('Media selected for preview:', media);
    setSelectedMedia(media);
    setShowMediaPicker(false);
    setShowMediaPreview(true);
  };

  const handleMediaSend = async (media: any, caption: string) => {
    console.log('Sending media with caption:', { media, caption });
    console.log('Media URL:', media.url);
    console.log('Media file:', media.file);
    
    if (media && chatId && user) {
      // Determine message type based on file type
      let messageType = 'file';
      let messageContent = caption || '';
      
      if (media.file) {
        const fileType = media.file.type;
        console.log('File type:', fileType);
        
        if (fileType.startsWith('image/')) {
          messageType = 'image';
          if (!caption) {
            messageContent = media.name ? `📷 ${media.name}` : '📷 Image';
          }
        } else if (fileType.startsWith('video/')) {
          messageType = 'video';
          if (!caption) {
            messageContent = media.name ? `🎥 ${media.name}` : '🎥 Video';
          }
        } else if (fileType.startsWith('audio/')) {
          messageType = 'audio';
          if (!caption) {
            messageContent = media.name ? `🎵 ${media.name}` : '🎵 Audio';
          }
        } else {
          messageType = 'file';
          if (!caption) {
            messageContent = media.name ? `📄 ${media.name}` : '📄 Document';
          }
        }
      }

      // Ensure we have a valid data URL
      if (!media.url || !media.url.startsWith('data:')) {
        console.error('Invalid media URL:', media.url);
        toast({
          title: "Error",
          description: "Failed to process media file",
          variant: "destructive",
        });
        return;
      }

      // Create message with media data
      const messageData = {
        chat_id: chatId,
        sender_id: user.id,
        content: messageContent,
        message_type: messageType,
        media_url: media.url, // This is the data URL from FileReader
        file_name: media.name,
        file_size: media.size
      };

      console.log('Sending message with media data:', messageData);
      console.log('Media URL length:', media.url?.length);

      // Insert the message into the database
      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select();

      if (error) {
        console.error('Error sending media message:', error);
        toast({
          title: "Error",
          description: "Failed to send media",
          variant: "destructive",
        });
      } else {
        console.log('Message sent successfully:', data);
        setShowMediaPreview(false);
        setSelectedMedia(null);
      }
    }
  };

  const handleMediaCancel = () => {
    setShowMediaPreview(false);
    setSelectedMedia(null);
  };

  const handleMediaRetake = () => {
    setShowMediaPreview(false);
    setSelectedMedia(null);
    setShowMediaPicker(true);
  };

  const handleDeleteMessage = async (messageId: string, deleteForEveryone: boolean) => {
    try {
      if (deleteForEveryone) {
        // Delete the message from the database
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', messageId);
          
        if (error) {
          console.error('Error deleting message:', error);
          return;
        }
      } else {
        // For "remove for you", you could mark it as hidden or implement client-side filtering
        // For now, we'll just show a placeholder behavior
        console.log('Message removed for user only');
      }
    } catch (error) {
      console.error('Error handling message deletion:', error);
    }
  };

  const handleLocationShare = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationMessage = `📍 Location: https://maps.google.com/?q=${latitude},${longitude}`;
          sendMessage(chatId, locationMessage);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location. Please check your permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const toggleMenuOptions = () => {
    setShowMenuOptions(!showMenuOptions);
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
    id: otherParticipantId || chatId, // Use actual user ID for DM calls, fallback to chat ID for group chats
    name: chatInfo.display_name || 'Chat',
    avatar: getInitials(chatInfo.display_name),
    online: true,
    lastSeen: 'online'
  } : {
    id: otherParticipantId || chatId,
    name: 'Chat',
    avatar: '?',
    online: false,
    lastSeen: 'offline'
  };

  console.log('Contact object for call:', contact);

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
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenuOptions}
                className="text-white hover:bg-white/10"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
              
              {showMenuOptions && (
                <div className="absolute right-0 top-12 bg-black/90 backdrop-blur-lg border border-white/10 rounded-lg p-2 z-50 min-w-[150px]">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white hover:bg-white/10"
                    onClick={handleLocationShare}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Share Location
                  </Button>
                </div>
              )}
            </div>
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
              onDeleteMessage={handleDeleteMessage}
            />
          ))
        )}
        <TypingIndicator 
          isVisible={typingUsers.length > 0} 
          userNames={typingUserNames}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-black/20 backdrop-blur-lg border-t border-white/10 p-4 flex-shrink-0 relative">
        {showEmojiPicker && (
          <EmojiPicker 
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMediaPicker(true)}
            className="text-white hover:bg-white/10"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <Input
              value={message}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400"
            />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-white hover:bg-white/10"
          >
            <Smile className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {showMediaPicker && (
        <MediaPicker 
          onClose={() => setShowMediaPicker(false)}
          onMediaSelect={handleMediaSelect}
        />
      )}

      {showMediaPreview && (
        <MediaPreview
          media={selectedMedia}
          onSend={handleMediaSend}
          onCancel={handleMediaCancel}
          onRetake={handleMediaRetake}
        />
      )}
    </div>
  );
};

export default ChatWindow;
