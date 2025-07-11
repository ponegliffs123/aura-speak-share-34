import React, { useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';

interface NotificationManagerProps {
  currentChatId?: string;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ currentChatId }) => {
  const { canShowNotifications, showNotification } = usePushNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !canShowNotifications) return;

    // Subscribe to real-time message events
    const channel = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=neq.${user.id}`, // Only messages not from current user
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // Don't show notification if user is currently viewing this chat
          if (currentChatId === newMessage.chat_id) {
            return;
          }

          // Get sender information
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', newMessage.sender_id)
            .single();

          const senderName = senderProfile?.full_name || 
                           senderProfile?.username || 
                           'Someone';

          // Get chat information to determine if it's a group chat
          const { data: chatInfo } = await supabase
            .from('chats')
            .select('name, is_group')
            .eq('id', newMessage.chat_id)
            .single();

          let notificationTitle = senderName;
          let notificationBody = newMessage.content || 'Sent a file';

          if (chatInfo?.is_group && chatInfo.name) {
            notificationTitle = chatInfo.name;
            notificationBody = `${senderName}: ${notificationBody}`;
          }

          // Truncate long messages
          if (notificationBody.length > 100) {
            notificationBody = notificationBody.substring(0, 97) + '...';
          }

          // Show notification based on message type
          if (newMessage.message_type === 'image') {
            notificationBody = '📷 Sent a photo';
          } else if (newMessage.message_type === 'video') {
            notificationBody = '🎥 Sent a video';
          } else if (newMessage.message_type === 'audio') {
            notificationBody = '🎵 Sent an audio message';
          } else if (newMessage.message_type === 'file') {
            notificationBody = `📄 Sent ${newMessage.file_name || 'a file'}`;
          }

          if (chatInfo?.is_group && chatInfo.name) {
            notificationBody = `${senderName}: ${notificationBody}`;
          }

          await showNotification({
            title: notificationTitle,
            body: notificationBody,
            tag: `chat_${newMessage.chat_id}`,
            data: {
              chatId: newMessage.chat_id,
              messageId: newMessage.id,
              senderId: newMessage.sender_id,
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, canShowNotifications, currentChatId, showNotification]);

  return null; // This is a utility component with no UI
};

export default NotificationManager;