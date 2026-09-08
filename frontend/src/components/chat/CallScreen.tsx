import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Minimize2 } from 'lucide-react';
import ContactAvatar from '../ui/ContactAvatar';

interface CallScreenProps {
  callerName: string;
  callerAvatar?: string;
  isVideo: boolean;
  isIncoming: boolean;
  callState: 'incoming' | 'outgoing' | 'active';
  duration: number;
  isMuted: boolean;
  isVideoEnabled: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onAccept: () => void;
  onDecline: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

export default function CallScreen({
  callerName,
  callerAvatar,
  isVideo,
  isIncoming,
  callState,
  duration,
  isMuted,
  isVideoEnabled,
  localStream,
  remoteStream,
  onAccept,
  onDecline,
  onEnd,
  onToggleMute,
  onToggleVideo,
}: CallScreenProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isSpeaker, setIsSpeaker] = useState(true);

  // Attach local stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[200] bg-slate-950 text-white flex flex-col justify-between overflow-hidden"
      >
        {/* Remote Video Stream (Full Screen for Video Calls) */}
        {isVideo && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        ) : (
          /* Background Blur for Audio Call or Outgoing */
          <div className="absolute inset-0 z-0 overflow-hidden">
            <ContactAvatar src={callerAvatar} name={callerName} className="w-full h-full object-cover opacity-25 blur-3xl scale-125" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />
          </div>
        )}

        {/* Local Video Picture-in-Picture (Top-Right) */}
        {isVideo && localStream && isVideoEnabled && (
          <motion.div 
            drag
            dragConstraints={{ left: 0, right: 200, top: 0, bottom: 400 }}
            className="absolute top-6 right-6 z-20 w-32 h-44 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-900 cursor-grab active:cursor-grabbing"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          </motion.div>
        )}

        {/* Header Info */}
        <div className="relative z-10 pt-16 flex flex-col items-center gap-4 text-center px-6">
          <div className="relative">
            <ContactAvatar
              src={callerAvatar}
              name={callerName}
              className="w-28 h-28 rounded-full border-4 border-white/20 shadow-2xl object-cover"
            />
            {callState === 'active' && (
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">{callerName}</h2>
            <p className="text-sm font-medium text-emerald-400/90 drop-shadow">
              {callState === 'incoming' && `${isVideo ? '📹 Incoming Video Call...' : '📞 Incoming Audio Call...'}`}
              {callState === 'outgoing' && `${isVideo ? '📹 Video Calling...' : '📞 Audio Calling...'}`}
              {callState === 'active' && (
                <span className="flex items-center justify-center gap-2 text-white/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  {formatDuration(duration)}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Floating Audio Wave Visualizer during Active Voice Call */}
        {callState === 'active' && !isVideo && (
          <div className="relative z-10 flex items-center justify-center gap-1.5 my-auto">
            {[40, 70, 30, 90, 50, 80, 40].map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: [h / 3, h, h / 3] }}
                transition={{ repeat: Infinity, duration: 1 + i * 0.2, ease: "easeInOut" }}
                className="w-1.5 bg-emerald-400/80 rounded-full shadow-lg"
              />
            ))}
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className="relative z-10 pb-12 px-6 w-full max-w-md mx-auto">
          {callState === 'active' ? (
            <div className="flex flex-col items-center gap-6">
              {/* Media Controls */}
              <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl p-3 rounded-full border border-white/10 shadow-2xl">
                <button
                  onClick={onToggleMute}
                  className={`p-4 rounded-full transition-all active:scale-95 ${
                    isMuted ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                <button
                  onClick={onToggleVideo}
                  className={`p-4 rounded-full transition-all active:scale-95 ${
                    !isVideoEnabled ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {!isVideoEnabled ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>

                <button
                  onClick={() => setIsSpeaker(!isSpeaker)}
                  className={`p-4 rounded-full transition-all active:scale-95 ${
                    isSpeaker ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title="Toggle Speaker"
                >
                  {isSpeaker ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </button>
              </div>

              {/* End Call Button */}
              <button
                onClick={onEnd}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl shadow-red-600/40 transition-all active:scale-90"
                title="End Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            </div>
          ) : callState === 'incoming' ? (
            /* Incoming Accept / Decline buttons */
            <div className="flex items-center justify-around">
              <motion.button
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                onClick={onDecline}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl shadow-red-600/40 transition-all active:scale-90">
                  <PhoneOff className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold text-white/80 group-hover:text-white">Decline</span>
              </motion.button>

              <motion.button
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                onClick={onAccept}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 transition-all active:scale-90">
                  {isVideo ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
                </div>
                <span className="text-xs font-bold text-white/80 group-hover:text-white">Accept</span>
              </motion.button>
            </div>
          ) : (
            /* Outgoing Cancel button */
            <div className="flex justify-center">
              <button
                onClick={onEnd}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl shadow-red-600/40 transition-all active:scale-90"
                title="Cancel Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
