import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Check } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface ShareContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (contactId: string) => void;
}

export default function ShareContactModal({ isOpen, onClose, onShare }: ShareContactModalProps) {
  const { chats, currentUser } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  const contacts = chats.filter(c => !c.isGroup && !c.isSecret && c.id !== currentUser.id);
  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleShare = () => {
    if (selectedContact) {
      onShare(selectedContact);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md glass-card rounded-3xl p-6 z-50 shadow-2xl border border-white/20"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-on-surface font-headline">Share Contact</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-on-surface-variant transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-on-surface placeholder:text-on-surface-variant transition-all"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 mb-6 custom-scrollbar pr-2">
              {filteredContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    selectedContact === contact.id ? 'bg-secondary/20 border border-secondary/50' : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-on-surface">{contact.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{contact.lastMessage}</p>
                  </div>
                  {selectedContact === contact.id && (
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
              {filteredContacts.length === 0 && (
                <p className="text-center text-on-surface-variant py-4">No contacts found</p>
              )}
            </div>

            <button
              onClick={handleShare}
              disabled={!selectedContact}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20"
            >
              Share
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
