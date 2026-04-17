import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, User, Phone, Check, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddContactModal({ isOpen, onClose }: AddContactModalProps) {
  const { addContact, currentUser } = useAppContext();
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const handleAddContact = () => {
    if (newContactName.trim() && newContactPhone.trim()) {
      addContact(
        newContactName, 
        newContactPhone, 
        `local_${Date.now()}`, 
        `https://api.dicebear.com/7.x/initials/svg?seed=${newContactName}`
      );
      setNewContactName('');
      setNewContactPhone('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4"
        >
          <motion.div 
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-md bg-surface sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-surface/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button 
                  onClick={onClose}
                  className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-on-surface"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold font-headline text-on-surface">New Contact</h2>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mb-8 shadow-inner border border-secondary/30">
                <UserPlus className="w-10 h-10" />
              </div>

              <div className="w-full space-y-6">
                {/* Name Input */}
                <div className="relative group">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors">
                    <User className="w-6 h-6" />
                  </div>
                  <input 
                    type="text" 
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="First name (required)" 
                    className="w-full h-14 bg-transparent border-b-2 border-white/10 focus:border-secondary transition-all outline-none text-on-surface text-lg pl-10 placeholder:text-on-surface-variant/50"
                    autoFocus
                  />
                </div>

                {/* Phone Input */}
                <div className="relative group">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="flex items-center w-full border-b-2 border-white/10 group-focus-within:border-secondary transition-all">
                    <div className="pl-10 pr-2 py-4 text-on-surface text-lg border-r border-white/10 shrink-0 flex items-center gap-1">
                      <span className="text-on-surface-variant">+</span>
                      <span>1</span>
                    </div>
                    <input 
                      type="tel" 
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Phone number" 
                      className="flex-1 h-14 bg-transparent outline-none text-on-surface text-lg pl-4 placeholder:text-on-surface-variant/50 min-w-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Action Button */}
            <div className="p-6 shrink-0 relative h-24">
              <AnimatePresence>
                {newContactName.trim() && newContactPhone.trim() && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    onClick={handleAddContact}
                    className="absolute right-6 bottom-6 w-14 h-14 bg-secondary text-on-secondary rounded-full shadow-lg shadow-secondary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50"
                  >
                    <Check className="w-6 h-6" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
