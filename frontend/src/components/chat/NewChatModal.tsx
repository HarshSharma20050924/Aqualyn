import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Users, ArrowRight, Camera, Check, ArrowLeft, Shield, Clock, UserPlus } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import AddContactModal from '../modals/AddContactModal';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (s: string) => void;
}

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (c: boolean) => void }) => (
  <div
    onClick={() => onChange(!checked)}
    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out flex items-center ${checked ? 'bg-secondary' : 'bg-surface-container-highest'}`}
  >
    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
  </div>
);

const ToggleRow = ({ icon, title, subtitle, state, setState }: any) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-on-surface-variant">
        {icon}
      </div>
      <div>
        <h4 className="text-on-surface font-medium">{title}</h4>
        {subtitle && <p className="text-xs text-on-surface-variant">{subtitle}</p>}
      </div>
    </div>
    <Toggle checked={state} onChange={setState} />
  </div>
);

export default function NewChatModal({ isOpen, onClose, onNavigate }: NewChatModalProps) {
  const { contacts, currentUser, startChatWithContact, createGroupChat } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [mode, setMode] = useState<'default' | 'group-select' | 'group-info'>('default');
  
  // Group Info State
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [disappearing, setDisappearing] = useState(false);
  const [adminOnly, setAdminOnly] = useState(false);
  
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleContact = (id: string) => {
    setSelectedContacts(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleContactClick = (id: string) => {
    if (mode === 'group-select') {
      toggleContact(id);
    } else {
      startChatWithContact(id);
      handleClose();
      onNavigate('chat-detail');
    }
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedContacts.length === 0) return;
    createGroupChat(groupName, selectedContacts, {
      description: groupDesc,
      adminOnly,
      disappearingMessages: disappearing
    });
    handleClose();
    onNavigate('chat-detail');
  };

  const handleClose = () => {
    setMode('default');
    setSelectedContacts([]);
    setGroupName('');
    setGroupDesc('');
    setSearchQuery('');
    setDisappearing(false);
    setAdminOnly(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[101] bg-surface rounded-t-[2rem] shadow-2xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden border-t border-white/20"
          >
            {/* Header */}
            <div className="flex items-center p-4 border-b border-white/10 shrink-0">
              {mode !== 'default' && (
                <button 
                  onClick={() => setMode(mode === 'group-info' ? 'group-select' : 'default')} 
                  className="p-2 mr-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-on-surface" />
                </button>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold font-headline text-on-surface">
                  {mode === 'default' ? 'New Chat' : 'New Group'}
                </h2>
                {mode === 'group-select' && (
                  <p className="text-xs text-on-surface-variant">Add members</p>
                )}
                {mode === 'group-info' && (
                  <p className="text-xs text-on-surface-variant">Add subject</p>
                )}
              </div>
              {mode === 'default' && (
                <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-6 h-6 text-on-surface-variant" />
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
              <AnimatePresence mode="wait">
                {/* DEFAULT & GROUP-SELECT MODE */}
                {(mode === 'default' || mode === 'group-select') && (
                  <motion.div 
                    key="select-mode"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col overflow-hidden absolute inset-0"
                  >
                    {/* Selected Contacts Horizontal Bar (Only in group-select) */}
                    {mode === 'group-select' && selectedContacts.length > 0 && (
                      <div className="flex gap-4 overflow-x-auto px-4 py-3 border-b border-white/10 custom-scrollbar shrink-0 items-start min-h-[100px]">
                        <AnimatePresence>
                          {selectedContacts.map(id => {
                            const c = contacts.find(c => c.id === id);
                            if (!c) return null;
                            return (
                              <motion.div
                                key={id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8, width: 0, margin: 0 }}
                                className="flex flex-col items-center gap-1 w-14 shrink-0"
                              >
                                <div className="relative">
                                  <img src={c.avatar} alt={c.name} className="w-14 h-14 rounded-full object-cover border-2 border-transparent" />
                                  <button
                                    onClick={() => toggleContact(id)}
                                    className="absolute -top-1 -right-1 bg-surface-container-highest border-2 border-surface rounded-full p-0.5 text-on-surface-variant hover:text-white hover:bg-red-500 transition-colors z-10"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="text-xs text-on-surface-variant truncate w-full text-center">{c.name.split(' ')[0]}</span>
                              </motion.div>
                            )
                          })}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Search Bar */}
                    <div className="p-4 shrink-0">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search contacts..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                      </div>
                    </div>

                    {/* Contacts List */}
                    <div className="flex-1 overflow-y-auto p-2 pb-24">
                      {mode === 'default' && !searchQuery && (
                        <div className="mb-4">
                          <div 
                            className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 rounded-xl transition-colors"
                            onClick={() => setMode('group-select')}
                          >
                            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-lg shadow-secondary/20">
                              <Users className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-on-surface">New Group</h3>
                          </div>
                          <div 
                            className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 rounded-xl transition-colors"
                            onClick={() => setIsAddContactOpen(true)}
                          >
                            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-lg shadow-secondary/20">
                              <UserPlus className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-on-surface">New Contact</h3>
                          </div>
                        </div>
                      )}

                      <div className="px-4 py-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        Contacts on Aqualyn
                      </div>

                      {filteredContacts.length === 0 ? (
                        <div className="text-center p-8 opacity-50">
                          <p className="text-on-surface-variant">No contacts found</p>
                        </div>
                      ) : (
                        filteredContacts.map(contact => (
                          <div 
                            key={contact.id}
                            onClick={() => handleContactClick(contact.id)}
                            className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 rounded-xl transition-colors"
                          >
                            <div className="relative">
                              <div className="w-12 h-12 rounded-full overflow-hidden">
                                <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                              </div>
                              {mode === 'group-select' && selectedContacts.includes(contact.id) && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary rounded-full border-2 border-surface flex items-center justify-center">
                                  <Check className="w-3 h-3 text-on-secondary" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-on-surface truncate">{contact.name}</h3>
                              <p className="text-sm text-on-surface-variant truncate">{contact.role}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {/* GROUP INFO MODE */}
                {mode === 'group-info' && (
                  <motion.div 
                    key="info-mode"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col overflow-y-auto absolute inset-0 pb-24"
                  >
                    {/* Image & Name */}
                    <div className="flex items-center gap-4 p-4 mt-2">
                      <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center text-secondary relative overflow-hidden group cursor-pointer shrink-0">
                        <Camera className="w-6 h-6" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white">Add</span>
                        </div>
                      </div>
                      <div className="flex-1 border-b border-secondary/50 pb-1">
                        <input
                          type="text"
                          value={groupName}
                          onChange={e => setGroupName(e.target.value)}
                          placeholder="Group Name"
                          className="w-full bg-transparent text-on-surface text-lg font-semibold outline-none placeholder:text-on-surface-variant/50 placeholder:font-normal"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="px-4 py-2">
                      <div className="border-b border-white/10 pb-1">
                        <input
                          type="text"
                          value={groupDesc}
                          onChange={e => setGroupDesc(e.target.value)}
                          placeholder="Group Description (optional)"
                          className="w-full bg-transparent text-on-surface text-sm outline-none placeholder:text-on-surface-variant/50"
                        />
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="mt-6 px-4 space-y-2">
                      <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Settings</h3>
                      <ToggleRow icon={<Clock className="w-5 h-5"/>} title="Disappearing Messages" subtitle={disappearing ? "On" : "Off"} state={disappearing} setState={setDisappearing} />
                      <ToggleRow icon={<Shield className="w-5 h-5"/>} title="Only Admins can send messages" state={adminOnly} setState={setAdminOnly} />
                    </div>

                    {/* Members */}
                    <div className="mt-8 px-4">
                      <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Members: {selectedContacts.length + 1}</h3>
                      <div className="space-y-4">
                        {/* Current User as Admin */}
                        <div className="flex items-center gap-4">
                          <img src={currentUser?.avatar} className="w-12 h-12 rounded-full" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-on-surface">You</h4>
                            <p className="text-xs text-secondary">Group Admin</p>
                          </div>
                        </div>
                        {/* Selected Members */}
                        {selectedContacts.map(id => {
                          const c = contacts.find(c => c.id === id);
                          if (!c) return null;
                          return (
                            <div key={id} className="flex items-center gap-4">
                              <img src={c.avatar} className="w-12 h-12 rounded-full" />
                              <div className="flex-1">
                                <h4 className="font-semibold text-on-surface">{c.name}</h4>
                                <p className="text-xs text-on-surface-variant">{c.role}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Floating Action Buttons */}
            <AnimatePresence>
              {mode === 'group-select' && selectedContacts.length > 0 && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => setMode('group-info')}
                  className="absolute bottom-6 right-6 w-14 h-14 bg-secondary text-on-secondary rounded-full shadow-lg shadow-secondary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50"
                >
                  <ArrowRight className="w-6 h-6" />
                </motion.button>
              )}
              {mode === 'group-info' && groupName.trim().length > 0 && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={handleCreateGroup}
                  className="absolute bottom-6 right-6 w-14 h-14 bg-secondary text-on-secondary rounded-full shadow-lg shadow-secondary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50"
                >
                  <Check className="w-6 h-6" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
          <AddContactModal isOpen={isAddContactOpen} onClose={() => setIsAddContactOpen(false)} />
        </>
      )}
    </AnimatePresence>
  );
}
