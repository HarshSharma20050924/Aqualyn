import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Pin, Users, CheckCheck, Mic, UserPlus, Lock, Pen, Bot, Globe, MoreVertical, Download, Moon, Sun, Trash2, CheckSquare, Archive, Volume2, VolumeX, Eye, EyeOff, FolderPlus, Eraser, ChevronRight, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import NewChatModal from '../components/chat/NewChatModal';
import NewFolderModal from '../components/modals/NewFolderModal';
import { ENDPOINTS } from '../config/api';
import { ChatPeekPreview } from '../components/chat/ChatPeekPreview';
import DeleteChatDialog from '../components/chat/DeleteChatDialog';

export default function ChatListScreen({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { currentUser, chats, setActiveChatId, messages, isLoading, folders, archiveChat, pinChat, muteChat, deleteChat, clearHistory, markAsRead, addChatToFolder, addToast, archiveLockPin, theme, setTheme, globalUsers, setGlobalUsers, followUser, startChatWithContact, setActiveContactId } = useAppContext();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const pressTimer = React.useRef<NodeJS.Timeout | null>(null);
  const [contextMenuChatId, setContextMenuChatId] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [showFolderSubmenu, setShowFolderSubmenu] = useState(false);
  const [isArchivePinModalOpen, setIsArchivePinModalOpen] = useState(false);
  const [archivePinValue, setArchivePinValue] = useState('');
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [peekChatId, setPeekChatId] = useState<string | null>(null);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const peekTimer = React.useRef<NodeJS.Timeout | null>(null);


  React.useEffect(() => {
    if (searchQuery && isSearching) {
      const timer = setTimeout(() => {
        fetch(ENDPOINTS.USER_SEARCH(searchQuery))
          .then(res => res.json())
          .then(data => {
            setGlobalSearchResults(data);
            // Merge into AppContext globalUsers so ContactProfileScreen can find them
            setGlobalUsers(prev => {
              const existingIds = new Set(prev.map(u => u.id));
              const newUsers = data.filter((u: any) => !existingIds.has(u.id));
              return [...prev, ...newUsers];
            });
          })
          .catch(e => console.error(e));
      }, 300); // debounce 300ms
      return () => clearTimeout(timer);
    } else {
      setGlobalSearchResults([]);
    }
  }, [searchQuery, isSearching]);

  const handleChatClick = (id: string) => {
    if (isSelectionMode) {
      toggleSelection(id);
      return;
    }
    setActiveChatId(id);
    onNavigate('chat-detail');
  };

  const handleOpenArchive = () => {
    if (archiveLockPin) {
      setIsArchivePinModalOpen(true);
    } else {
      setActiveTab('archived');
    }
  };

  const handleVerifyArchivePin = () => {
    if (archivePinValue === archiveLockPin) {
      setActiveTab('archived');
      setIsArchivePinModalOpen(false);
      setArchivePinValue('');
    } else {
      addToast('Incorrect PIN', 'error');
      setArchivePinValue('');
    }
  };

  const handleTouchStart = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    if (isSelectionMode) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    pressTimer.current = setTimeout(() => {
      setContextMenuChatId(id);
      setContextMenuPos({ x: clientX, y: clientY });
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const toggleSelection = (id: string) => {
    setSelectedChats(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) setIsSelectionMode(false);
      return next;
    });
  };

  const toggleTheme = () => {
    const newMode = theme.mode === 'dark' ? 'light' : 'dark';
    setTheme(prev => ({ ...prev, mode: newMode }));
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setShowHeaderMenu(false);
    addToast(`Switched to ${newMode === 'dark' ? 'Dark' : 'Light'} Mode`, 'success');
  };

  const handleExportChats = () => {
    addToast(`Exported ${selectedChats.size} chats as ZIP`, 'success');
    setIsSelectionMode(false);
    setSelectedChats(new Set());
    setShowHeaderMenu(false);
  };

  const handleDeleteChats = () => {
    selectedChats.forEach(id => deleteChat(id));
    setIsSelectionMode(false);
    setSelectedChats(new Set());
  };

  const handleContextAction = (action: () => void) => {
    action();
    setContextMenuChatId(null);
    setShowFolderSubmenu(false);
  };

  let filteredChats = chats;
  
  if (activeTab === 'unread') {
    filteredChats = chats.filter(c => c.unreadCount && c.unreadCount > 0);
  } else if (activeTab === 'groups') {
    filteredChats = chats.filter(c => c.isGroup);
  } else if (activeTab === 'personal') {
    filteredChats = chats.filter(c => !c.isGroup && !c.id.startsWith('bot'));
  } else if (activeTab === 'bots') {
    filteredChats = chats.filter(c => c.id.startsWith('bot'));
  } else if (activeTab === 'archived') {
    filteredChats = chats.filter(c => c.isArchived);
  } else {
    const folder = folders.find(f => f.name.toLowerCase() === activeTab);
    if (folder) {
      filteredChats = chats.filter(c => folder.chatIds.includes(c.id));
    }
  }

  // Filter out archived unless in archived view
  if (activeTab !== 'archived') {
    filteredChats = filteredChats.filter(c => !c.isArchived);
  }

  if (searchQuery) {
    filteredChats = filteredChats.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const pinnedChats = filteredChats.filter(c => c.isPinned);
  const recentChats = filteredChats.filter(c => !c.isPinned);

  const getLastMessage = (chatId: string) => {
    const chatMsgs = messages[chatId];
    if (chatMsgs && chatMsgs.length > 0) {
      return chatMsgs[chatMsgs.length - 1];
    }
    return null;
  };

  const SkeletonChat = () => (
    <div className="p-4 rounded-2xl flex items-center gap-4 animate-pulse">
      <div className="w-14 h-14 rounded-full bg-white/10 shrink-0"></div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex justify-between">
          <div className="h-4 bg-white/10 rounded-full w-1/3"></div>
          <div className="h-3 bg-white/10 rounded-full w-8"></div>
        </div>
        <div className="h-3 bg-white/10 rounded-full w-2/3"></div>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-surface pb-28">
      <header className="fixed top-0 w-full z-50 bg-slate-50/70 backdrop-blur-xl border-b border-white/15 shadow-[0_8px_32px_0_rgba(0,87,189,0.06)]">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-none">
          {isSelectionMode ? (
            <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => { setIsSelectionMode(false); setSelectedChats(new Set()); }} className="text-on-surface-variant hover:text-on-surface">
                  <span className="text-sm font-bold">Cancel</span>
                </button>
                <span className="font-headline font-bold text-lg">{selectedChats.size} Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleExportChats} className="p-2 rounded-full text-cyan-600 hover:bg-white/20 transition-colors">
                  <Download className="w-6 h-6" />
                </button>
                <button onClick={handleDeleteChats} className="p-2 rounded-full text-red-500 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
            </div>
          ) : isSearching ? (
            <div className="flex-1 flex items-center gap-2 bg-white/50 rounded-full px-4 py-2 border border-white/40">
              <Search className="w-5 h-5 text-on-surface-variant" />
              <input 
                autoFocus
                type="text" 
                placeholder="Global Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-on-surface"
              />
              <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="text-on-surface-variant hover:text-on-surface">
                <span className="text-sm font-bold">Cancel</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div onClick={() => onNavigate('profile')} className="w-10 h-10 rounded-full border-2 border-secondary-fixed flex items-center justify-center overflow-hidden active:scale-95 duration-200 cursor-pointer">
                  <img src={currentUser?.avatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-2xl font-black bg-gradient-to-br from-cyan-600 to-blue-500 bg-clip-text text-transparent font-headline tracking-tight">Aqualyn</h1>
              </div>
              <div className="flex items-center gap-2 relative">
                <button onClick={() => setIsSearching(true)} className="p-2 rounded-full text-cyan-600 hover:bg-white/20 transition-colors active:scale-95 duration-200">
                  <Search className="w-6 h-6" />
                </button>
                <button onClick={() => setShowHeaderMenu(!showHeaderMenu)} className="p-2 rounded-full text-cyan-600 hover:bg-white/20 transition-colors active:scale-95 duration-200">
                  <MoreVertical className="w-6 h-6" />
                </button>

                <AnimatePresence>
                  {showHeaderMenu && (
                    <>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={() => setShowHeaderMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-56 glass-card rounded-2xl p-2 shadow-xl border border-white/20 z-50 flex flex-col gap-1"
                      >
                        <button onClick={() => { setIsSelectionMode(true); setShowHeaderMenu(false); }} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-sm font-medium text-on-surface transition-colors">
                          <CheckSquare className="w-4 h-4" /> Select Chats
                        </button>
                        <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-sm font-medium text-on-surface transition-colors">
                          {theme.mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} 
                          {theme.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
        
        {/* Tabs */}
        {!isSearching && !isSelectionMode && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide items-center">
            {['all', ...folders.map(f => f.name.toLowerCase()), 'personal', 'groups', 'unread', 'bots'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center px-5 py-1.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all capitalize ${
                  activeTab === tab 
                    ? 'bg-secondary text-white shadow-md' 
                    : 'bg-white/40 text-on-surface-variant hover:bg-white/60 border border-white/20 shadow-sm'
                }`}
              >
                {tab}
                {(() => {
                  const count = chats.filter(c => {
                    if (tab === 'all') return c.unreadCount > 0;
                    if (tab === 'groups') return c.isGroup && c.unreadCount > 0;
                    if (tab === 'personal') return !c.isGroup && c.unreadCount > 0;
                    if (tab === 'unread') return c.unreadCount > 0;
                    return false;
                  }).length;
                  
                  if (count > 0) {
                    return (
                      <span className={`ml-2 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] rounded-full font-black ${
                        activeTab === tab ? 'bg-white text-secondary' : 'bg-secondary text-white'
                      }`}>
                        {count > 9 ? '9+' : count}
                      </span>
                    );
                  }
                  return null;
                })()}
              </button>
            ))}
            <button 
              onClick={() => setIsNewFolderModalOpen(true)}
              className="px-3 py-1.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all bg-white/40 text-on-surface-variant hover:bg-white/60 border border-white/20 flex items-center justify-center shrink-0"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <main className={`px-4 max-w-2xl mx-auto ${isSearching ? 'pt-20' : 'pt-32'}`}>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <SkeletonChat key={i} />)}
          </div>
        ) : (
          <>
            {filteredChats.length === 0 && !searchQuery && (
              <div className="text-center mt-20 opacity-60">
                <p className="text-on-surface-variant font-medium">
                  {activeTab === 'all' ? 'No chats yet.' : `No ${activeTab} chats.`}
                </p>
                {activeTab === 'all' && <p className="text-sm mt-2">Go to Contacts to start a conversation.</p>}
              </div>
            )}
            {searchQuery && (
              <div className="mb-6">
                <div className="flex items-center gap-2 px-2 mb-4 text-on-surface-variant">
                  <Globe className="w-4 h-4" />
                  <h2 className="font-headline font-bold text-sm tracking-tight uppercase">Global Search Results</h2>
                </div>
                
                {/* User Search Results */}
                <div className="space-y-3 mb-6">
                  {globalSearchResults
                    .filter(u => u.id !== currentUser?.id)
                    .map(user => {
                      const isFollowing = currentUser?.following?.includes(user.id);
                      const isRequested = user.followRequests?.includes(currentUser?.id || '');
                      
                      return (
                        <div 
                          key={user.id}
                          className="glass-card p-4 rounded-2xl flex items-center gap-4 border border-secondary-fixed/20 hover:bg-white/60 transition-all"
                        >
                          <div 
                            className="w-14 h-14 rounded-full overflow-hidden cursor-pointer"
                            onClick={() => {
                              setActiveContactId(user.id);
                              onNavigate('contact-profile');
                            }}
                          >
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <h3 className="font-headline font-bold text-on-surface truncate">{user.displayName || user.name || 'User'}</h3>
                              {user.isPrivate && <Lock className="w-3 h-3 text-on-surface-variant" />}
                            </div>
                            <p className="text-sm text-on-surface-variant truncate">@{user.username || 'user'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isFollowing ? (
                              <button 
                                onClick={() => {
                                  startChatWithContact(user.id);
                                  onNavigate('chat-detail');
                                }}
                                className="px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold hover:bg-secondary/20 transition-colors"
                              >
                                Message
                              </button>
                            ) : isRequested ? (
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
                    })}
                </div>

                {/* Bot & Group Mock Results */}
                <div className="glass-card p-4 rounded-2xl flex items-center gap-4 border border-secondary-fixed/20 cursor-pointer hover:bg-white/60 transition-all mb-2">
                  <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-headline font-bold text-on-surface truncate">@{searchQuery.toLowerCase()}bot</h3>
                    <p className="text-sm text-on-surface-variant truncate">Bot • 1.2M subscribers</p>
                  </div>
                </div>
                <div className="glass-card p-4 rounded-2xl flex items-center gap-4 border border-secondary-fixed/20 cursor-pointer hover:bg-white/60 transition-all">
                  <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center text-green-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-headline font-bold text-on-surface truncate">{searchQuery} Official Group</h3>
                    <p className="text-sm text-on-surface-variant truncate">Public Group • 45K members</p>
                  </div>
                </div>
              </div>
            )}

            {pinnedChats.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between px-2 mb-4">
                  <h2 className="font-headline font-bold text-lg tracking-tight text-on-surface">Pinned</h2>
                  <Pin className="text-secondary w-4 h-4 fill-secondary" />
                </div>
                <div className="space-y-3">
                  {pinnedChats.map(chat => {
                    const lastMsg = getLastMessage(chat.id);
                    return (
                      <div 
                        key={chat.id} 
                        onClick={() => handleChatClick(chat.id)} 
                        onMouseDown={(e) => handleTouchStart(e, chat.id)}
                        onMouseUp={handleTouchEnd}
                        onMouseLeave={handleTouchEnd}
                        onTouchStart={(e) => handleTouchStart(e, chat.id)}
                        onTouchEnd={handleTouchEnd}
                        className={`glass-card p-4 rounded-2xl flex items-center gap-4 border border-secondary-fixed/20 aqua-glow cursor-pointer hover:bg-white/60 transition-all ${selectedChats.has(chat.id) ? 'bg-secondary/20 border-secondary' : ''}`}
                      >
                        <div className="relative">
                          {chat.isGroup ? (
                            <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary overflow-hidden">
                              <Users className="w-8 h-8 fill-primary/20" />
                            </div>
                          ) : (
                            <>
                              <div 
                                className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const tid = chat.participantIds?.find(id => id !== currentUser?.id) || chat.id;
                                  setActiveContactId(tid);
                                  onNavigate('contact-profile');
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  peekTimer.current = setTimeout(() => {
                                    setPeekChatId(chat.id);
                                    if (window.navigator?.vibrate) window.navigator.vibrate(10);
                                  }, 400);
                                }}
                                onMouseUp={() => {
                                  if (peekTimer.current) clearTimeout(peekTimer.current);
                                }}
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                  peekTimer.current = setTimeout(() => {
                                    setPeekChatId(chat.id);
                                    if (window.navigator?.vibrate) window.navigator.vibrate(10);
                                  }, 400);
                                }}
                                onTouchEnd={() => {
                                  if (peekTimer.current) clearTimeout(peekTimer.current);
                                }}
                              >
                                <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary-fixed rounded-full border-2 border-white aqua-glow"></div>
                            </>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-headline font-bold text-on-surface truncate flex items-center gap-1">
                              {chat.isSecret && <Lock className="w-3 h-3 text-green-500" />}
                              {chat.name}
                            </h3>
                            <span className="text-[11px] font-medium text-secondary">{lastMsg?.timestamp || chat.lastMessageTime}</span>
                          </div>
                          <p className="text-sm text-on-surface-variant truncate font-medium">{lastMsg?.text || chat.lastMessage || 'No messages yet'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {chat.unreadCount ? (
                            <div className="liquid-gradient w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                              {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                            </div>
                          ) : lastMsg?.status === 'seen' ? (
                            <CheckCheck className="text-on-surface-variant w-4 h-4" />
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {recentChats.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-2 mb-4">
                  <h2 className="font-headline font-bold text-lg tracking-tight text-on-surface">Recent</h2>
                </div>
                <div className="space-y-2">
                  {recentChats.map(chat => {
                    const lastMsg = getLastMessage(chat.id);
                    return (
                      <div 
                        key={chat.id} 
                        onClick={() => handleChatClick(chat.id)} 
                        onMouseDown={(e) => handleTouchStart(e, chat.id)}
                        onMouseUp={handleTouchEnd}
                        onMouseLeave={handleTouchEnd}
                        onTouchStart={(e) => handleTouchStart(e, chat.id)}
                        onTouchEnd={handleTouchEnd}
                        className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/40 transition-all ${selectedChats.has(chat.id) ? 'bg-secondary/20 border-secondary' : ''}`}
                      >
                        {chat.isSystem ? (
                          <div className="w-14 h-14 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-dim">
                            <UserPlus className="w-6 h-6" />
                          </div>
                        ) : (
                          <div 
                            className={`w-14 h-14 rounded-full overflow-hidden ${chat.id === 'c3' ? 'grayscale opacity-80' : ''}`}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              peekTimer.current = setTimeout(() => {
                                setPeekChatId(chat.id);
                                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                              }, 400);
                            }}
                            onMouseUp={() => {
                              if (peekTimer.current) clearTimeout(peekTimer.current);
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              peekTimer.current = setTimeout(() => {
                                setPeekChatId(chat.id);
                                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                              }, 400);
                            }}
                            onTouchEnd={() => {
                              if (peekTimer.current) clearTimeout(peekTimer.current);
                            }}
                          >
                            <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className={`flex-1 min-w-0 ${chat.id === 'c4' ? 'border-b border-surface-container pb-2' : ''}`}>
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-headline font-semibold text-on-surface truncate flex items-center gap-1">
                              {chat.isSecret && <Lock className="w-3 h-3 text-green-500" />}
                              {chat.name}
                            </h3>
                            <span className="text-[11px] text-on-surface-variant">{lastMsg?.timestamp || chat.lastMessageTime}</span>
                          </div>
                          <p className="text-sm text-on-surface-variant truncate">{lastMsg?.text || chat.lastMessage || (chat.isVoice ? 'Sent a voice message' : 'No messages')}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {chat.unreadCount ? (
                            <div className="liquid-gradient w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                              {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                            </div>
                          ) : lastMsg?.status === 'seen' ? (
                            <CheckCheck className="text-secondary w-4 h-4" />
                          ) : (
                            <CheckCheck className="text-on-surface-variant/40 w-4 h-4" />
                          )}
                          {chat.isVoice && <Mic className="text-on-surface-variant w-4 h-4" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-12 flex flex-col items-center gap-2 opacity-50">
          <Lock className="text-on-surface-variant w-5 h-5" />
          <p className="text-[10px] font-medium text-center uppercase tracking-widest text-on-surface-variant">
            Messages are end-to-end encrypted.<br/>No one outside this chat can read them.
          </p>
        </div>
      </main>

      <button 
        onClick={() => setIsNewChatModalOpen(true)}
        className="fixed right-6 bottom-24 liquid-gradient w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center text-white aqua-glow active:scale-95 transition-all z-40"
      >
        <Pen className="w-6 h-6 fill-white" />
      </button>

      <NewChatModal 
        isOpen={isNewChatModalOpen} 
        onClose={() => setIsNewChatModalOpen(false)} 
        onNavigate={onNavigate}
      />

      <AnimatePresence>
        {isArchivePinModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsArchivePinModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm glass-card rounded-[2.5rem] p-8 shadow-2xl border border-white/40"
            >
              <h3 className="text-2xl font-black font-headline text-on-surface mb-2">Archive Locked</h3>
              <p className="text-on-surface-variant text-sm mb-6">Enter your PIN to access archived chats.</p>
              
              <input 
                type="password" 
                maxLength={4}
                autoFocus
                value={archivePinValue}
                onChange={(e) => setArchivePinValue(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full h-16 text-center text-3xl tracking-[1rem] font-bold rounded-2xl bg-white/50 border border-white/40 focus:ring-2 focus:ring-primary/20 outline-none mb-6"
              />
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsArchivePinModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-on-surface-variant hover:bg-white/40 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleVerifyArchivePin}
                  className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  Unlock
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contextMenuChatId && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-[100] bg-black/5" 
              onClick={() => { setContextMenuChatId(null); setShowFolderSubmenu(false); }} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              style={{ 
                left: Math.min(contextMenuPos.x, window.innerWidth - 220), 
                top: Math.min(contextMenuPos.y, window.innerHeight - 350) 
              }}
              className="fixed z-[101] w-52 glass-card rounded-2xl p-2 shadow-2xl border border-white/20 flex flex-col gap-1"
            >
              <button onClick={() => handleContextAction(() => {
                if (contextMenuChatId) {
                  const chat = chats.find(c => c.id === contextMenuChatId);
                  const isArchiving = !chat?.isArchived;
                  archiveChat(contextMenuChatId);
                  if (isArchiving) {
                    if (archiveLockPin) {
                      setIsArchivePinModalOpen(true);
                    } else {
                      setActiveTab('archived');
                    }
                  }
                }
              })} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-sm font-medium text-on-surface transition-colors">
                <Archive className="w-4 h-4" /> {chats.find(c => c.id === contextMenuChatId)?.isArchived ? 'Unarchive' : 'Archive'}
              </button>
              <button onClick={() => handleContextAction(() => pinChat(contextMenuChatId))} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-sm font-medium text-on-surface transition-colors">
                <Pin className="w-4 h-4" /> {chats.find(c => c.id === contextMenuChatId)?.isPinned ? 'Unpin' : 'Pin'}
              </button>
              <button onClick={() => handleContextAction(() => muteChat(contextMenuChatId))} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-sm font-medium text-on-surface transition-colors">
                {chats.find(c => c.id === contextMenuChatId)?.isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />} 
                {chats.find(c => c.id === contextMenuChatId)?.isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={() => handleContextAction(() => markAsRead(contextMenuChatId))} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-sm font-medium text-on-surface transition-colors">
                {chats.find(c => c.id === contextMenuChatId)?.unreadCount ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />} 
                {chats.find(c => c.id === contextMenuChatId)?.unreadCount ? 'Mark as read' : 'Mark as unread'}
              </button>

              
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowFolderSubmenu(!showFolderSubmenu); }} 
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-sm font-medium text-on-surface transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FolderPlus className="w-4 h-4" /> Add to folder
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showFolderSubmenu ? 'rotate-90' : ''}`} />
                </button>
                
                {showFolderSubmenu && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute left-full top-0 ml-2 w-40 glass-card rounded-xl p-1 shadow-xl border border-white/20 flex flex-col gap-1"
                  >
                    {folders.map(f => (
                      <button 
                        key={f.id}
                        onClick={() => handleContextAction(() => {
                          if (contextMenuChatId) {
                            addChatToFolder(contextMenuChatId, f.id);
                          }
                        })}
                        className="px-3 py-2 hover:bg-white/10 rounded-lg text-xs font-medium text-on-surface text-left"
                      >
                        {f.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <button onClick={() => handleContextAction(() => clearHistory(contextMenuChatId))} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-sm font-medium text-on-surface transition-colors">
                <Eraser className="w-4 h-4" /> Clear history
              </button>
              <button onClick={() => {
                setChatToDelete(contextMenuChatId);
                setShowFolderSubmenu(false);
                setContextMenuChatId(null);
              }} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-sm font-medium text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" /> Delete chat
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <NewFolderModal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
      />

      <AnimatePresence>
        {peekChatId && (
          <ChatPeekPreview 
            chat={chats.find(c => c.id === peekChatId)!}
            messages={messages[peekChatId] || []}
            currentUser={currentUser}
            onClose={() => setPeekChatId(null)}
            onOpenChat={() => {
              setActiveChatId(peekChatId);
              setPeekChatId(null);
              onNavigate('chat-detail');
            }}
            onArchive={() => archiveChat(peekChatId)}
            onPin={() => pinChat(peekChatId)}
            onMute={() => muteChat(peekChatId)}
            onDelete={() => {
              setChatToDelete(peekChatId);
              setPeekChatId(null);
            }}
          />
        )}
      </AnimatePresence>

      <DeleteChatDialog 
        isOpen={!!chatToDelete}
        chatName={chats.find(c => c.id === chatToDelete)?.name || 'this user'}
        onConfirm={(forEveryone) => {
          if (chatToDelete) {
            deleteChat(chatToDelete, forEveryone ? 'everyone' : 'me');
            setChatToDelete(null);
          }
        }}
        onCancel={() => setChatToDelete(null)}
      />

    </motion.div>
  );
}
