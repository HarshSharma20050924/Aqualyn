import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, UserPlus, LogOut, Image as ImageIcon, FileText, Link as LinkIcon, Bell, Search, ChevronRight, Ghost, Shield, Users, Settings, MessageSquare, Mic, Video, Trash2, Edit3, UserMinus, Ban, Flag, Share2, Clock, MessageCircle, Hash, Radio } from 'lucide-react';
import { Chat } from '../types';
import { useAppContext } from '../context/AppContext';

interface GroupInfoScreenProps {
  chat: Chat;
  onBack: () => void;
}

export default function GroupInfoScreen({ chat, onBack }: GroupInfoScreenProps) {
  const { contacts, currentUser, addToast } = useAppContext();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [slowMode, setSlowMode] = useState(0);
  const [autoDelete, setAutoDelete] = useState(0);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [topicsEnabled, setTopicsEnabled] = useState(false);

  // Mock participants (in a real app, this would be derived from chat.participants)
  const participants = [
    { id: currentUser?.id, name: 'You', avatar: currentUser?.avatar, role: 'Admin' },
    ...contacts.slice(0, 4).map(c => ({ ...c, role: 'Member' }))
  ];

  const toggleAnonymous = () => {
    setIsAnonymous(!isAnonymous);
    addToast(isAnonymous ? 'You are no longer anonymous' : 'You are now an anonymous admin', 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: '100%' }} 
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[150] bg-surface overflow-y-auto pb-20"
    >
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-xl border-b border-surface-container flex items-center px-4 h-16">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors">
          <ArrowLeft className="w-6 h-6 text-on-surface" />
        </button>
        <h1 className="ml-4 text-xl font-headline font-bold text-on-surface">Group Info</h1>
      </header>

      <div className="flex flex-col items-center py-8 px-4 border-b border-surface-container">
        <div className="relative mb-4">
          <img src={chat.avatar} alt={chat.name} className="w-32 h-32 rounded-full object-cover border-4 border-surface-container-low shadow-lg" />
          <button className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white shadow-md hover:scale-105 transition-transform">
            <ImageIcon className="w-5 h-5" />
          </button>
        </div>
        <h2 className="text-2xl font-headline font-bold text-on-surface text-center">{chat.name}</h2>
        <p className="text-on-surface-variant mt-1">Group • {participants.length} participants</p>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Actions */}
        <div className="flex justify-around py-4 bg-surface-container-low rounded-2xl">
          <button className="flex flex-col items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <div className="p-3 bg-primary/10 rounded-full">
              <UserPlus className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium">Add</span>
          </button>
          <button className="flex flex-col items-center gap-2 text-on-surface hover:opacity-80 transition-opacity">
            <div className="p-3 bg-surface-container-high rounded-full">
              <Search className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium">Search</span>
          </button>
          <button className="flex flex-col items-center gap-2 text-on-surface hover:opacity-80 transition-opacity">
            <div className="p-3 bg-surface-container-high rounded-full">
              <Bell className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium">Mute</span>
          </button>
        </div>

        {/* Description */}
        <div className="bg-surface-container-low rounded-2xl p-4">
          <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Description</h3>
          <p className="text-on-surface leading-relaxed">
            Welcome to the {chat.name}! This is a place for us to collaborate, share ideas, and stay updated on our projects. Please keep discussions relevant and respectful.
          </p>
        </div>

        {/* Media, Links, Docs */}
        <div className="bg-surface-container-low rounded-2xl overflow-hidden">
          <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors">
            <div className="flex items-center gap-3 text-on-surface">
              <ImageIcon className="w-5 h-5 text-secondary" />
              <span className="font-medium">Media, Links, and Docs</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="text-sm">24</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
          <div className="flex gap-2 px-4 pb-4 overflow-x-auto snap-x">
            {[1, 2, 3, 4].map((i) => (
              <img 
                key={i} 
                src={`https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?auto=format&fit=crop&q=80&w=200&h=200&sig=${i}`} 
                alt="Media" 
                className="w-20 h-20 rounded-xl object-cover shrink-0 snap-center"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
        </div>

        {/* Participants */}
        <div className="bg-surface-container-low rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-surface-container">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Participants</h3>
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">{participants.length}</span>
          </div>
          <div className="divide-y divide-surface-container">
            {participants.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-medium text-on-surface">{p.name}</p>
                    <p className="text-xs text-on-surface-variant">{p.role === 'Admin' ? 'Group Admin' : 'Hey there! I am using this app.'}</p>
                  </div>
                </div>
                {p.role === 'Admin' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary border border-secondary/30 px-2 py-0.5 rounded-full">Admin</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Admin Settings */}
        <div className="bg-surface-container-low rounded-2xl overflow-hidden mt-4 border border-white/5">
          <div className="p-4 border-b border-white/5 flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Admin Settings</h3>
          </div>
          
          <div className="p-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-full text-purple-500">
                <Ghost className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-on-surface">Remain Anonymous</p>
                <p className="text-xs text-on-surface-variant">Hide your identity when sending messages</p>
              </div>
            </div>
            <button 
              onClick={toggleAnonymous}
              className={`w-12 h-6 rounded-full transition-colors relative ${isAnonymous ? 'bg-secondary' : 'bg-surface-container-highest'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${isAnonymous ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-full text-blue-500">
                <Users className="w-5 h-5" />
              </div>
              <span className="font-medium text-on-surface">Administrators</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-on-surface-variant">3</span>
              <ChevronRight className="w-5 h-5 text-on-surface-variant" />
            </div>
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-full text-orange-500">
                <Settings className="w-5 h-5" />
              </div>
              <span className="font-medium text-on-surface">Permissions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-on-surface-variant">8/8</span>
              <ChevronRight className="w-5 h-5 text-on-surface-variant" />
            </div>
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-full text-green-500">
                <LinkIcon className="w-5 h-5" />
              </div>
              <span className="font-medium text-on-surface">Invite Links</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-on-surface-variant">2 active</span>
              <ChevronRight className="w-5 h-5 text-on-surface-variant" />
            </div>
          </div>
        </div>

        {/* Chat Settings */}
        <div className="bg-surface-container-low rounded-2xl overflow-hidden mt-4 border border-white/5">
          <div className="p-4 border-b border-white/5 flex items-center gap-3">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Chat Settings</h3>
          </div>

          <div className="p-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-full text-yellow-500">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-on-surface">Slow Mode</p>
                <p className="text-xs text-on-surface-variant">Limit how often members can send messages</p>
              </div>
            </div>
            <select 
              className="bg-surface-container px-3 py-1.5 rounded-lg text-sm text-on-surface border border-white/10 outline-none"
              value={slowMode}
              onChange={(e) => setSlowMode(Number(e.target.value))}
            >
              <option value={0}>Off</option>
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>

          <div className="p-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-full text-red-500">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-on-surface">Auto-Delete Messages</p>
                <p className="text-xs text-on-surface-variant">Automatically delete new messages</p>
              </div>
            </div>
            <select 
              className="bg-surface-container px-3 py-1.5 rounded-lg text-sm text-on-surface border border-white/10 outline-none"
              value={autoDelete}
              onChange={(e) => setAutoDelete(Number(e.target.value))}
            >
              <option value={0}>Off</option>
              <option value={86400}>1 day</option>
              <option value={604800}>1 week</option>
              <option value={2592000}>1 month</option>
            </select>
          </div>

          <div className="p-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/20 rounded-full text-pink-500">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-on-surface">Reactions</p>
                <p className="text-xs text-on-surface-variant">Allow members to react to messages</p>
              </div>
            </div>
            <button 
              onClick={() => setReactionsEnabled(!reactionsEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${reactionsEnabled ? 'bg-secondary' : 'bg-surface-container-highest'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${reactionsEnabled ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-full text-indigo-500">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-on-surface">Topics</p>
                <p className="text-xs text-on-surface-variant">Enable forum-like topics</p>
              </div>
            </div>
            <button 
              onClick={() => setTopicsEnabled(!topicsEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${topicsEnabled ? 'bg-secondary' : 'bg-surface-container-highest'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${topicsEnabled ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/20 rounded-full text-teal-500">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-on-surface">Voice Chat</p>
                <p className="text-xs text-on-surface-variant">Start a live voice chat</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-on-surface-variant" />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-surface-container-low rounded-2xl overflow-hidden mt-8">
          <button className="w-full flex items-center gap-3 p-4 text-red-500 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Leave Group</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
