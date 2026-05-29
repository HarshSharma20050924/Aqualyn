# components/CallOverlay.tsx

## File Location
`frontend/src/components/CallOverlay.tsx`

## Purpose
See implementation below for details.

## Implementation

```typescript
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2 } from 'lucide-react';
import { useCall } from '../context/CallContext';

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const CallOverlay: React.FC = () => {
  const {
    isCalling, incomingCall, currentCall,
    acceptCall, rejectCall, endCall,
    localStream, remoteStream,
    duration, isMuted, isVideoEnabled,
    toggleMute, toggleVideo,
  } = useCall();

  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  React.useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Incoming call banner (not yet active)
  if (incomingCall && !isCalling) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 16, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed top-0 left-1/2 -translate-x-1/2 z-[300] w-[92%] max-w-sm rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: 'rgba(10,15,18,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {/* blurred avatar bg */}
          <div className="absolute inset-0 -z-10">
            <img
              src={incomingCall.callerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${incomingCall.callerName}`}
              alt=""
              className="w-full h-full object-cover opacity-10 blur-2xl scale-110"
            />
          </div>

          <div className="flex items-center gap-4 p-4">
            <div className="relative">
              <img
                src={incomingCall.callerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${incomingCall.callerName}`}
                alt={incomingCall.callerName}
                className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 rounded-full border-2 border-green-400 opacity-60"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">{incomingCall.callerName}</p>
              <p className="text-xs text-green-400 font-medium uppercase tracking-widest">
                Incoming {incomingCall.type === 'VIDEO' ? 'Video' : 'Voice'} Call
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={rejectCall}
                className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
              <motion.button
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                onClick={acceptCall}
                className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"
              >
                {incomingCall.type === 'VIDEO' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Active call screen (fullscreen)
  if (isCalling && currentCall) {
    const isVideo = currentCall.type === 'VIDEO';

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] bg-slate-950 flex flex-col text-white"
        >
          {/* ── VIDEO STREAMS ── */}
          {isVideo ? (
            <div className="absolute inset-0 z-0">
              {/* Remote (fullscreen) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Local (PiP top-right) */}
              <div className="absolute top-14 right-4 w-28 h-40 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isVideoEnabled ? 'opacity-0' : ''}`}
                />
                {!isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <VideoOff className="w-6 h-6 text-white/50" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Voice call avatar bg */
            <div className="absolute inset-0 z-0">
              <img
                src={currentCall.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentCall.userName}`}
                alt=""
                className="w-full h-full object-cover opacity-15 blur-3xl scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/80 to-slate-950" />
            </div>
          )}

          {/* ── HEADER ── */}
          <div className="relative z-10 flex flex-col items-center pt-20 pb-4">
            <motion.div
              animate={!remoteStream ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className="relative mb-4"
            >
              <img
                src={currentCall.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentCall.userName}`}
                alt={currentCall.userName}
                className={`rounded-full border-4 object-cover shadow-2xl ${isVideo ? 'w-20 h-20 border-white/20' : 'w-32 h-32 border-secondary/40'}`}
              />
              {remoteStream && (
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 rounded-full border-2 border-green-400"
                />
              )}
            </motion.div>
            <h2 className="text-2xl font-black tracking-tight">{currentCall.userName}</h2>
            <p className="text-sm mt-1 font-medium">
              {remoteStream ? (
                <span className="text-green-400">{formatDuration(duration)}</span>
              ) : (
                <span className="text-white/60 animate-pulse">
                  {currentCall.isOutgoing ? 'Calling…' : 'Connecting…'}
                </span>
              )}
            </p>
          </div>

          {/* ── CONTROLS ── */}
          <div className="relative z-10 mt-auto mb-14 px-8 flex flex-col gap-6">
            {/* Secondary controls row */}
            <div className="flex justify-center gap-6">
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                  isMuted ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              {isVideo && (
                <button
                  onClick={toggleVideo}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                    !isVideoEnabled ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </button>
              )}

              <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90">
                <Volume2 className="w-6 h-6" />
              </button>
            </div>

            {/* End call */}
            <div className="flex justify-center">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={endCall}
                className="w-18 h-18 w-[4.5rem] h-[4.5rem] rounded-full bg-red-500 flex items-center justify-center text-white shadow-2xl shadow-red-500/40"
              >
                <PhoneOff className="w-8 h-8" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
};
```
