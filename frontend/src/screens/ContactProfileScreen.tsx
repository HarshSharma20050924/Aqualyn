import BubbleLoader from '../components/ui/BubbleLoader';
import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, MessageCircle, Phone, Video, Info, Bell, Ban, Trash2, Lock, ShieldCheck, UserPlus, UserCheck, Clock, Grid, PlayCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useCall } from '../context/CallContext';
import { auth } from '../config/firebase';
import { ENDPOINTS } from '../config/api';
import { apiFetch } from '../utils/fetcher';
import { User } from '../types';
import UserListModal from '../components/social/UserListModal';

export default function ContactProfileScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate: (s: string) => void }) {
  const { contacts, activeContactId, setActiveContactId, startChatWithContact, addToast, chats, setChats, currentUser, blockContact, reportContact, muteChat, followUser, unfollowUser, posts, globalUsers, setGlobalUsers, requestSecretChat, createGroupChat } = useAppContext();
  const { startCall } = useCall();
  const [requestSent, setRequestSent] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'posts' | 'highlights'>('posts');
  const [userPostsData, setUserPostsData] = React.useState<any[]>([]);
  const [userStoriesData, setUserStoriesData] = React.useState<any[]>([]);
  const [isLoadingContent, setIsLoadingContent] = React.useState(false);
  
  // Look in globalUsers first, then contacts, and finally currentUser (for self-profile view)
  const contact = globalUsers.find(c => c.id === activeContactId) || 
                  contacts.find(c => c.id === activeContactId) ||
                  (currentUser?.id === activeContactId ? currentUser : null);

  const chat = chats.find(c => c.id === activeContactId || c.participantIds?.includes(activeContactId || ''));
  const isBlocked = currentUser?.blockedUsers?.includes(activeContactId || '');
  
  // Follow/request state
  const isFollowing = currentUser?.following?.includes(activeContactId || '');
  const isRequested = contact?.receivedFollowReqs?.some((r: any) => r.senderId === currentUser?.id);

  const [mediaCount, setMediaCount] = React.useState({ total: 0 });
  const [showList, setShowList] = React.useState<'followers' | 'following' | null>(null);
  const [listData, setListData] = React.useState<User[]>([]);
  const [isListLoading, setIsListLoading] = React.useState(false);

  React.useEffect(() => {
    if (!activeContactId) return;
    const fetchContent = async () => {
      setIsLoadingContent(true);
      try {
        const [postsRes, storiesRes] = await Promise.all([
          apiFetch(ENDPOINTS.USER_POSTS(activeContactId)),
          apiFetch(ENDPOINTS.USER_STORIES(activeContactId))
        ]);
        if (postsRes.ok) setUserPostsData(await postsRes.json());
        if (storiesRes.ok) setUserStoriesData(await storiesRes.json());
      } catch (e) {
        console.error('Failed to fetch user content', e);
      } finally {
        setIsLoadingContent(false);
      }
    };
    fetchContent();
  }, [activeContactId]);

  const fetchSocialList = async (type: 'followers' | 'following') => {
    if (!activeContactId) return;
    setShowList(type);
    setIsListLoading(true);
    try {
      const endpoint = type === 'followers' ? ENDPOINTS.GET_FOLLOWERS(activeContactId) : ENDPOINTS.GET_FOLLOWING(activeContactId);
      const res = await apiFetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setListData(data);
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to load list', 'error');
    } finally {
      setIsListLoading(false);
    }
  };

  // Fetch user if missing and media count
  React.useEffect(() => {
    if (activeContactId) {
      const fetchData = async () => {
        try {
          const res = await apiFetch(ENDPOINTS.USER_PROFILE(activeContactId));
          if (res.ok) {
            const data = await res.json();
            setGlobalUsers(prev => {
              const exists = prev.find(u => u.id === data.id);
              if (exists) {
                return prev.map(u => u.id === data.id ? { ...u, ...data } : u);
              }
              return [...prev, data];
            });
          }

          // Fetch media count
          if (chat) {
            const mediaRes = await apiFetch(ENDPOINTS.CHAT_MEDIA(chat.id));
            if (mediaRes.ok) {
              const mediaData = await mediaRes.json();
              setMediaCount(mediaData);
            }
          }
        } catch (e) {
          console.error("[ContactProfile] Data fetch error:", e);
        }
      };
      
      fetchData();
    }
  }, [activeContactId, chat?.id, contact, setGlobalUsers]);
  
  if (!contact) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        {activeContactId ? (
          <div className="flex flex-col items-center gap-4">
            <BubbleLoader width={24} height={24} />
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
    if (contact?.id) {
      requestSecretChat(contact.id);
      setTimeout(() => {
        onNavigate('chat-detail');
      }, 50);
    }
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
            <div className="text-center cursor-pointer">
              <span className="block font-black text-lg text-on-surface">{userPostsData.length}</span>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Posts</span>
            </div>
            <div className="text-center cursor-pointer" onClick={() => fetchSocialList('followers')}>
              <span className="block font-black text-lg text-on-surface">{contact._count?.followers ?? contact.followers?.length ?? 0}</span>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Followers</span>
            </div>
            <div className="text-center cursor-pointer" onClick={() => fetchSocialList('following')}>
              <span className="block font-black text-lg text-on-surface">{contact._count?.following ?? contact.following?.length ?? 0}</span>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Following</span>
            </div>
          </div>

          {/* Action Buttons — Instagram-style */}
          <div className="flex gap-2 w-full max-w-sm pt-2">
            <button 
              onClick={() => startCall(contact.id, displayName, contact.avatar, 'VOICE')}
              className="flex-1 py-3 rounded-2xl bg-surface-container text-on-surface font-bold border border-white/40 active:scale-95 transition-all flex items-center justify-center"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button 
              onClick={() => startCall(contact.id, displayName, contact.avatar, 'VIDEO')}
              className="flex-1 py-3 rounded-2xl bg-surface-container text-on-surface font-bold border border-white/40 active:scale-95 transition-all flex items-center justify-center"
            >
              <Video className="w-5 h-5 text-secondary" />
            </button>
          </div>

          <div className="flex gap-3 w-full max-w-sm">
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
                  className="flex-1 py-3 rounded-2xl bg-surface-container text-on-surface font-bold border border-white/40 active:scale-95 transition-all"
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

            {/* Grid & Highlights */}
            <div className="mt-4">
              {isLoadingContent ? (
                <div className="text-center text-on-surface-variant py-10">Loading...</div>
              ) : activeTab === 'posts' ? (
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {userPostsData.length > 0 ? userPostsData.map((post: any, i) => (
                    <div key={post.id || i} className="aspect-square bg-surface-container overflow-hidden group cursor-pointer relative">
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
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x pt-4 px-2">
                  {userStoriesData.length > 0 ? userStoriesData.map((story: any, i) => (
                    <div key={story.id || i} className="flex flex-col items-center gap-2 snap-center shrink-0 cursor-pointer group">
                      <div className="w-16 h-16 rounded-full p-[2px] bg-primary/20 group-hover:bg-primary transition-colors">
                        <div className="w-full h-full rounded-full border-2 border-surface overflow-hidden relative">
                          <img 
                            src={story.mediaUrl}
                            alt="Highlight"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                        </div>
                      </div>
                      <span className="text-xs text-on-surface-variant font-medium">{new Date(story.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  )) : (
                    <div className="text-center py-20 text-on-surface-variant w-full">
                      <p className="font-medium">No highlights yet</p>
                    </div>
                  )}
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
          
          <div onClick={() => {
            if (contact) {
              createGroupChat(`${currentUser?.displayName || 'My'} & ${contact.displayName || contact.name || 'Friend'} Group`, [contact.id]);
            }
          }} className="p-5 border-b border-white/20 flex items-center justify-between hover:bg-white/40 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <UserCheck className="w-5 h-5 text-cyan-600" />
              <span className="font-semibold text-on-surface">Start Group Chat</span>
            </div>
          </div>

          <div onClick={handleRequestSecretChat} className="p-5 border-b border-white/20 flex items-center justify-between hover:bg-white/40 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <Lock className="w-5 h-5 text-secondary animate-pulse" />
              <span className="font-semibold text-secondary">Start Secret Chat (Incognito)</span>
            </div>
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
            <span className="text-sm font-bold text-secondary">{mediaCount.total}</span>
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

      <UserListModal 
        isOpen={!!showList}
        onClose={() => setShowList(null)}
        title={showList || ''}
        users={listData}
        isLoading={isListLoading}
        onUserClick={(u) => {
            if (u.id === currentUser?.id) {
                onNavigate('profile');
            } else {
                setActiveContactId(u.id);
                // The useEffect will handle fetching the new contact's data
            }
        }}
      />
    </motion.div>
  );
}
