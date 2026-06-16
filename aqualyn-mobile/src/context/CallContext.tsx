import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from './AppContext';

// Local stubs for WebRTC because the native package is not present in package.json
export class MediaStream {
  getTracks(): any[] { return []; }
  getAudioTracks(): any[] { return []; }
  getVideoTracks(): any[] { return []; }
}

class RTCPeerConnection {
  onicecandidate: any;
  ontrack: any;
  onconnectionstatechange: any;
  connectionState = 'connected';
  constructor(config: any) {}
  addTrack(track: any, stream: any) {}
  close() {}
  async createOffer() { return {}; }
  async createAnswer() { return {}; }
  async setLocalDescription(desc: any) {}
  async setRemoteDescription(desc: any) {}
  async addIceCandidate(cand: any) {}
}

class RTCIceCandidate {
  constructor(c: any) {}
}

class RTCSessionDescription {
  constructor(s: any) {}
}

const mediaDevices = {
  getUserMedia: async (constraints: any) => {
    return new MediaStream();
  }
};

interface CallContextType {
  isCalling: boolean;
  incomingCall: any;
  currentCall: any;
  startCall: (to: string, userName: string, avatar: string, type: 'VOICE' | 'VIDEO') => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  duration: number;
  isMuted: boolean;
  isVideoEnabled: boolean;
  toggleMute: () => void;
  toggleVideo: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, addToast, socket } = useAppContext();
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const callLogIdRef = useRef<string | null>(null);
  const durationTimerRef = useRef<any>(null); // Kept safe for cross-platform timeouts
  const localStreamRef = useRef<MediaStream | null>(null);

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const startDurationTimer = () => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    durationTimerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const cleanupCall = useCallback(() => {
    setIsCalling(false);
    setIncomingCall(null);
    setCurrentCall(null);
    setDuration(0);
    setIsMuted(false);
    setIsVideoEnabled(true);
    callLogIdRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t: any) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    setRemoteStream(null);

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('incoming_call', (data: any) => {
      setIncomingCall(data);
      if (data.callLogId) callLogIdRef.current = data.callLogId;
    });

    socket.on('call_log_created', (data: any) => {
      if (data.callLogId) callLogIdRef.current = data.callLogId;
    });

    socket.on('call_accepted', async (data: any) => {
      if (peerConnection.current && data.signal) {
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.signal));
        } catch (e) {
          console.error('[Call] setRemoteDescription error:', e);
        }
      }
      startDurationTimer();
    });

    socket.on('call_rejected', (data: any) => {
      addToast(`Call declined${data.reason ? ': ' + data.reason : ''}`, 'info');
      cleanupCall();
    });

    socket.on('webrtc_signal', async (data: any) => {
      if (peerConnection.current) {
        try {
          if (data.signal.candidate) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
          } else if (data.signal.sdp) {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
          }
        } catch (e) {
          console.error('[Call] ICE/SDP error:', e);
        }
      }
    });

    socket.on('call_ended', () => {
      cleanupCall();
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_log_created');
      socket.off('call_accepted');
      socket.off('call_rejected');
      socket.off('webrtc_signal');
      socket.off('call_ended');
    };
  }, [addToast, socket, cleanupCall]);

  const setupPeerConnection = (targetId: string) => {
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event: any) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_signal', {
          to: targetId,
          from: currentUser?.id,
          signal: { candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        addToast('Call connection lost', 'error');
        endCall();
      }
    };

    peerConnection.current = pc;
    return pc;
  };

  const startCall = async (to: string, userName: string, avatar: string, type: 'VOICE' | 'VIDEO') => {
    if (!currentUser || !socket) return;
    setIsCalling(true);
    setCurrentCall({ to, userName, avatar, type, isOutgoing: true });
    setIsVideoEnabled(type === 'VIDEO');

    try {
      // Swapped browser navigator constraints targeting native media tracks instead
      const stream = await mediaDevices.getUserMedia({
        video: type === 'VIDEO',
        audio: true,
      });
      localStreamRef.current = stream as unknown as MediaStream;
      setLocalStream(stream as unknown as MediaStream);

      const pc = setupPeerConnection(to);
      (stream as unknown as MediaStream).getTracks().forEach((track: any) => pc.addTrack(track, stream as unknown as MediaStream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call_user', {
        to,
        from: currentUser.id,
        callerName: currentUser.displayName || currentUser.username,
        callerAvatar: currentUser.avatar,
        type,
        signal: offer,
      });
    } catch (e) {
      console.error('[Call] Failed to start call:', e);
      addToast('Could not access camera/microphone. Check permissions.', 'error');
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall || !currentUser || !socket) return;
    setCurrentCall({ ...incomingCall, isOutgoing: false });
    setIsCalling(true);
    setIncomingCall(null);
    setIsVideoEnabled(incomingCall.type === 'VIDEO');

    try {
      const stream = await mediaDevices.getUserMedia({
        video: incomingCall.type === 'VIDEO',
        audio: true,
      });
      localStreamRef.current = stream as unknown as MediaStream;
      setLocalStream(stream as unknown as MediaStream);

      const pc = setupPeerConnection(incomingCall.from);
      (stream as unknown as MediaStream).getTracks().forEach((track: any) => pc.addTrack(track, stream as unknown as MediaStream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call_accepted', {
        to: incomingCall.from,
        signal: answer,
        callLogId: callLogIdRef.current,
      });
      startDurationTimer();
    } catch (e) {
      console.error('[Call] Failed to accept call:', e);
      addToast('Could not access camera/microphone', 'error');
      socket.emit('call_rejected', {
        to: incomingCall.from,
        reason: 'Media device error',
        callLogId: callLogIdRef.current,
      });
      cleanupCall();
    }
  };

  const rejectCall = () => {
    if (incomingCall && socket) {
      socket.emit('call_rejected', {
        to: incomingCall.from,
        reason: 'Busy',
        callLogId: callLogIdRef.current,
      });
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    const targetId = currentCall?.to || currentCall?.from || incomingCall?.from;
    if (targetId && socket) {
      socket.emit('end_call', { to: targetId, callLogId: callLogIdRef.current });
    }
    cleanupCall();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const enabled = !isMuted;
      localStreamRef.current.getAudioTracks().forEach((t: any) => { t.enabled = enabled; });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const newState = !isVideoEnabled;
      localStreamRef.current.getVideoTracks().forEach((t: any) => { t.enabled = newState; });
      setIsVideoEnabled(newState);
    }
  };

  return (
    <CallContext.Provider
      value={{
        isCalling, incomingCall, currentCall,
        startCall, acceptCall, rejectCall, endCall,
        localStream, remoteStream,
        duration, isMuted, isVideoEnabled,
        toggleMute, toggleVideo,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};