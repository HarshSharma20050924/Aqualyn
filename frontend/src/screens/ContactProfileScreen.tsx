import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, MessageCircle, Phone, Video, Info, Bell, Ban, Trash2, Lock, ShieldCheck, UserPlus, UserCheck, Clock, Grid, PlayCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { auth } from '../config/firebase';
import { ENDPOINTS } from '../config/api';

export default function ContactProfileScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate: (s: string) => void }) {
  const { contacts, activeContactId, startChatWithContact, addToast, chats, setChats, currentUser, blockContact, reportContact, muteChat, followUser, unfollowUser, posts, globalUsers, setGlobalUsers, getToken } = useAppContext();
  const [requestSent, setRequestSent] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'posts' | 'highlights'>('posts');
  
  // Look in globalUsers first, then contacts, and finally currentUser (for self-profile view)
  const contact = globalUsers.find(c => c.id === activeContactId) || 
                  contacts.find(c => c.id === activeContactId) ||
                  (currentUser?.id === activeContactId ? currentUser : null);

  const chat = chats.find(c => c.id === activeContactId || c.participantIds?.includes(activeContactId || ''));
  const isBlocked = currentUser?.blockedUsers?.includes(activeContactId || '');
  
  // Follow/request state
  const isFollowing = currentUser?.following?.includes(activeContactId || '');
  const isRequested = contact?.receivedFollowReqs?.some((r: any) => r.senderId === currentUser?.id);

  // Fetch user if missing
  React.useEffect(() => {
    if (activeContactId && !contact) {
      const fetchUser = async () => {
        try {
          const idToken = await getToken();
          if (!idToken) return;

          const res = await fetch(ENDPOINTS.USER_PROFILE(activeContactId), {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            setGlobalUsers(prev => {
              if (prev.some(u => u.id === data.id)) return prev;
              return [...prev, data];
            });
          }
        } catch (e) {
          console.error("[ContactProfile] Critical fetch error:", e);
        }
      };
      
      const timer = setTimeout(fetchUser, 100);
      return () => clearTimeout(timer);
    }
  }, [activeContactId, contact, setGlobalUsers]);
  
  if (!contact) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        {activeContactId ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-on-surface-variant font-bold tracking-widest uppercase text-xs">Fetching Identity...</p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
              <UserPlus className="w-10 h-10" />
            </div>
            <p className="text-on-surface-variant font-medium">User not found</p>
            <button onClick={onBack} className="px-6 py-3 bg-secondary text-white rounded-2xl font-bold">Go Back</button>
          </>
        )}
      </div>
    );
  }

  // Use displayName (from DB) falling back to name
  const displayName = contact.displayName || contact.name || 'User';
  const username = contact.username || displayName.toLowerCase().replace(/\s+/g, '_');
  const avatarUrl = contact.avatar;

  const userPosts = posts.filter(p => p.userId === contact.id);
  const isPrivate = contact.isPrivate && !isFollowing;

  const handleMessage = () => {
    startChatWithContact(contact.id);
    // Use a small timeout to let the context state update flush before navigating
    setTimeout(() => {
        onNavigate('chat-detail');
    }, 50);
  };


  const handleMute = () => {
    if (activeContactId) {
      muteChat(activeContactId);
    }
  };

  const handleBlock = () => {
    if (activeContactId) {
      blockContact(activeContactId);
    }
  };

  const handleReport = () => {
    if (activeContactId) {
      reportContact(activeContactId);
    }
  };

  const handleRequestSecretChat = () => {
    setRequestSent(true);
    addToast('Secret chat request sent to ' + contact.name, 'info');
    
    // Mock acceptance after 2 seconds
    setTimeout(() => {
      const existingChat = chats.find(c => c.id === contact.id);
      if (existingChat) {
        setChats(prev => prev.map(c => c.id === contact.id ? { ...c, isSecret: true, selfDestructTimer: 60 } : c));
      } else {
        setChats(prev => [...prev, {
          id: contact.id,
          name: contact.displayName || contact.name || 'User',
          avatar: contact.avatar,
          isSecret: true,
          selfDestructTimer: 60,
          lastMessage: 'Secret chat started',
          lastMessageTime: 'Just now'
        }]);
      }
      addToast(contact.name + ' accepted your secret chat request!', 'success');
      setRequestSent(false);
      startChatWithContact(contact.id);
      onNavigate('chat-detail');
    }, 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-surface min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 bg-slate-50/70 backdrop-blur-xl border-b border-white/15 shadow-[0_8px_32px_0_rgba(0,87,189,0.06)] h-16 flex items-center px-6">
        <button onClick={onBack} className="text-slate-500 hover:bg-white/20 p-2 rounded-full transition-colors active:scale-95 duration-200 mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-on-surface font-headline tracking-tight">Contact Info</h1>
      </header>

      <main className="pt-24 px-4 max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white text-4xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {contact.isPrivate && (
              <div className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md">
                <Lock className="w-4 h-4 text-on-surface-variant" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-extrabold font-headline text-on-surface">{displayName}</h2>
            <p className="text-on-surface-variant font-medium">@{username}</p>
            {contact.bio && <p className="text-sm text-on-surface-variant mt-1 max-w-xs">{contact.bio}</p>}
          </div>
          
          <div className="flex items-center gap-6 py-2">
            <div className="text-center">
              <span className="block font-black text-lg text-on-surface">{userPosts.length}</span>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Posts</span>
            </div>
            <div className="text-center">
              <span className="block font-black text-lg text-on-surface">{contact.followers?.length || 0}</span>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Followers</span>
            </div>
            <div className="text-center">
              <span className="block font-black text-lg text-on-surface">{contact.following?.length || 0}</span>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Following</span>
            </div>
          </div>

          {/* Action Buttons — Instagram-style */}
          <div className="flex gap-3 w-full max-w-sm pt-2">
            {isFollowing ? (
              <>
                <button 
                  onClick={handleMessage}
                  className="flex-1 py-3 rounded-2xl bg-secondary text-white font-bold shadow-lg shadow-secondary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Message
                </button>
                <button 
                  onClick={() => unfollowUser(contact.id)}
                  className="px-6 py-3 rounded-2xl bg-surface-container text-on-surface font-bold border border-white/40 active:scale-95 transition-all"
                >
                  Following
                </button>
              </>
            ) : isRequested ? (
              <button 
                className="flex-1 py-3 rounded-2xl bg-surface-container text-on-surface-variant font-bold border border-white/40 flex items-center justify-center gap-2"
              >
                <Clock className="w-5 h-5" />
                Requested
              </button>
            ) : (
              <>
                {/* Public accounts: can message without following */}
                {!contact.isPrivate && (
                  <button 
                    onClick={handleMessage}
                    className="flex-1 py-3 rounded-2xl bg-white/60 border border-white/40 text-on-surface font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Message
                  </button>
                )}
                <button 
                  onClick={() => followUser(contact.id)}
                  className="flex-1 py-3 rounded-2xl liquid-gradient text-white font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  {contact.isPrivate ? 'Request' : 'Follow'}
                </button>
              </>
            )}
          </div>
        </div>

        {isPrivate ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-8">
            <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
              <Lock className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-on-surface">This Account is Private</h3>
              <p className="text-on-surface-variant mt-1">Follow this account to see their posts and highlights.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Highlights Placeholder removed (as requested by user to remove mocks) */}

            {/* Tabs */}
            <div className="flex border-b border-surface-container">
              <button 
                onClick={() => setActiveTab('posts')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 transition-all relative ${activeTab === 'posts' ? 'text-primary' : 'text-on-surface-variant'}`}
              >
                <Grid className="w-5 h-5" />
                {activeTab === 'posts' && <motion.div layoutId="tab-underline" className="absolute bottom-0 w-1/2 h-0.5 bg-primary rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveTab('highlights')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 transition-all relative ${activeTab === 'highlights' ? 'text-primary' : 'text-on-surface-variant'}`}
              >
                <PlayCircle className="w-5 h-5" />
                {activeTab === 'highlights' && <motion.div layoutId="tab-underline" className="absolute bottom-0 w-1/2 h-0.5 bg-primary rounded-full" />}
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-1 pt-1">
              {userPosts.length > 0 ? userPosts.map(post => (
                <div key={post.id} className="aspect-square bg-surface-container overflow-hidden group cursor-pointer relative">
                  <img src={post.mediaUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  {post.mediaType === 'video' && (
                    <PlayCircle className="absolute top-2 right-2 w-4 h-4 text-white drop-shadow-md" />
                  )}
                </div>
              )) : (
                <div className="col-span-3 py-20 text-center text-on-surface-variant">
                  <p className="font-medium">No posts yet</p>
                </div>
              )}
            </div>
          </>
        )}

        <div className="glass-card rounded-[2rem] overflow-hidden border border-white/40 shadow-sm mt-8">
          <div className="p-5 border-b border-white/20">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">About</h3>
            <p className="text-on-surface">{contact.bio || 'Hey there! I am using Aqualyn.'}</p>
          </div>
          <div onClick={handleMute} className="p-5 border-b border-white/20 flex items-center justify-between hover:bg-white/40 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <Bell className="w-5 h-5 text-on-surface-variant" />
              <span className="font-semibold text-on-surface">Mute Notifications</span>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${chat?.isMuted ? 'bg-secondary' : 'bg-surface-container-highest'}`}>
              <motion.div 
                animate={{ x: chat?.isMuted ? 24 : 0 }}
                className="w-4 h-4 rounded-full bg-white shadow-sm"
              />
            </div>
          </div>
          <div className="p-5 border-b border-white/20 flex items-center justify-between hover:bg-white/40 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <Info className="w-5 h-5 text-on-surface-variant" />
              <span className="font-semibold text-on-surface">Media, Links, and Docs</span>
            </div>
            <span className="text-sm font-bold text-secondary">12</span>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] overflow-hidden border border-white/40 shadow-sm">
          <div onClick={handleBlock} className="p-5 border-b border-white/20 flex items-center gap-4 hover:bg-red-50/50 transition-colors cursor-pointer text-red-500">
            <Ban className="w-5 h-5" />
            <span className="font-semibold">{isBlocked ? 'Unblock' : 'Block'} {contact.name}</span>
          </div>
          <div onClick={handleReport} className="p-5 flex items-center gap-4 hover:bg-red-50/50 transition-colors cursor-pointer text-red-500">
            <Trash2 className="w-5 h-5" />
            <span className="font-semibold">Report Contact</span>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
