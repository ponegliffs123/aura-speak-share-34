
import { useState, useEffect } from 'react';
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

  const fetchChats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching chats...');
      const { data, error } = await supabase
        .from('chat_summaries')
        .select('*')
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching chats:', error);
        // Don't show toast for policy errors to prevent spam
        if (!error.message.includes('policy') && !error.message.includes('recursion')) {
          toast({
            title: "Error",
            description: "Failed to load chats",
            variant: "destructive",
          });
        }
        setChats([]);
      } else {
        console.log('Chats fetched successfully:', data?.length || 0);
        setChats(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const createOrGetDMChat = async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      console.log('Creating/getting DM chat with user:', otherUserId);
      const { data, error } = await supabase.rpc('create_or_get_dm_chat', {
        user1_id: user.id,
        user2_id: otherUserId
      });

      if (error) {
        console.error('Error creating/getting DM chat:', error);
        if (!error.message.includes('policy') && !error.message.includes('recursion')) {
          toast({
            title: "Error",
            description: "Failed to create conversation",
            variant: "destructive",
          });
        }
        return null;
      }
      
      console.log('DM chat created/found:', data);
      // Refresh chats after creating new one
      await fetchChats();
      
      return data;
    } catch (error) {
      console.error('Unexpected error creating/getting DM chat:', error);
      return null;
    }
  };

  const sendMessage = async (chatId: string, content: string, messageType: string = 'text') => {
    if (!user) return;

    try {
      console.log('Sending message to chat:', chatId);
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
      }
    } catch (error) {
      console.error('Unexpected error sending message:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchChats();

      // Set up real-time subscription for chat updates
      const channel = supabase
        .channel('chat-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          () => {
            console.log('Messages changed, refreshing chats');
            fetchChats(); // Refresh chats when messages change
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
            fetchChats(); // Refresh chats when chats change
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setChats([]);
      setLoading(false);
    }
  }, [user]);

  return {
    chats,
    loading,
    createOrGetDMChat,
    sendMessage,
    refetch: fetchChats,
  };
};
