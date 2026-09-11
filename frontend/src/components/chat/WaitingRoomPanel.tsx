import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Users } from 'lucide-react';
import { RoomRequest } from '../../types';

interface WaitingRoomPanelProps {
  requests: RoomRequest[];
  onAccept: (requestId: string, guestId: string) => void;
  onDeny: (requestId: string) => void;
}

export default function WaitingRoomPanel({ requests, onAccept, onDeny }: WaitingRoomPanelProps) {
  const pending = requests.filter(r => r.status === 'pending');

  if (pending.length === 0) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden border-b border-white/20"
    >
      <div className="px-4 py-3 glass-card bg-violet-50/80 dark:bg-violet-900/20 border-b border-violet-200/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-violet-500/20 rounded-full flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <span className="text-sm font-headline font-bold text-violet-700 dark:text-violet-300">
            {pending.length} {pending.length === 1 ? 'person' : 'people'} waiting to join
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {pending.map((req) => (
              <motion.div
                key={req.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="flex items-center gap-3 p-2.5 bg-white/60 dark:bg-white/10 rounded-xl border border-white/40"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-blue-400 flex items-center justify-center text-white font-headline font-bold text-sm flex-shrink-0">
                  {req.guestName.charAt(req.guestName.length - 1)}
                </div>

                {/* Name + pulse */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-on-surface truncate">{req.guestName}</p>
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-amber-400"
                    />
                    <span className="text-[11px] text-on-surface-variant">Waiting for approval</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <motion.button
                    onClick={() => onDeny(req.id)}
                    whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                    title="Deny"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </motion.button>
                  <motion.button
                    onClick={() => onAccept(req.id, req.guestId)}
                    whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                    title="Accept"
                  >
                    <Check className="w-4 h-4 text-emerald-600" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
