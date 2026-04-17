import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

interface DeleteChatDialogProps {
  isOpen: boolean;
  chatName: string;
  onConfirm: (forEveryone: boolean) => void;
  onCancel: () => void;
}

export default function DeleteChatDialog({
  isOpen,
  chatName,
  onConfirm,
  onCancel,
}: DeleteChatDialogProps) {
  const [forEveryone, setForEveryone] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[500]"
          />
          <div className="fixed inset-0 flex items-center justify-center z-[501] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-sm rounded-[2rem] p-6 pointer-events-auto border border-white/20 shadow-2xl flex flex-col items-center text-center"
            >
              <h2 className="text-xl font-black font-headline text-on-surface mb-2">Delete Chat</h2>
              <p className="text-on-surface-variant text-xs mb-6 px-4">
                  Permanently delete your conversation with <span className="text-on-surface font-bold">{chatName}</span>?
              </p>
              
              <button 
                onClick={() => setForEveryone(!forEveryone)}
                className="w-full mb-8 flex items-center justify-center gap-3 p-4 bg-red-50/50 hover:bg-red-50 rounded-2xl transition-colors group active:scale-95 border border-red-200/50"
              >
                <div className={`w-5 h-5 rounded-lg border-2 border-red-500 flex items-center justify-center transition-colors ${forEveryone ? 'bg-red-500' : 'bg-transparent'}`}>
                  {forEveryone && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                </div>
                <span className="text-sm font-black text-red-600 uppercase tracking-tighter">Also delete for {chatName}</span>
              </button>

              <div className="flex gap-3 w-full">
                <button
                  onClick={onCancel}
                  className="flex-1 py-4 rounded-2xl font-bold text-on-surface-variant bg-white/50 hover:bg-white transition-colors border border-white/40"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onConfirm(forEveryone)}
                  className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 active:scale-95"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
