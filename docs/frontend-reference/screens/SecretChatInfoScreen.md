# screens/SecretChatInfoScreen.tsx

## File Location
`frontend/src/screens/SecretChatInfoScreen.tsx`

## Purpose
See implementation below for details.

## Implementation

```typescript
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Lock, Trash2, Shield, Clock, EyeOff, Smartphone, Key, CheckCircle, ChevronRight } from 'lucide-react';
import { Chat } from '../types';
import { useAppContext } from '../context/AppContext';
import { apiFetch } from '../utils/fetcher';
import { ENDPOINTS } from '../config/api';

export default function SecretChatInfoScreen({ chat, onBack }: { chat: Chat, onBack: () => void }) {
  const { addToast } = useAppContext();
  const settings = (chat as any).settings || {};
  const [selfDestructTimer, setSelfDestructTimer] = useState(chat.selfDestructTimer || 0);
  const [screenshotProtection, setScreenshotProtection] = useState(settings.screenshotProtection !== false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(!!settings.isVerified);

  React.useEffect(() => {
    setSelfDestructTimer(chat.selfDestructTimer || 0);
    setScreenshotProtection(settings.screenshotProtection !== false);
    setIsVerified(!!settings.isVerified);
  }, [chat.selfDestructTimer, settings.screenshotProtection, settings.isVerified]);

  const updateChatSettings = async (updates: any) => {
    try {
      await apiFetch(ENDPOINTS.CHAT_SETTINGS(chat.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.error('Failed to update chat settings', e);
    }
  };

  const handleSetTimer = (seconds: number) => {
    setSelfDestructTimer(seconds);
    updateChatSettings({ selfDestructTimer: seconds });
    addToast(`Self-destruct timer set to ${seconds}s`, 'success');
  };

  const handleVerify = () => {
    setIsVerifying(true);
    // Simulate fetching a verification code
    setTimeout(() => {
      setVerificationCode('394-102-845');
    }, 800);
  };

  const confirmVerification = () => {
    setIsVerifying(false);
    setIsVerified(true);
    updateChatSettings({ settings: { ...settings, isVerified: true } });
    addToast('Encryption verified successfully', 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: '100%' }} 
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-surface overflow-y-auto"
    >
      <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-on-surface" />
          </button>
          <h1 className="text-lg font-medium text-on-surface tracking-wide">Secret Chat</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-2xl mx-auto pb-20">
        <div className="flex flex-col items-center text-center mt-6 mb-10">
          <div className="relative mb-6">
             <div className="w-28 h-28 rounded-full overflow-hidden border border-white/10 shadow-2xl">
               <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
             </div>
             <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-secondary rounded-full flex items-center justify-center shadow-lg border-4 border-surface">
               <Lock className="w-4 h-4 text-surface" />
             </div>
          </div>
          <h2 className="text-2xl font-semibold text-on-surface tracking-tight">{chat.name}</h2>
          <p className="text-secondary/90 text-sm font-medium tracking-wide mt-2">End-to-end Encrypted</p>
        </div>

        <div className="bg-surface-container-low rounded-3xl overflow-hidden border border-white/5 shadow-sm">
          {/* Encryption Key */}
          <div className="p-5 border-b border-white/5 flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary/20 transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-on-surface text-base tracking-wide">Encryption Key</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">{isVerified ? 'Verified' : 'Unverified connection'}</p>
            </div>
            {isVerified ? (
              <CheckCircle className="w-5 h-5 text-secondary" />
            ) : (
              <button 
                className="text-primary font-medium text-sm hover:text-primary/80 transition-colors"
                onClick={handleVerify}
              >
                Verify
              </button>
            )}
          </div>
          
          <AnimatePresence>
            {isVerifying && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-5 pb-5 pt-2 border-b border-white/5 bg-black/10"
              >
                <div className="bg-surface-container p-4 rounded-2xl text-center border border-white/5">
                   <p className="text-xs text-on-surface-variant mb-3">Compare this code with {chat.name}</p>
                   {verificationCode ? (
                     <>
                        <p className="text-2xl font-mono font-medium tracking-[0.2em] text-on-surface mb-4">{verificationCode}</p>
                        <button 
                          onClick={confirmVerification}
                          className="w-full py-2.5 bg-primary/20 text-primary font-medium rounded-xl hover:bg-primary/30 transition-colors"
                        >
                          Mark as Verified
                        </button>
                     </>
                   ) : (
                     <div className="h-12 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                     </div>
                   )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timer */}
          <div className="p-5 border-b border-white/5 flex items-center gap-4 group hover:bg-white/[0.02] transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-on-surface text-base tracking-wide">Self-Destruct Timer</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Delete messages automatically</p>
            </div>
            <select 
              className="bg-transparent text-sm text-on-surface outline-none cursor-pointer appearance-none text-right font-medium"
              value={selfDestructTimer}
              onChange={(e) => handleSetTimer(Number(e.target.value))}
            >
              <option value={0} className="bg-surface">Off</option>
              <option value={5} className="bg-surface">5s</option>
              <option value={10} className="bg-surface">10s</option>
              <option value={30} className="bg-surface">30s</option>
              <option value={60} className="bg-surface">1m</option>
              <option value={3600} className="bg-surface">1h</option>
              <option value={86400} className="bg-surface">1d</option>
              <option value={604800} className="bg-surface">1w</option>
            </select>
            <ChevronRight className="w-4 h-4 text-on-surface-variant opacity-50 ml-[-4px]" />
          </div>

          {/* Screenshot */}
          <div 
            className="p-5 border-b border-white/5 flex items-center gap-4 group cursor-pointer hover:bg-white/[0.02] transition-colors"
            onClick={() => {
                const newValue = !screenshotProtection;
                setScreenshotProtection(newValue);
                updateChatSettings({ settings: { ...settings, screenshotProtection: newValue } });
                addToast(`Screenshot protection ${newValue ? 'enabled' : 'disabled'}`, 'info');
            }}
          >
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-colors">
              <EyeOff className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-on-surface text-base tracking-wide">Screenshot Protection</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Alert when screenshotted</p>
            </div>
            <div className={`w-11 h-6 rounded-full relative transition-colors ${screenshotProtection ? 'bg-primary' : 'bg-surface-container-highest'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${screenshotProtection ? 'right-1' : 'left-1'}`}></div>
            </div>
          </div>

          {/* Device Specific */}
          <div className="p-5 flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-colors">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-on-surface text-base tracking-wide">Device Session</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Chat restricted to this device</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-3xl overflow-hidden border border-white/5 shadow-sm mt-6">
           <div 
             className="p-5 flex items-center gap-4 cursor-pointer hover:bg-red-500/5 transition-colors text-red-400 group" 
             onClick={() => {
                addToast('Secret chat deleted', 'error');
                setTimeout(() => onBack(), 500);
             }}
           >
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-base tracking-wide">Delete Secret Chat</h3>
              <p className="text-xs opacity-70 mt-0.5">Wipe all messages permanently</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 opacity-40 mt-12 text-center px-6">
          <Key className="w-5 h-5" />
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] leading-relaxed">
            Messages are not stored on servers.<br/>Forwarding is disabled.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
```
