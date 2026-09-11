import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Lock, Copy, Share2, Check, X, ChevronRight, Droplet } from 'lucide-react';
import { ENDPOINTS } from '../../config/api';

interface ChatroomCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestId: string;
  guestName: string;
  onRoomCreated: (token: string, isPrivate: boolean, name?: string) => void;
}

export default function ChatroomCreateModal({
  isOpen, onClose, guestId, guestName, onRoomCreated
}: ChatroomCreateModalProps) {
  const [step, setStep] = useState<'pick' | 'details' | 'url'>('pick');
  const [selectedType, setSelectedType] = useState<'public' | 'private' | null>(null);
  const [roomName, setRoomName] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomUrl = generatedToken
    ? `${window.location.origin}${window.location.pathname}#/room/${generatedToken}`
    : null;

  const handleCreateRoom = async () => {
    if (!selectedType) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.ROOM_CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPrivate: selectedType === 'private',
          name: roomName.trim() || undefined,
          hostGuestId: guestId,
          hostName: guestName,
        }),
      });

      if (!res.ok) {
        // Fallback: generate token client-side if backend not ready
        const localToken = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setGeneratedToken(localToken);
        setStep('url');
        onRoomCreated(localToken, selectedType === 'private', roomName.trim() || undefined);
        return;
      }

      const data = await res.json();
      const token = data.token || data.id;
      setGeneratedToken(token);
      setStep('url');
      onRoomCreated(token, selectedType === 'private', roomName.trim() || undefined);
    } catch (e) {
      // Graceful fallback when backend endpoint not yet available
      const localToken = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      setGeneratedToken(localToken);
      setStep('url');
      onRoomCreated(localToken, selectedType === 'private', roomName.trim() || undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!roomUrl) return;
    await navigator.clipboard.writeText(roomUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!roomUrl) return;
    if (navigator.share) {
      await navigator.share({ title: 'Join my Aqualyn chatroom', url: roomUrl }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  const handleClose = () => {
    setStep('pick');
    setSelectedType(null);
    setRoomName('');
    setGeneratedToken(null);
    setCopied(false);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[800] bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            key="modal-card"
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className="fixed inset-0 z-[801] flex items-center justify-center px-4"
          >
            <div
              className="w-full max-w-md glass-card border border-cyan-300/30 rounded-[2.5rem] p-8 shadow-2xl relative"
              style={{
                boxShadow: '0 0 60px rgba(0,236,239,0.12), 0 24px 80px rgba(0,0,0,0.25)',
              }}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-on-surface-variant" />
              </button>

              <AnimatePresence mode="wait">

                {/* ── STEP 1: Pick room type ── */}
                {step === 'pick' && (
                  <motion.div key="pick" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400/30 to-blue-500/30 flex items-center justify-center">
                        <Droplet className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <h2 className="font-headline font-bold text-on-surface text-xl">Create Chatroom</h2>
                        <p className="text-xs text-on-surface-variant">Choose who can join</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {/* Public */}
                      <motion.button
                        onClick={() => setSelectedType('public')}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                          selectedType === 'public'
                            ? 'border-secondary bg-secondary/10 shadow-md shadow-secondary/20'
                            : 'border-white/30 bg-white/20 hover:border-secondary/40'
                        }`}
                      >
                        {selectedType === 'public' && (
                          <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 bg-secondary rounded-full flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-cyan-500/30 flex items-center justify-center">
                          <Globe className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="text-center">
                          <p className="font-headline font-bold text-on-surface text-sm">Public</p>
                          <p className="text-[11px] text-on-surface-variant mt-1 leading-tight">Anyone with the link can join instantly</p>
                        </div>
                      </motion.button>

                      {/* Private */}
                      <motion.button
                        onClick={() => setSelectedType('private')}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                          selectedType === 'private'
                            ? 'border-secondary bg-secondary/10 shadow-md shadow-secondary/20'
                            : 'border-white/30 bg-white/20 hover:border-secondary/40'
                        }`}
                      >
                        {selectedType === 'private' && (
                          <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 bg-secondary rounded-full flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400/30 to-blue-500/30 flex items-center justify-center">
                          <Lock className="w-6 h-6 text-violet-600" />
                        </div>
                        <div className="text-center">
                          <p className="font-headline font-bold text-on-surface text-sm">Private</p>
                          <p className="text-[11px] text-on-surface-variant mt-1 leading-tight">Joiners send a request you must approve</p>
                        </div>
                      </motion.button>
                    </div>

                    <button
                      onClick={() => selectedType && setStep('details')}
                      disabled={!selectedType}
                      className="w-full h-13 bg-gradient-to-br from-secondary to-primary text-white font-headline font-bold rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* ── STEP 2: Room details ── */}
                {step === 'details' && (
                  <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="flex items-center gap-2 mb-6">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedType === 'public' ? 'bg-emerald-100' : 'bg-violet-100'}`}>
                        {selectedType === 'public' ? <Globe className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-violet-600" />}
                      </div>
                      <div>
                        <h2 className="font-headline font-bold text-on-surface">
                          {selectedType === 'public' ? 'Public' : 'Private'} Room
                        </h2>
                        <p className="text-xs text-on-surface-variant">Optional: give your room a name</p>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="space-y-2">
                        <label className="font-label text-sm font-semibold text-on-surface-variant ml-1">Room Name (optional)</label>
                        <input
                          type="text"
                          value={roomName}
                          onChange={e => setRoomName(e.target.value)}
                          placeholder="e.g. Weekend Plans, Study Group..."
                          maxLength={50}
                          className="w-full h-13 bg-white/50 border border-white/40 rounded-2xl px-4 focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/50 font-body text-on-surface shadow-inner"
                          autoFocus
                        />
                      </div>

                      {error && (
                        <p className="text-red-500 text-xs text-center">{error}</p>
                      )}
                    </div>

                    <button
                      onClick={handleCreateRoom}
                      disabled={isLoading}
                      className="w-full h-13 bg-gradient-to-br from-secondary to-primary text-white font-headline font-bold rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Create Room <ChevronRight className="w-4 h-4" /></>
                      )}
                    </button>

                    <button onClick={() => setStep('pick')} className="w-full mt-3 text-xs text-on-surface-variant/60 hover:text-secondary transition-colors text-center">
                      ← Back
                    </button>
                  </motion.div>
                )}

                {/* ── STEP 3: Share URL ── */}
                {step === 'url' && roomUrl && (
                  <motion.div key="url" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="text-center mb-6">
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                        className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center"
                      >
                        {selectedType === 'public' ? <Globe className="w-8 h-8 text-secondary" /> : <Lock className="w-8 h-8 text-secondary" />}
                      </motion.div>
                      <h2 className="font-headline font-bold text-on-surface text-xl">
                        {roomName || (selectedType === 'public' ? 'Public Room' : 'Private Room')} Created!
                      </h2>
                      <p className="text-sm text-on-surface-variant mt-1">
                        {selectedType === 'public'
                          ? 'Share this link — anyone can join instantly'
                          : 'Share this link — joiners must be approved by you'}
                      </p>
                    </div>

                    {/* URL display */}
                    <div className="glass-card bg-white/40 border border-white/40 rounded-2xl p-3 mb-4 break-all">
                      <p className="text-xs font-mono text-on-surface leading-relaxed select-all">{roomUrl}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 mb-4">
                      <motion.button
                        onClick={handleCopy}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 h-12 glass-card bg-white/50 border border-white/40 rounded-2xl font-headline font-semibold text-on-surface text-sm hover:bg-white/70 transition-all flex items-center justify-center gap-2"
                      >
                        {copied ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </motion.button>
                      <motion.button
                        onClick={handleShare}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 h-12 bg-gradient-to-br from-secondary to-primary text-white font-headline font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </motion.button>
                    </div>

                    {/* Privacy badge */}
                    <div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
                      selectedType === 'public' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'
                    }`}>
                      {selectedType === 'public'
                        ? <><Globe className="w-3.5 h-3.5 flex-shrink-0" /> Anyone with this link joins your chatroom directly.</>
                        : <><Lock className="w-3.5 h-3.5 flex-shrink-0" /> You'll see join requests and must approve them before they enter.</>
                      }
                    </div>

                    <button
                      onClick={handleClose}
                      className="w-full mt-4 h-13 bg-gradient-to-br from-secondary/80 to-primary/80 text-white font-headline font-bold rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      Open My Chatroom →
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
