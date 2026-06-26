import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, Download, Trash2, MonitorSmartphone, Lock, Key, Loader2, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import DeactivateAccountModal from '../modals/DeactivateAccountModal';
import { apiFetch } from '../../utils/fetcher';
import { ENDPOINTS } from '../../config/api';

export default function SecuritySettings() {
  const { appLockPin, setAppLockPin, archiveLockPin, setArchiveLockPin, addToast, currentUser, updateSettings, updatePrivacy } = useAppContext();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinType, setPinType] = useState<'app' | 'archive'>('app');
  const [pinValue, setPinValue] = useState('');
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  
  const [invitationSetting, setInvitationSetting] = useState<'everyone' | 'mutual' | 'no_one'>(
    (currentUser?.invitationSettings as 'everyone' | 'mutual' | 'no_one') || 'everyone'
  );

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await apiFetch(ENDPOINTS.SESSIONS);
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSessions(false);
    }
  };

  const revokeSession = async (id: string) => {
    try {
      const res = await apiFetch(`${ENDPOINTS.SESSIONS}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
        addToast('Session revoked', 'success');
      }
    } catch (e) {
      addToast('Failed to revoke session', 'error');
    }
  };

  const handleExport = async () => {
    try {
      const res = await apiFetch(ENDPOINTS.EXPORT_DATA, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        addToast(data.message, 'success');
      }
    } catch (e) {
      addToast('Failed to initiate export', 'error');
    }
  };

  const updateInvitationSetting = async (option: 'everyone' | 'mutual' | 'no_one') => {
    setInvitationSetting(option);
    await updatePrivacy({ invitationSettings: option });
  };

  const handleSetPin = async () => {
    if (pinValue.length < 4) {
      addToast('PIN must be at least 4 digits', 'error');
      return;
    }
    
    try {
      const settingsKey = pinType === 'app' ? 'appLockPin' : 'archiveLockPin';
      // In a real app, we should hash the PIN before sending, but for now we rely on HTTPS/Auth
      await updateSettings({
        security: {
          [settingsKey]: pinValue 
        }
      });
      
      if (pinType === 'app') setAppLockPin(pinValue);
      else setArchiveLockPin(pinValue);
      
      addToast(`${pinType === 'app' ? 'App' : 'Archive'} PIN set successfully`, 'success');
      setIsPinModalOpen(false);
      setPinValue('');
    } catch (e) {
      addToast('Failed to set PIN', 'error');
    }
  };

  // Sync PINs from currentUser.settings if they change elsewhere
  useEffect(() => {
    const s = currentUser?.settings?.security;
    if (s?.appLockPin) setAppLockPin(s.appLockPin);
    if (s?.archiveLockPin) setArchiveLockPin(s.archiveLockPin);
  }, [currentUser, setAppLockPin, setArchiveLockPin]);

  return (
    <section className="space-y-4 pb-12">
      <h3 className="font-headline font-bold text-lg text-on-surface px-2 flex items-center gap-2">
        <Shield className="w-5 h-5 text-indigo-500" />
        Security & Data
      </h3>
      
      <div className="glass-card rounded-[2rem] overflow-hidden border border-white/40 shadow-sm">
        <div 
          onClick={() => { setPinType('app'); setIsPinModalOpen(true); }}
          className="p-5 border-b border-white/20 hover:bg-white/40 transition-colors cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 transition-colors">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-on-surface">App Lock</h4>
              <p className="text-sm text-on-surface-variant">{appLockPin ? 'PIN is set' : 'Protect app with a PIN'}</p>
            </div>
          </div>
          {appLockPin && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Active</span>}
        </div>

        <div 
          onClick={() => { setPinType('archive'); setIsPinModalOpen(true); }}
          className="p-5 border-b border-white/20 hover:bg-white/40 transition-colors cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:bg-amber-100 transition-colors">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-on-surface">Archive Lock</h4>
              <p className="text-sm text-on-surface-variant">{archiveLockPin ? 'PIN is set' : 'Lock archived chats with a PIN'}</p>
            </div>
          </div>
          {archiveLockPin && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Active</span>}
        </div>

        <div 
          onClick={() => { setShowSessions(true); fetchSessions(); }}
          className="p-5 border-b border-white/20 hover:bg-white/40 transition-colors cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 transition-colors">
              <MonitorSmartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-on-surface">Linked Devices</h4>
              <p className="text-sm text-on-surface-variant">Use Aqualyn on desktop or web</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md">{loadingSessions ? '...' : `${sessions.length || 'No'} Devices`}</span>
        </div>
        
        <div 
          onClick={handleExport}
          className="p-5 border-b border-white/20 hover:bg-white/40 transition-colors cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-100 transition-colors">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-on-surface">Export Data</h4>
              <p className="text-sm text-on-surface-variant">Download all your chats and media</p>
            </div>
          </div>
        </div>
        
        <div 
          onClick={() => setIsDeactivateModalOpen(true)}
          className="p-5 hover:bg-red-50/50 transition-colors cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-red-600">Deactivate Account</h4>
              <p className="text-sm text-red-500/80">Permanently delete your data</p>
            </div>
          </div>
        </div>
      </div>

      <h3 className="font-headline font-bold text-lg text-on-surface px-2 mt-8 flex items-center gap-2">
        <Smartphone className="w-5 h-5 text-indigo-500" />
        Privacy Settings
      </h3>
      <div className="glass-card rounded-[2rem] overflow-hidden border border-white/40 shadow-sm">
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-bold text-on-surface block mb-2">Who can call me into a chat (@username)?</label>
            <div className="flex gap-2 mb-2">
              {(['everyone', 'mutual', 'no_one'] as const).map(option => (
                <button 
                  key={option}
                  onClick={() => updateInvitationSetting(option)}
                  className={`flex-1 py-3 rounded-xl border font-bold text-xs capitalize transition-all ${
                    invitationSetting === option
                      ? 'bg-secondary text-white border-secondary' 
                      : 'bg-white/40 text-on-surface-variant border-white/20 hover:bg-white/60'
                  }`}
                >
                  {option.replace('_', ' ')}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-on-surface-variant px-1 font-medium leading-relaxed">
              When someone mentions your @username in a 1-to-1 chat, you'll receive an invitation to join. 
              Joining turns the chat into a temporary group without showing previous history.
            </p>
          </div>

          <div className="pt-4 border-t border-white/20">
            <label className="text-sm font-bold text-on-surface flex justify-between items-center mb-2">
              AI Discoverability
              <button 
                onClick={() => updatePrivacy({ aiDiscoverable: !(currentUser?.settings?.privacy?.aiDiscoverable ?? false) })}
                className={`w-12 h-6 rounded-full transition-colors relative ${((currentUser?.settings?.privacy?.aiDiscoverable ?? false)) ? 'bg-secondary' : 'bg-surface-container-high border border-outline-variant/30'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${(currentUser?.settings?.privacy?.aiDiscoverable ?? false) ? 'left-[26px]' : 'left-0.5'}`} />
              </button>
            </label>
            <p className="text-[10px] text-on-surface-variant px-1 font-medium leading-relaxed">
              Allow Lyn AI to recommend channels and people aligned with your interests on the Explore screen.
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isPinModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsPinModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm glass-card rounded-[2.5rem] p-8 shadow-2xl border border-white/40"
            >
              <h3 className="text-2xl font-black font-headline text-on-surface mb-2">Set {pinType === 'app' ? 'App' : 'Archive'} PIN</h3>
              <p className="text-on-surface-variant text-sm mb-6">Enter a 4-digit PIN to secure your {pinType === 'app' ? 'application' : 'archived chats'}.</p>
              
              <input 
                type="password" 
                maxLength={4}
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full h-16 text-center text-3xl tracking-[1rem] font-bold rounded-2xl bg-white/50 border border-white/40 focus:ring-2 focus:ring-primary/20 outline-none mb-6"
              />
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-on-surface-variant hover:bg-white/40 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSetPin}
                  className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  Set PIN
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showSessions && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowSessions(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card rounded-[2.5rem] p-8 shadow-2xl border border-white/40 flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black font-headline text-on-surface">Active Sessions</h3>
                <button onClick={() => setShowSessions(false)} className="p-2 hover:bg-black/5 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="overflow-y-auto space-y-3 pr-2">
                {loadingSessions ? (
                   <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
                ) : sessions.length === 0 ? (
                  <p className="text-center py-12 text-on-surface-variant">No other active sessions found.</p>
                ) : sessions.map(s => (
                  <div key={s.id} className="p-4 rounded-2xl bg-white/40 border border-white/30 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-on-surface">{s.device || 'Unknown Device'}</p>
                      <p className="text-xs text-on-surface-variant">Added: {new Date(s.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => revokeSession(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeactivateAccountModal 
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
      />
    </section>
  );
}
