import { supabase } from '@/integrations/supabase/client';
import { CallOffer, IceCandidate } from '@/types/webrtc';

export class RealtimeChannel {
  private channel: any = null;
  
  private onCallOfferCallback?: (offer: CallOffer) => void;
  private onIceCandidateCallback?: (candidate: IceCandidate) => void;
  private onCallEndCallback?: () => void;

  constructor(
    private chatId: string,
    private userId: string
  ) {}

  initialize() {
    if (this.channel) return;

    console.log('Setting up realtime channel for chat:', this.chatId);
    this.channel = supabase.channel(`call-${this.chatId}`)
      .on('broadcast', { event: 'call-offer' }, (payload) => {
        const offer: CallOffer = payload.payload;
        console.log('Received call offer:', offer);
        if (this.onCallOfferCallback) {
          this.onCallOfferCallback(offer);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, (payload) => {
        const candidate: IceCandidate = payload.payload;
        console.log('Received ICE candidate:', candidate);
        if (candidate.to === this.userId && this.onIceCandidateCallback) {
          this.onIceCandidateCallback(candidate);
        }
      })
      .on('broadcast', { event: 'call-end' }, () => {
        console.log('Call ended by remote user');
        if (this.onCallEndCallback) {
          this.onCallEndCallback();
        }
      })
      .subscribe();
  }

  sendCallOffer(offer: CallOffer) {
    if (!this.channel) throw new Error('Channel not initialized');
    
    console.log('Sending call offer:', offer);
    this.channel.send({
      type: 'broadcast',
      event: 'call-offer',
      payload: offer,
    });
  }

  sendIceCandidate(candidate: IceCandidate) {
    if (!this.channel) throw new Error('Channel not initialized');
    
    console.log('Sending ICE candidate:', candidate);
    this.channel.send({
      type: 'broadcast',
      event: 'ice-candidate',
      payload: candidate,
    });
  }

  sendCallEnd() {
    if (this.channel) {
      console.log('Sending call end signal');
      this.channel.send({
        type: 'broadcast',
        event: 'call-end',
        payload: { from: this.userId },
      });
    }
  }

  close() {
    if (this.channel) {
      console.log('Closing realtime channel');
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  onCallOffer(callback: (offer: CallOffer) => void) {
    this.onCallOfferCallback = callback;
  }

  onIceCandidate(callback: (candidate: IceCandidate) => void) {
    this.onIceCandidateCallback = callback;
  }

  onCallEnd(callback: () => void) {
    this.onCallEndCallback = callback;
  }
}