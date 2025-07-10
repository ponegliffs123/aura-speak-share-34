
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

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

export const useMessages = (chatId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMessages = async () => {
    if (!chatId || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching messages for chat:', chatId);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        // Only show toast for non-policy errors
        if (!error.message.includes('policy') && !error.message.includes('recursion')) {
          toast({
            title: "Error",
            description: "Failed to load messages",
            variant: "destructive",
          });
        }
        setMessages([]);
      } else {
        console.log('Messages fetched successfully:', data?.length || 0);
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatId && user) {
      fetchMessages();

      // Set up real-time subscription for new messages
      const channel = supabase
        .channel(`messages-${chatId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${chatId}`,
          },
          (payload) => {
            console.log('New message received via realtime:', payload.new);
            const newMessage = payload.new as Message;
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });
          }
        )
        .subscribe();

      return () => {
        console.log('Cleaning up messages subscription');
        supabase.removeChannel(channel);
      };
    } else {
      setMessages([]);
      setLoading(false);
    }
  }, [chatId, user]);

  return {
    messages,
    loading,
    refetch: fetchMessages,
  };
};
