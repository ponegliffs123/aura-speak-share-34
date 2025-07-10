import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useMessageReads = () => {
  const { user } = useAuth();

  const markMessagesAsRead = useCallback(async (chatId: string) => {
    if (!user || !chatId) return;

    try {
      const { error } = await supabase.rpc('mark_messages_as_read', {
        chat_id_param: chatId
      });

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Unexpected error marking messages as read:', error);
    }
  }, [user]);

  return {
    markMessagesAsRead,
  };
};