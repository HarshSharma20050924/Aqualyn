import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplet, AlertCircle } from 'lucide-react';

interface AIActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionTitle: string;
  actionDescription: string;
  actionCount?: number;
}

export default function AIActionModal({
  isOpen,
  onClose,
  onConfirm,
  actionTitle,
  actionDescription,
  actionCount,
}: AIActionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-scrim/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="relative w-full max-w-sm bg-surface-container-lowest rounded-[2rem] p-6 shadow-2xl border border-white/40 flex flex-col items-center text-center"
          >
            {/* Icon */}
            <div className="w-16 h-16 mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary-fixed to-primary-container rounded-[1.2rem] rotate-12 opacity-30" />
              <div className="relative w-full h-full glass-card rounded-[1.2rem] flex items-center justify-center inner-glow aqua-glow">
                <Droplet className="text-secondary w-7 h-7 fill-secondary" />
              </div>
            </div>

            <h2 className="text-xl font-black font-headline text-on-surface mb-2 tracking-tight">
              {actionTitle}
            </h2>
            <p className="text-on-surface-variant font-medium text-sm mb-6 leading-relaxed">
              {actionDescription}
            </p>

            {actionCount !== undefined && (
              <div className="flex items-center gap-2 bg-surface-container p-3 rounded-xl border border-outline-variant/10 w-full mb-6">
                <AlertCircle className="w-4 h-4 text-secondary shrink-0" />
                <span className="text-sm font-semibold text-on-surface">
                  This will affect {actionCount} item{actionCount !== 1 ? 's' : ''}.
                </span>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-surface-container text-on-surface font-bold active:scale-95 transition-transform border border-outline-variant/20"
              >
                Cancel
              </button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className="flex-1 py-3 rounded-2xl liquid-gradient text-white font-bold shadow-lg aqua-glow active:scale-95 transition-transform"
              >
                Continue
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
