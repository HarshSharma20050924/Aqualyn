import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Trash2, Send, Square } from 'lucide-react';

interface AudioRecorderUIProps {
  isRecording: boolean;
  onStop: (audioUrl?: string) => void;
  onCancel: () => void;
}

export default function AudioRecorderUI({ isRecording, onStop, onCancel }: AudioRecorderUIProps) {
  const [duration, setDuration] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    // In a real app, this would return the actual audio blob/url
    onStop('mock-audio-url');
  };

  return (
    <AnimatePresence>
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute inset-0 z-50 bg-surface/90 backdrop-blur-md flex items-center justify-between px-4 rounded-full border border-red-500/30 shadow-lg shadow-red-500/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-red-500 font-medium w-12">{formatTime(duration)}</span>
          </div>

          <div className="flex-1 flex justify-center">
            <motion.div
              animate={{ x: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="text-on-surface-variant text-sm flex items-center gap-2 opacity-70"
            >
              <span className="text-xs uppercase tracking-widest font-bold">&lt; Slide to cancel</span>
            </motion.div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-white/10 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleStop}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white shadow-lg shadow-secondary/30 hover:scale-105 transition-transform"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
