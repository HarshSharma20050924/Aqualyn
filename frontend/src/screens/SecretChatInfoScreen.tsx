import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Lock, Trash2, Shield, Clock, EyeOff, Smartphone, Key } from 'lucide-react';
import { Chat } from '../types';
import { useAppContext } from '../context/AppContext';

export default function SecretChatInfoScreen({ chat, onBack }: { chat: Chat, onBack: () => void }) {
  const { addToast } = useAppContext();
  const [selfDestructTimer, setSelfDestructTimer] = useState(chat.selfDestructTimer || 0);

  const handleSetTimer = (seconds: number) => {
    setSelfDestructTimer(seconds);
    addToast(`Self-destruct timer set to ${seconds}s`, 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: '100%' }} 
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-surface overflow-y-auto"
    >
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-xl border-b border-white/10 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <h1 className="text-xl font-bold text-on-surface">Secret Chat</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-2xl mx-auto pb-20">
        <div className="flex flex-col items-center text-center mt-4 mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-green-500/30">
            <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <Lock className="w-5 h-5 text-green-500" />
            {chat.name}
          </h2>
          <p className="text-green-500 font-medium mt-1">End-to-end encrypted</p>
        </div>

        <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-white/5">
          <div className="p-4 border-b border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-on-surface">Encryption Key</h3>
              <p className="text-sm text-on-surface-variant">Verify end-to-end encryption</p>
            </div>
            <button className="text-primary font-bold text-sm uppercase tracking-wider" onClick={() => addToast('Key verification opened', 'info')}>Verify</button>
          </div>
          
          <div className="p-4 border-b border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-on-surface">Self-Destruct Timer</h3>
              <p className="text-sm text-on-surface-variant">Messages delete automatically</p>
            </div>
            <select 
              className="bg-surface-container px-3 py-1.5 rounded-lg text-sm text-on-surface border border-white/10 outline-none"
              value={selfDestructTimer}
              onChange={(e) => handleSetTimer(Number(e.target.value))}
            >
              <option value={0}>Off</option>
              <option value={5}>5 seconds</option>
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={3600}>1 hour</option>
              <option value={86400}>1 day</option>
              <option value={604800}>1 week</option>
            </select>
          </div>

          <div className="p-4 border-b border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
              <EyeOff className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-on-surface">Screenshot Protection</h3>
              <p className="text-sm text-on-surface-variant">Notifications when screenshots are taken</p>
            </div>
            <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer" onClick={() => addToast('Screenshot protection toggled', 'info')}>
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-on-surface">Device-Specific Session</h3>
              <p className="text-sm text-on-surface-variant">This chat is only available on this device</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-white/5">
           <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors text-red-500" onClick={() => addToast('Secret chat deleted', 'error')}>
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">Delete Secret Chat</h3>
              <p className="text-sm opacity-80">Wipe all messages permanently</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 opacity-50 mt-8 text-center px-4">
          <Key className="text-on-surface-variant w-6 h-6 mb-2" />
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
            Messages are not stored on servers.<br/>Forwarding is disabled.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
