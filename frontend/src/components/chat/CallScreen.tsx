import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from 'lucide-react';

interface CallScreenProps {
  callerName: string;
  callerAvatar: string;
  isVideo: boolean;
  isIncoming: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onEnd: () => void;
}

export default function CallScreen({ callerName, callerAvatar, isVideo, isIncoming, onAccept, onDecline, onEnd }: CallScreenProps) {
  const [callState, setCallState] = useState<'incoming' | 'outgoing' | 'active'>(isIncoming ? 'incoming' : 'outgoing');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideo);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (callState === 'outgoing') {
      const timer = setTimeout(() => {
        setCallState('active');
      }, 3000); // Mock answer after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [callState]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === 'active') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAccept = () => {
    setCallState('active');
    onAccept();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[200] bg-slate-900 text-white flex flex-col items-center justify-between py-16"
      >
        {/* Background Blur */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img src={callerAvatar} alt="Background" className="w-full h-full object-cover opacity-20 blur-3xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
        </div>

        {/* Header Info */}
        <div className="flex flex-col items-center gap-6 mt-10">
          <motion.div 
            animate={callState === 'incoming' ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className="relative"
          >
            <img src={callerAvatar} alt={callerName} className="w-32 h-32 rounded-full border-4 border-white/20 shadow-2xl" />
            {callState === 'active' && isVideoEnabled && (
              <div className="absolute inset-0 rounded-full border-2 border-green-500 animate-pulse" />
            )}
          </motion.div>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">{callerName}</h2>
            <p className="text-white/60 font-medium">
              {callState === 'incoming' && `${isVideo ? 'Incoming Video Call' : 'Incoming Audio Call'}...`}
              {callState === 'outgoing' && 'Calling...'}
              {callState === 'active' && formatDuration(duration)}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="w-full px-8 pb-8">
          {callState === 'active' ? (
            <div className="flex flex-col gap-8">
              <div className="flex justify-center gap-6">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                <button 
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  className={`p-4 rounded-full transition-colors ${!isVideoEnabled ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {!isVideoEnabled ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>
                <button 
                  onClick={() => setIsSpeaker(!isSpeaker)}
                  className={`p-4 rounded-full transition-colors ${isSpeaker ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {isSpeaker ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </button>
              </div>
              <div className="flex justify-center">
                <button 
                  onClick={onEnd}
                  className="p-5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                >
                  <PhoneOff className="w-8 h-8" />
                </button>
              </div>
            </div>
          ) : callState === 'incoming' ? (
            <div className="flex justify-between px-8">
              <motion.button 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                onClick={onDecline}
                className="flex flex-col items-center gap-2"
              >
                <div className="p-5 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30">
                  <PhoneOff className="w-8 h-8" />
                </div>
                <span className="text-sm font-medium text-white/80">Decline</span>
              </motion.button>
              
              <motion.button 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                onClick={handleAccept}
                className="flex flex-col items-center gap-2"
              >
                <div className="p-5 rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30">
                  {isVideo ? <Video className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
                </div>
                <span className="text-sm font-medium text-white/80">Accept</span>
              </motion.button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button 
                onClick={onEnd}
                className="p-5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
