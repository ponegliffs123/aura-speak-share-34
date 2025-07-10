import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CallOffer } from '@/types/webrtc';

interface IncomingCall {
  offer: CallOffer;
  chatId: string;
  callerInfo: {
    id: string;
    name: string;
    avatar: string;
  };
}

export const useIncomingCall = () => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  const declineCall = useCallback(() => {
    if (incomingCall) {
      // Send decline signal through the same channel
      const channel = supabase.channel(`call-${incomingCall.offer.from}`);
      channel.send({
        type: 'broadcast',
        event: 'call-declined',
        payload: { from: user?.id, to: incomingCall.offer.from },
      });
      channel.unsubscribe();
    }
    setIncomingCall(null);
  }, [incomingCall, user?.id]);

  const acceptCall = useCallback(() => {
    setIncomingCall(null);
    // Return the call info for the parent component to handle
    return incomingCall;
  }, [incomingCall]);

  // Listen for incoming calls on all chat channels the user participates in
  useEffect(() => {
    if (!user?.id) return;

    const setupIncomingCallListener = async () => {
      // Get all chats the user participates in
      const { data: participations } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);

      if (!participations) return;

      const channels = participations.map(p => {
        const channel = supabase.channel(`call-${p.chat_id}`)
          .on('broadcast', { event: 'call-offer' }, async (payload) => {
            const offer: CallOffer = payload.payload;
            
            // Only show incoming call if it's for this user and it's an offer
            if (offer.to === user.id && offer.type === 'offer') {
              // Get caller info
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', offer.from)
                .single();

              setIncomingCall({
                offer,
                chatId: p.chat_id, // Include the chat ID from the channel
                callerInfo: {
                  id: offer.from,
                  name: profile?.full_name || 'Unknown',
                  avatar: profile?.avatar_url || profile?.full_name?.[0] || '?',
                },
              });
            }
          })
          .on('broadcast', { event: 'call-declined' }, () => {
            setIncomingCall(null);
          })
          .subscribe();

        return channel;
      });

      return () => {
        channels.forEach(channel => supabase.removeChannel(channel));
      };
    };

    setupIncomingCallListener();
  }, [user?.id]);

  return {
    incomingCall,
    acceptCall,
    declineCall,
  };
};