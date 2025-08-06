
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface Chat {
  id: string;
  name: string | null;
  is_group: boolean;
  display_name: string;
  last_message: string | null;
  last_message_time: string | null;
  last_message_type: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  content: string | null;
  sender_id: string;
  chat_id: string;
  message_type: string;
  media_url: string | null;
  created_at: string;
  file_name?: string;
  file_size?: number;
}

export const useChats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRequestInProgressRef = useRef(false);

  const fetchChats = useCallback(async (force = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous requests
    if (isRequestInProgressRef.current && !force) {
      console.log('Request already in progress, skipping fetch');
      return;
    }

    isRequestInProgressRef.current = true;

    try {
      console.log('Fetching chats for user:', user.id);
      const { data, error } = await supabase
        .from('chat_summaries')
        .select('*')
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching chats:', error);
        
        // Handle rate limiting specifically
        if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
          console.warn('Rate limited, backing off...');
          return; // Don't show error toast for rate limiting
        }
        
        if (!error.message.includes('policy') && !error.message.includes('recursion')) {
          toast({
            title: "Error",
            description: "Failed to load chats",
            variant: "destructive",
          });
        }
        setChats([]);
      } else {
        console.log('Chats fetched successfully:', data?.length || 0, data);
        setChats(data || []);
      }
    } catch (error: any) {
      console.error('Unexpected error fetching chats:', error);
      
      // Handle rate limiting at the network level
      if (error.message?.includes('429') || error.status === 429) {
        console.warn('Rate limited, backing off...');
        return;
      }
      
      setChats([]);
    } finally {
      setLoading(false);
      isRequestInProgressRef.current = false;
    }
  }, [user, toast]);

  const createOrGetDMChat = async (otherUserId: string): Promise<string | null> => {
    if (!user) {
      console.error('No user logged in');
      return null;
    }

    try {
      console.log('Creating/getting DM chat between:', user.id, 'and', otherUserId);
      
      // First check if chat already exists by querying the database directly
      const { data: existingChats, error: queryError } = await supabase
        .from('chats')
        .select(`
          id,
          name,
          is_group,
          chat_participants!inner(user_id)
        `)
        .eq('is_group', false);

      if (queryError) {
        console.error('Error querying existing chats:', queryError);
      } else {
        console.log('Existing chats:', existingChats);
        
        // Find a chat where both users are participants
        const existingChat = existingChats?.find(chat => {
          const participantIds = chat.chat_participants.map((p: any) => p.user_id);
          return participantIds.includes(user.id) && participantIds.includes(otherUserId) && participantIds.length === 2;
        });

        if (existingChat) {
          console.log('Found existing chat:', existingChat.id);
          debouncedFetchChats(); // Refresh chats list
          return existingChat.id;
        }
      }

      // If no existing chat found, create one using the function
      const { data, error } = await supabase.rpc('create_or_get_dm_chat', {
        user1_id: user.id,
        user2_id: otherUserId
      });

      if (error) {
        console.error('Error creating/getting DM chat:', error);
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive",
        });
        return null;
      }
      
      console.log('DM chat created/found via function:', data);
      
      // Add a small delay to ensure the chat is properly created
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh chats after creating new one
      await fetchChats(true); // Force refresh for new chat creation
      
      return data;
    } catch (error) {
      console.error('Unexpected error creating/getting DM chat:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
      return null;
    }
  };

  const sendMessage = async (chatId: string, content: string, messageType: string = 'text') => {
    if (!user) return;

    try {
      console.log('Sending message to chat:', chatId, 'content:', content);
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content,
          message_type: messageType
        });

      if (error) {
        console.error('Error sending message:', error);
        if (!error.message.includes('policy') && !error.message.includes('recursion')) {
          toast({
            title: "Error",
            description: "Failed to send message",
            variant: "destructive",
          });
        }
      } else {
        console.log('Message sent successfully');
        // Refresh chats to update last message with debouncing
        debouncedFetchChats();
      }
    } catch (error) {
      console.error('Unexpected error sending message:', error);
    }
  };

  // Debounced fetch function to prevent excessive requests
  const debouncedFetchChats = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      fetchChats();
    }, 500); // 500ms debounce
  }, [fetchChats]);

  useEffect(() => {
    if (user) {
      fetchChats(true); // Initial fetch

      // Set up real-time subscription for chat updates with debouncing
      const channel = supabase
        .channel(`chat-changes-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          () => {
            console.log('Messages changed, refreshing chats');
            debouncedFetchChats();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chats',
          },
          () => {
            console.log('Chats changed, refreshing');
            debouncedFetchChats();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_participants',
          },
          () => {
            console.log('Chat participants changed, refreshing');
            debouncedFetchChats();
          }
        )
        .subscribe();

      return () => {
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        supabase.removeChannel(channel);
      };
    } else {
      setChats([]);
      setLoading(false);
    }
  }, [user, fetchChats, debouncedFetchChats]);

  return {
    chats,
    loading,
    createOrGetDMChat,
    sendMessage,
    refetch: fetchChats,
  };
};
