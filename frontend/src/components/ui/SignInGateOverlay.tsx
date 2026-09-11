import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Droplet, ArrowRight, Star } from 'lucide-react';

interface SignInGateOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  /** Contextual action that triggered the gate, e.g. "like posts" */
  action?: string;
}

export default function SignInGateOverlay({ isOpen, onClose, onSignIn, action = 'interact' }: SignInGateOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="gate-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[900] bg-black/40 backdrop-blur-sm"
          />

          {/* Bottom sheet */}
          <motion.div
            key="gate-sheet"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-[901] flex justify-center px-4 pb-6"
          >
            <div
              className="w-full max-w-md glass-card border border-cyan-400/30 rounded-[2.5rem] p-6 shadow-2xl"
              style={{
                boxShadow: '0 0 40px rgba(0,236,239,0.15), 0 20px 60px rgba(0,0,0,0.3)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(240,252,255,0.92) 100%)',
              }}
            >
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-on-surface-variant" />
              </button>

              {/* Icon */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400/30 to-blue-500/30 flex items-center justify-center">
                    <Droplet className="w-6 h-6 text-secondary" />
                  </div>
                  {/* Animated glow ring */}
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-2xl border-2 border-secondary/40"
                  />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-on-surface text-base">Sign in to {action}</h3>
                  <p className="text-xs text-on-surface-variant">You're browsing as a guest</p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-5">
                {[
                  'Like and comment on posts',
                  'Follow your favourite creators',
                  'Save posts to collections',
                  'Start private conversations',
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
                    <span className="text-sm text-on-surface-variant">{feat}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={onSignIn}
                className="w-full h-13 bg-gradient-to-br from-secondary to-primary text-white font-headline font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Star className="w-4 h-4" />
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="w-full mt-2 py-2 text-xs text-on-surface-variant hover:text-secondary transition-colors"
              >
                Continue as guest
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
