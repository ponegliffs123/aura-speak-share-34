import { WebRTCConfig } from '@/types/webrtc';

export class WebRTCConnection {
  private peerConnection: RTCPeerConnection | null = null;
  private remoteUserId: string | null = null;
  
  private onIceCandidateCallback?: (candidate: RTCIceCandidate) => void;
  private onTrackCallback?: (stream: MediaStream) => void;
  private onConnectionStateChangeCallback?: (state: RTCPeerConnectionState) => void;

  constructor(
    private config: WebRTCConfig,
    private userId: string
  ) {}

  initialize() {
    if (this.peerConnection) return;

    this.peerConnection = new RTCPeerConnection(this.config);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateCallback) {
        console.log('ICE candidate generated:', event.candidate);
        this.onIceCandidateCallback(event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log('Remote track received:', event.streams[0]);
      if (this.onTrackCallback) {
        this.onTrackCallback(event.streams[0]);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('Connection state changed:', state);
      if (this.onConnectionStateChangeCallback && state) {
        this.onConnectionStateChangeCallback(state);
      }
    };
  }

  setRemoteUserId(userId: string) {
    this.remoteUserId = userId;
  }

  getRemoteUserId() {
    return this.remoteUserId;
  }

  addTrack(track: MediaStreamTrack, stream: MediaStream) {
    if (this.peerConnection) {
      console.log('Adding track:', track.kind);
      this.peerConnection.addTrack(track, stream);
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    console.log('Created offer:', offer);
    return offer;
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    console.log('Created answer:', answer);
    return answer;
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit) {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
    console.log('Set remote description:', description.type);
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    console.log('Added ICE candidate');
  }

  close() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteUserId = null;
  }

  onIceCandidate(callback: (candidate: RTCIceCandidate) => void) {
    this.onIceCandidateCallback = callback;
  }

  onTrack(callback: (stream: MediaStream) => void) {
    this.onTrackCallback = callback;
  }

  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateChangeCallback = callback;
  }
}