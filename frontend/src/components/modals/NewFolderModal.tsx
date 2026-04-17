import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FolderPlus, Check, ArrowLeft, Search, Plus } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewFolderModal({ isOpen, onClose }: NewFolderModalProps) {
  const { chats, createFolder, folders, addToast } = useAppContext();
  const [folderName, setFolderName] = useState('');
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState<'name' | 'chats'>('name');

  const filteredChats = chats.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleChat = (id: string) => {
    setSelectedChats(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleNextStep = () => {
    if (!folderName.trim()) return;
    const folderExists = folders.some(f => f.name.toLowerCase() === folderName.trim().toLowerCase());
    if (folderExists) {
      addToast('A folder with this name already exists', 'error');
      return;
    }
    setStep('chats');
  };

  const handleCreate = () => {
    if (!folderName.trim()) return;
    createFolder(folderName, selectedChats);
    setFolderName('');
    setSelectedChats([]);
    setStep('name');
    onClose();
  };

  const handleClose = () => {
    setFolderName('');
    setSelectedChats([]);
    setStep('name');
    onClose();
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
                  onClick={() => step === 'chats' ? setStep('name') : handleClose()}
                  className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-on-surface"
                >
                  {step === 'chats' ? <ArrowLeft className="w-6 h-6" /> : <X className="w-6 h-6" />}
                </button>
                <h2 className="text-xl font-bold font-headline text-on-surface">
                  {step === 'name' ? 'New Folder' : 'Add Chats'}
                </h2>
              </div>
              {step === 'chats' && (
                <span className="text-sm font-medium text-secondary">
                  {selectedChats.length} selected
                </span>
              )}
            </div>

            {/* Content */}
            {step === 'name' ? (
              <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mb-8 shadow-inner border border-secondary/30">
                  <FolderPlus className="w-10 h-10" />
                </div>

                <div className="w-full space-y-6">
                  <div className="relative group">
                    <input 
                      type="text" 
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      placeholder="Folder name" 
                      className="w-full h-14 bg-transparent border-b-2 border-white/10 focus:border-secondary transition-all outline-none text-on-surface text-lg px-2 placeholder:text-on-surface-variant/50 text-center"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="mt-8 w-full">
                  <button
                    onClick={handleNextStep}
                    disabled={!folderName.trim()}
                    className="w-full h-14 bg-secondary/10 text-secondary border border-secondary/20 rounded-2xl flex items-center justify-center gap-2 hover:bg-secondary/20 transition-colors disabled:opacity-50 font-semibold"
                  >
                    <Plus className="w-5 h-5" />
                    Add Chats
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto flex flex-col">
                <div className="p-4 shrink-0 border-b border-white/10">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search chats..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 pb-24">
                  {filteredChats.map(chat => (
                    <div 
                      key={chat.id}
                      onClick={() => toggleChat(chat.id)}
                      className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 rounded-xl transition-colors"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                          <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                        </div>
                        {selectedChats.includes(chat.id) && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary rounded-full border-2 border-surface flex items-center justify-center">
                            <Check className="w-3 h-3 text-on-secondary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-on-surface truncate">{chat.name}</h3>
                        <p className="text-sm text-on-surface-variant truncate">{chat.lastMessage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Floating Action Button */}
            <div className="p-6 shrink-0 relative h-24">
              <AnimatePresence>
                {folderName.trim() && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    onClick={handleCreate}
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
