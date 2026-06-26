import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, UserPlus, X, Share2, Phone, User, Check, RefreshCw, Users, ShieldAlert, Lock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import AddContactModal from '../components/modals/AddContactModal';
import { apiFetch } from '../utils/fetcher';
import { ENDPOINTS } from '../config/api';
import BubbleLoader from '../components/ui/BubbleLoader';

export default function ContactsScreen({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { 
    contacts, 
    setActiveContactId, 
    startChatWithContact, 
    isLoading, 
    addContact, 
    addToast, 
    syncContacts,
    currentUser,
    globalUsers,
    setGlobalUsers,
    followUser
  } = useAppContext();

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'contacts' | 'followers' | 'following'>('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);

  // Live global user search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setGlobalSearchResults([]);
      return;
    }
    setIsGlobalSearching(true);
    const timer = setTimeout(() => {
      apiFetch(ENDPOINTS.USER_SEARCH(searchQuery))
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data)) {
            setGlobalSearchResults(data.filter((u: any) => u.id !== currentUser?.id));
            setGlobalUsers((prev: any[]) => {
              const ids = new Set(prev.map((u: any) => u.id));
              const additions = data.filter((u: any) => !ids.has(u.id));
              return additions.length > 0 ? [...prev, ...additions] : prev;
            });
          }
        })
        .catch(console.error)
        .finally(() => setIsGlobalSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUser?.id, setGlobalUsers]);

  useEffect(() => {
    if (currentUser?.id) {
      const fetchFollowData = async () => {
        try {
          const [followersRes, followingRes] = await Promise.all([
            apiFetch(ENDPOINTS.GET_FOLLOWERS(currentUser.id)).catch(() => ({ ok: false })),
            apiFetch(ENDPOINTS.GET_FOLLOWING(currentUser.id)).catch(() => ({ ok: false }))
          ]);
          
          let newUsers: any[] = [];
          if (followersRes.ok) {
            const followers = await (followersRes as Response).json();
            if (Array.isArray(followers)) newUsers = [...newUsers, ...followers];
          }
          if (followingRes.ok) {
            const following = await (followingRes as Response).json();
            if (Array.isArray(following)) newUsers = [...newUsers, ...following];
          }
          
          if (newUsers.length > 0) {
            setGlobalUsers((prev: any[]) => {
              const existingIds = new Set(prev.map(u => u.id));
              const additions = newUsers.filter(u => !existingIds.has(u.id));
              return [...prev, ...additions];
            });
          }
        } catch (e) {
          console.error("Failed to fetch follow data:", e);
        }
      };
      fetchFollowData();
    }
  }, [currentUser?.id, setGlobalUsers]);

  const handleContactClick = (id: string) => {
    setActiveContactId(id);
    onNavigate('contact-profile');
  };

  const handleInvite = () => {
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

  // 🔵 Dynamic lists derived from current user relationships and global state
  const getFilteredList = () => {
    const query = searchQuery.toLowerCase();
    
    if (activeTab === 'contacts') {
      return contacts.filter(c => c.name.toLowerCase().includes(query));
    }
    
    if (activeTab === 'followers') {
      const followerIds = currentUser?.followers || [];
      return globalUsers
        .filter(u => followerIds.includes(u.id))
        .map(u => ({
          id: u.id,
          name: u.displayName || u.username || 'Follower',
          avatar: u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username || 'F'}`,
          role: u.bio || 'Follower'
        }))
        .filter(c => c.name.toLowerCase().includes(query));
    }
    
    if (activeTab === 'following') {
      const followingIds = currentUser?.following || [];
      return globalUsers
        .filter(u => followingIds.includes(u.id))
        .map(u => ({
          id: u.id,
          name: u.displayName || u.username || 'Following',
          avatar: u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username || 'F'}`,
          role: u.bio || 'Following'
        }))
        .filter(c => c.name.toLowerCase().includes(query));
    }

    return [];
  };

  const currentList = getFilteredList();

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col bg-surface pb-28">
      <header className="sticky top-0 shrink-0 w-full z-50 bg-slate-50/70 backdrop-blur-xl border-b border-white/15 shadow-[0_8px_32px_0_rgba(0,87,189,0.06)]">
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

      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        {/* Invite & Sync actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div 
            onClick={handleInvite}
            className="p-4 rounded-[2rem] flex flex-col items-center gap-2 cursor-pointer bg-secondary/5 border border-secondary/10 hover:bg-secondary/10 hover:border-secondary/20 transition-all shadow-sm group"
          >
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-secondary">Invite Friends</span>
          </div>

          <div 
             onClick={syncContacts}
             className="p-4 rounded-[2rem] flex flex-col items-center gap-2 cursor-pointer bg-primary/5 border border-primary/10 hover:bg-primary/10 hover:border-primary/20 transition-all shadow-sm group"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:-rotate-6 transition-transform">
              <RefreshCw className="w-5 h-5 animate-spin-hover" />
            </div>
            <span className="font-bold text-xs text-primary">Sync Contacts</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative mb-6">
          <input 
            type="text"
            placeholder="Search globally by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 rounded-2xl bg-white/40 border border-white/50 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
          />
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-on-surface-variant/60" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3.5 text-on-surface-variant hover:text-on-surface"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Dynamic Tab Switcher */}
        <div className="flex border-b border-surface-container mb-6">
          <button 
            onClick={() => { setActiveTab('contacts'); setSearchQuery(''); }}
            className={`flex-1 py-3 text-center text-sm font-bold transition-all relative ${activeTab === 'contacts' ? 'text-primary' : 'text-on-surface-variant/80'}`}
          >
            All Contacts ({contacts.length})
            {activeTab === 'contacts' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />}
          </button>
          
          <button 
            onClick={() => { setActiveTab('followers'); setSearchQuery(''); }}
            className={`flex-1 py-3 text-center text-sm font-bold transition-all relative ${activeTab === 'followers' ? 'text-primary' : 'text-on-surface-variant/80'}`}
          >
            Followers ({currentUser?._count?.followers ?? currentUser?.followers?.length ?? 0})
            {activeTab === 'followers' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />}
          </button>

          <button 
            onClick={() => { setActiveTab('following'); setSearchQuery(''); }}
            className={`flex-1 py-3 text-center text-sm font-bold transition-all relative ${activeTab === 'following' ? 'text-primary' : 'text-on-surface-variant/80'}`}
          >
            Following ({currentUser?._count?.following ?? currentUser?.following?.length ?? 0})
            {activeTab === 'following' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <SkeletonContact key={i} />)}
          </div>
        ) : searchQuery.trim() ? (
          // Global search results
          <div className="space-y-3">
            {isGlobalSearching ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <BubbleLoader width={60} height={60} />
                <p className="text-xs text-on-surface-variant">Searching...</p>
              </div>
            ) : globalSearchResults.length === 0 ? (
              <div className="text-center mt-8 py-10 opacity-60 flex flex-col items-center gap-3">
                <Users className="w-10 h-10 text-on-surface-variant/40" />
                <p className="text-on-surface-variant font-medium">No users found for "{searchQuery}"</p>
              </div>
            ) : (
              globalSearchResults.map(user => {
                const isFollowing = currentUser?.following?.includes(user.id);
                const hasSentReq = user.followRequests?.includes(currentUser?.id || '');
                return (
                  <div
                    key={user.id}
                    className="p-4 rounded-2xl flex items-center gap-4 border border-secondary-fixed/20 bg-white/20 hover:bg-white/40 transition-all shadow-sm"
                  >
                    <div
                      className="w-14 h-14 rounded-full overflow-hidden shadow-sm cursor-pointer"
                      onClick={() => { setActiveContactId(user.id); onNavigate('contact-profile'); }}
                    >
                      <img src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 border-b border-surface-container pb-2" onClick={() => { setActiveContactId(user.id); onNavigate('contact-profile'); }}>
                      <div className="flex items-center gap-1">
                        <h3 className="font-headline font-bold text-on-surface truncate">{user.displayName || user.name || 'User'}</h3>
                        {user.isPrivate && <Lock className="w-3 h-3 text-on-surface-variant shrink-0" />}
                      </div>
                      <p className="text-sm text-on-surface-variant truncate">@{user.username}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isFollowing ? (
                        <button
                          onClick={() => { startChatWithContact(user.id); onNavigate('chat-detail'); }}
                          className="px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold hover:bg-secondary/20 transition-colors"
                        >
                          Message
                        </button>
                      ) : hasSentReq ? (
                        <button className="px-4 py-1.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold cursor-default">
                          Requested
                        </button>
                      ) : (
                        <button
                          onClick={() => followUser(user.id)}
                          className="px-4 py-1.5 rounded-full liquid-gradient text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
                        >
                          Follow
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center mt-12 py-10 opacity-60 flex flex-col items-center justify-center gap-3">
            <Users className="w-12 h-12 text-on-surface-variant/40" />
            <div>
              <p className="text-on-surface-variant font-medium">No results found in {activeTab}</p>
              <p className="text-xs mt-1">Try a different search query or update your lists.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {currentList.map(contact => (
              <div 
                key={contact.id} 
                onClick={() => handleContactClick(contact.id)} 
                className="p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/40 transition-all border border-transparent hover:border-white/20 shadow-sm bg-white/20"
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
