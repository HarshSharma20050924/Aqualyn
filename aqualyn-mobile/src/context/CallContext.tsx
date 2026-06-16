import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from './AppContext';

interface CallContextType {
  isCalling: boolean;
  incomingCall: any;
  currentCall: any;
  startCall: (to: string, userName: string, avatar: string, type: 'VOICE' | 'VIDEO') => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  localStream: any;
  remoteStream: any;
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
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const callLogIdRef = useRef<string | null>(null);
  const durationTimerRef = useRef<any | null>(null);

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
    setLocalStream(null);
    setRemoteStream(null);

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
      setRemoteStream({ mock: true }); // Simulated stream
      startDurationTimer();
    });

    socket.on('call_rejected', (data: any) => {
      addToast(`Call declined${data.reason ? ': ' + data.reason : ''}`, 'info');
      cleanupCall();
    });

    socket.on('call_ended', () => {
      cleanupCall();
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_log_created');
      socket.off('call_accepted');
      socket.off('call_rejected');
      socket.off('call_ended');
    };
  }, [addToast, socket, cleanupCall]);

  const startCall = async (to: string, userName: string, avatar: string, type: 'VOICE' | 'VIDEO') => {
    if (!currentUser || !socket) return;
    setIsCalling(true);
    setCurrentCall({ to, userName, avatar, type, isOutgoing: true });
    setIsVideoEnabled(type === 'VIDEO');
    setLocalStream({ mock: true });

    socket.emit('call_user', {
      to,
      from: currentUser.id,
      callerName: currentUser.displayName || currentUser.username,
      callerAvatar: currentUser.avatar,
      type,
      signal: { sdp: 'mock-sdp', type: 'offer' },
    });
  };

  const acceptCall = async () => {
    if (!incomingCall || !currentUser || !socket) return;
    setCurrentCall({ ...incomingCall, isOutgoing: false });
    setIsCalling(true);
    setIncomingCall(null);
    setIsVideoEnabled(incomingCall.type === 'VIDEO');
    setLocalStream({ mock: true });
    setRemoteStream({ mock: true });

    socket.emit('call_accepted', {
      to: incomingCall.from,
      signal: { sdp: 'mock-sdp', type: 'answer' },
      callLogId: callLogIdRef.current,
    });
    startDurationTimer();
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
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
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
