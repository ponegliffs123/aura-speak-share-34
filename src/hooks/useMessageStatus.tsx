import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface MessageStatus {
  messageId: string;
  status: 'sending' | 'delivered' | 'read';
  timestamp: string;
}

interface TypingUser {
  userId: string;
  chatId: string;
  timestamp: number;
}

export const useMessageStatus = (chatId: string) => {
  const { user } = useAuth();
  const [messageStatuses, setMessageStatuses] = useState<Record<string, MessageStatus>>({});
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Track typing status
  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (!user?.id || !chatId) return;

    const channel = supabase.channel(`typing-${chatId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, isTyping: userIsTyping } = payload.payload;
        if (userId !== user.id) {
          setTypingUsers(prev => {
            if (userIsTyping && !prev.includes(userId)) {
              return [...prev, userId];
            } else if (!userIsTyping) {
              return prev.filter(id => id !== userId);
            }
            return prev;
          });
        }
      })
      .subscribe();

    // Send typing status
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, isTyping },
    });

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      setTimeout(() => {
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: user.id, isTyping: false },
        });
      }, 3000);
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, chatId]);

  // Mark message as delivered
  const markAsDelivered = useCallback((messageId: string) => {
    setMessageStatuses(prev => ({
      ...prev,
      [messageId]: {
        messageId,
        status: 'delivered',
        timestamp: new Date().toISOString(),
      }
    }));
  }, []);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!user?.id) return;

    try {
      // Insert read record
      await supabase
        .from('message_reads')
        .insert({
          message_id: messageId,
          user_id: user.id,
        });

      setMessageStatuses(prev => ({
        ...prev,
        [messageId]: {
          messageId,
          status: 'read',
          timestamp: new Date().toISOString(),
        }
      }));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [user?.id]);

  // Listen for read receipts
  useEffect(() => {
    if (!chatId || !user?.id) return;

    const channel = supabase
      .channel('message_reads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reads',
        },
        (payload) => {
          const { message_id, user_id } = payload.new;
          if (user_id !== user.id) {
            setMessageStatuses(prev => ({
              ...prev,
              [message_id]: {
                messageId: message_id,
                status: 'read',
                timestamp: new Date().toISOString(),
              }
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user?.id]);

  return {
    messageStatuses,
    typingUsers,
    sendTypingStatus,
    markAsDelivered,
    markAsRead,
  };
};