import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, UserPlus, X, Share2, Phone, User, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import AddContactModal from '../components/modals/AddContactModal';

export default function ContactsScreen({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { contacts, setActiveContactId, startChatWithContact, isLoading, addContact, addToast } = useAppContext();
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  const handleContactClick = (id: string) => {
    setActiveContactId(id);
    onNavigate('contact-profile');
  };

  const handleMessageClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    startChatWithContact(id); 
    onNavigate('chat-detail');
  };

  const handleInvite = () => {
    // In a real app, this would use the Web Share API or copy a link
    if (navigator.share) {
      navigator.share({
        title: 'Join Aqualyn',
        text: 'Hey! Join me on Aqualyn, the best messaging app.',
        url: 'https://aqualyn.io/invite',
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText('https://aqualyn.io/invite');
      addToast('Invite link copied to clipboard!', 'success');
    }
  };

  const SkeletonContact = () => (
    <div className="p-4 rounded-2xl flex items-center gap-4 animate-pulse">
      <div className="w-14 h-14 rounded-full bg-white/10 shrink-0"></div>
      <div className="flex-1 min-w-0 space-y-2 border-b border-surface-container pb-2">
        <div className="h-4 bg-white/10 rounded-full w-1/3"></div>
        <div className="h-3 bg-white/10 rounded-full w-1/2"></div>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-surface pb-28">
      <header className="fixed top-0 w-full z-50 bg-slate-50/70 backdrop-blur-xl border-b border-white/15 shadow-[0_8px_32px_0_rgba(0,87,189,0.06)]">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-none">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-on-surface font-headline tracking-tight">Contacts</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleInvite}
              className="p-2 rounded-full text-cyan-600 hover:bg-white/20 transition-colors active:scale-95 duration-200"
              title="Invite Friends"
            >
              <Share2 className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setIsAddContactOpen(true)}
              className="p-2 rounded-full text-cyan-600 hover:bg-white/20 transition-colors active:scale-95 duration-200"
              title="Add Contact"
            >
              <UserPlus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-2xl mx-auto">
        {/* Invite Friends Action Item */}
        <div 
          onClick={handleInvite}
          className="mb-4 p-4 rounded-2xl flex items-center gap-4 cursor-pointer bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20 hover:border-secondary/40 transition-all shadow-sm"
        >
          <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
            <Share2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-headline font-bold text-secondary">Invite Friends</h3>
            <p className="text-sm text-on-surface-variant">Share a link to join Aqualyn</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <SkeletonContact key={i} />)}
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center mt-20 opacity-60">
            <p className="text-on-surface-variant font-medium">No contacts found.</p>
            <p className="text-sm mt-2">Add contacts to start chatting.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {contacts.map(contact => (
              <div 
                key={contact.id} 
                onClick={() => handleContactClick(contact.id)} 
                className="p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/40 transition-all border border-transparent hover:border-white/20"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden shadow-sm">
                  <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 border-b border-surface-container pb-2">
                  <h3 className="font-headline font-semibold text-on-surface truncate">{contact.name}</h3>
                  <p className="text-sm text-on-surface-variant truncate">{contact.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AddContactModal 
        isOpen={isAddContactOpen} 
        onClose={() => setIsAddContactOpen(false)} 
      />
    </motion.div>
  );
}
