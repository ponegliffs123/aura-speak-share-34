export interface CallOffer {
  sdp: string;
  type: 'offer' | 'answer';
  from: string;
  to: string;
  callType: 'voice' | 'video';
}

export interface IceCandidate {
  candidate: string;
  sdpMLineIndex: number;
  sdpMid: string;
  from: string;
  to: string;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export interface CallState {
  isConnected: boolean;
  isConnecting: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}