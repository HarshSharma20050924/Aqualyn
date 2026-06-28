import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Search, ArrowLeft, TrendingUp, Radio, Users, Play, Droplet, Check, Compass, Lock, Hash, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { apiFetch } from '../utils/fetcher';
import { ENDPOINTS } from '../config/api';
import PostViewer from '../components/posts/PostViewer';

const CATEGORIES = ['All', 'Creative', 'Tech', 'Lifestyle', 'Design', 'Health'];

const CATEGORY_COLORS: Record<string, string> = {
  Creative: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  Tech: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  Lifestyle: 'text-green-500 bg-green-500/10 border-green-500/20',
  Design: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  Health: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
};

const SkeletonChannel = () => (
  <div className="glass-card rounded-2xl p-4 border border-white/10 flex items-center gap-4 animate-pulse">
    <div className="w-12 h-12 rounded-2xl bg-surface-container shrink-0" />
    <div className="flex-1 min-w-0 space-y-2">
      <div className="h-4 bg-surface-container rounded-full w-1/2" />
      <div className="h-3 bg-surface-container rounded-full w-3/4" />
      <div className="h-3 bg-surface-container rounded-full w-1/4" />
    </div>
    <div className="w-16 h-8 rounded-xl bg-surface-container shrink-0" />
  </div>
);

const SkeletonUser = () => (
  <div className="glass-card rounded-2xl p-4 border border-white/10 flex items-center gap-4 animate-pulse">
    <div className="w-12 h-12 rounded-full bg-surface-container shrink-0" />
    <div className="flex-1 min-w-0 space-y-2">
      <div className="h-4 bg-surface-container rounded-full w-1/3" />
      <div className="h-3 bg-surface-container rounded-full w-1/2" />
    </div>
    <div className="w-20 h-7 rounded-full bg-surface-container shrink-0" />
  </div>
);

const SkeletonPost = () => (
  <div className="aspect-square bg-surface-container animate-pulse" />
);

export default function ExploreScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (s: string) => void }) {
  const { posts, currentUser, addToast, fetchInitialData, setActiveChatId, setActiveContactId, setGlobalUsers, followUser } = useAppContext();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'posts' | 'channels' | 'people'>('posts');

  // Channels state
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [requestedChannels, setRequestedChannels] = useState<Set<string>>(new Set());
  const [joiningChannelId, setJoiningChannelId] = useState<string | null>(null);

  // People state — live search
  const [peopleResults, setPeopleResults] = useState<any[]>([]);
  const [isSearchingPeople, setIsSearchingPeople] = useState(false);
  const [hasSearchedPeople, setHasSearchedPeople] = useState(false);

  // PostViewer state
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  // Search history
  const HISTORY_KEY = 'exploreSearchHistory';
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  });
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const saveToHistory = (q: string) => {
    if (!q.trim() || q === 'AI_RECOMMENDED_PEOPLE') return;
    setSearchHistory(prev => {
      const updated = [q, ...prev.filter(h => h !== q)].slice(0, 10);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromHistory = (q: string) => {
    setSearchHistory(prev => {
      const updated = prev.filter(h => h !== q);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  // On mount: check for AI redirect query
  useEffect(() => {
    const initialQuery = window.localStorage.getItem('exploreQuery');
    if (initialQuery) {
      setQuery(initialQuery);
      if (initialQuery === 'AI_RECOMMENDED_PEOPLE') {
        setActiveTab('people');
      } else {
        setActiveTab('channels');
      }
      window.localStorage.removeItem('exploreQuery');
    }
  }, []);

  // Fetch channels when tab is active
  useEffect(() => {
    if (activeTab === 'channels') {
      setIsLoadingChannels(true);
      apiFetch(`${ENDPOINTS.CHANNELS}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => { if (Array.isArray(data)) setChannels(data); })
        .catch(console.error)
        .finally(() => setIsLoadingChannels(false));
    }
  }, [activeTab]);

  // Live search for People tab
  const searchPeople = useCallback((q: string) => {
    if (!q.trim()) {
      setPeopleResults([]);
      setHasSearchedPeople(false);
      return;
    }
    setIsSearchingPeople(true);
    setHasSearchedPeople(true);
    apiFetch(ENDPOINTS.USER_SEARCH(q))
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          const sorted = data
            .filter((u: any) => u.id !== currentUser?.id)
            .sort((a: any, b: any) => {
              const q2 = q.toLowerCase().trim();
              const aExact = (a.id.toLowerCase() === q2 || a.username?.toLowerCase() === q2) ? 1 : 0;
              const bExact = (b.id.toLowerCase() === q2 || b.username?.toLowerCase() === q2) ? 1 : 0;
              return bExact - aExact;
            });
          setPeopleResults(sorted);
          // Merge into globalUsers
          setGlobalUsers((prev: any[]) => {
            const existingIds = new Set(prev.map((u: any) => u.id));
            const additions = sorted.filter((u: any) => !existingIds.has(u.id));
            return additions.length > 0 ? [...prev, ...additions] : prev;
          });
        }
      })
      .catch(console.error)
      .finally(() => setIsSearchingPeople(false));
  }, [currentUser?.id, setGlobalUsers]);

  // Debounced search trigger for People tab + save history on commit
  useEffect(() => {
    if (activeTab !== 'people') return;
    const timer = setTimeout(() => {
      searchPeople(query);
      if (query.trim()) saveToHistory(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query, activeTab, searchPeople]);

  // Posts filter
  const publicPosts = [...posts]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter(p => {
      if (!query.trim()) return true;
      return (p.caption || '').toLowerCase().includes(query.toLowerCase())
        || (p.userName || '').toLowerCase().includes(query.toLowerCase());
    });

  // Channel filter
  const filteredChannels = channels.filter(c => {
    const matchCategory = activeCategory === 'All' || c.category === activeCategory;
    const matchQuery = !query.trim()
      || c.name.toLowerCase().includes(query.toLowerCase())
      || (c.description || '').toLowerCase().includes(query.toLowerCase());
    return matchCategory && matchQuery;
  });

  const handleJoinChannel = async (channel: any) => {
    if (channel.type === 'PRIVATE') {
      setRequestedChannels(prev => new Set(prev).add(channel.id));
      addToast('Request sent! Waiting for approval.', 'success');
      return;
    }
    setJoiningChannelId(channel.id);
    try {
      const res = await apiFetch(`${ENDPOINTS.CHANNELS}/${channel.id}/join`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to join');
      addToast(`Joined ${channel.name}!`, 'success');
      setChannels(prev => prev.map(c => c.id === channel.id ? { ...c, isJoined: true } : c));
      await fetchInitialData();
      setActiveChatId(channel.id);
      onNavigate('chat-detail');
    } catch {
      addToast('Failed to join channel', 'error');
    } finally {
      setJoiningChannelId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="min-h-screen bg-surface pb-28 flex flex-col"
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-surface-container">
        <div className="flex items-center gap-3 px-4 h-16 max-w-2xl mx-auto">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors active:scale-90">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setTimeout(() => setIsInputFocused(false), 150)}
              onKeyDown={e => { if (e.key === 'Enter' && query.trim()) saveToHistory(query.trim()); }}
              placeholder={activeTab === 'people' ? 'Search by name, username, or ID...' : 'Search posts, channels...'}
              className="w-full h-10 pl-9 pr-9 rounded-full bg-surface-container border border-outline-variant/20 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Search history dropdown */}
            {isInputFocused && !query.trim() && searchHistory.length > 0 && (
              <div className="absolute top-12 left-0 right-0 z-50 glass-card rounded-2xl border border-white/20 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-surface-container">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Recent Searches</span>
                  <button
                    onClick={clearHistory}
                    className="text-[10px] font-bold text-secondary hover:text-secondary/70 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                {searchHistory.map(h => (
                  <div
                    key={h}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container/50 transition-colors cursor-pointer group"
                  >
                    <Search className="w-3.5 h-3.5 text-on-surface-variant/50 shrink-0" />
                    <span
                      className="flex-1 text-sm text-on-surface truncate"
                      onClick={() => { setQuery(h); inputRef.current?.blur(); }}
                    >
                      {h}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFromHistory(h); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-on-surface"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative w-7 h-7 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-fixed to-primary-container rounded-lg rotate-12 opacity-30" />
            <div className="relative w-full h-full glass-card rounded-lg flex items-center justify-center">
              <Compass className="w-4 h-4 text-secondary" />
            </div>
          </div>
        </div>

        {/* Tab row */}
        <div className="flex border-b border-surface-container max-w-2xl mx-auto px-4">
          {(['posts', 'channels', 'people'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-bold capitalize transition-all flex items-center justify-center gap-2 border-b-2 ${
                activeTab === tab
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab === 'posts' ? <TrendingUp className="w-4 h-4" /> : tab === 'channels' ? <Radio className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              {tab === 'posts' ? 'Trending' : tab === 'channels' ? 'Channels' : 'People'}
            </button>
          ))}
        </div>
      </header>

      <main className="pt-[7.5rem] max-w-2xl mx-auto w-full px-4">

        {/* ── Posts tab ───────────────────────────────────────────────────── */}
        {activeTab === 'posts' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {publicPosts.length === 0 ? (
              <div className="text-center mt-20">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary-fixed to-primary-container rounded-2xl rotate-12 opacity-20" />
                  <div className="relative w-full h-full glass-card rounded-2xl flex items-center justify-center">
                    <Compass className="w-8 h-8 text-on-surface-variant" />
                  </div>
                </div>
                <p className="text-on-surface-variant font-medium">Nothing to explore yet.</p>
                <p className="text-sm text-on-surface-variant/60 mt-1">Public posts will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 mt-2">
                {publicPosts.map(post => (
                  <div key={post.id} onClick={() => setSelectedPost(post)} className="relative aspect-square bg-surface-container overflow-hidden group cursor-pointer">
                    {post.mediaType === 'video' || post.videoUrl ? (
                      <video src={post.mediaUrl || post.videoUrl} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img
                        src={post.mediaUrl || post.imageUrl || `https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=300&h=300&sig=${post.id}`}
                        alt="Post"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    {(post.mediaType === 'video' || post.videoUrl) && (
                      <div className="absolute top-2 right-2">
                        <Play className="w-4 h-4 text-white fill-white drop-shadow" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                        {post.userAvatar
                          ? <img src={post.userAvatar} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-secondary flex items-center justify-center text-white text-xs font-bold">{(post.userName || 'U')[0]}</div>}
                      </div>
                      <span className="text-white text-xs font-bold">{post.userName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Channels tab ─────────────────────────────────────────────────── */}
        {activeTab === 'channels' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-4">
            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                    activeCategory === cat
                      ? 'liquid-gradient text-white border-transparent aqua-glow shadow-sm'
                      : 'bg-surface-container border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Channels list */}
            <div className="space-y-3">
              {isLoadingChannels ? (
                [1,2,3,4].map(i => <SkeletonChannel key={i} />)
              ) : filteredChannels.length === 0 ? (
                <div className="text-center py-16 glass-card rounded-2xl border border-white/20 flex flex-col items-center gap-3">
                  <Radio className="w-10 h-10 text-on-surface-variant/30" />
                  <p className="text-on-surface-variant font-medium text-sm">No channels found.</p>
                  <p className="text-[11px] text-on-surface-variant/60">Try a different category or search term.</p>
                </div>
              ) : (
                filteredChannels.map(channel => (
                  <motion.div
                    key={channel.id}
                    whileHover={{ y: -1 }}
                    className="glass-card rounded-2xl p-4 border border-white/30 dark:border-white/5 shadow-sm flex items-center gap-4 cursor-pointer hover:border-secondary/30 transition-all"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20">
                      <Hash className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-headline font-bold text-sm text-on-surface truncate">{channel.name}</h3>
                        {channel.isLive && (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Live
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-on-surface-variant truncate">{channel.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[channel.category] || 'text-on-surface-variant bg-surface-container border-outline-variant/20'}`}>
                          {channel.category}
                        </span>
                        <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                          <Users className="w-3 h-3" /> {channel.memberCount?.toLocaleString?.() ?? 0}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => { if (!channel.isJoined) handleJoinChannel(channel); }}
                      disabled={channel.isJoined || joiningChannelId === channel.id || requestedChannels.has(channel.id)}
                      className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 min-w-[70px] ${
                        channel.isJoined
                          ? 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30'
                          : 'liquid-gradient text-white aqua-glow active:scale-95 disabled:opacity-70'
                      }`}
                    >
                      {channel.isJoined ? (
                        <><Check className="w-3 h-3" /> Joined</>
                      ) : joiningChannelId === channel.id ? (
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : requestedChannels.has(channel.id) ? (
                        <>Requested</>
                      ) : (
                        <>Join</>
                      )}
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Lyn suggestion card */}
            <div className="glass-card rounded-2xl p-4 border border-secondary/20 shadow-sm bg-secondary/5 mt-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative w-8 h-8 shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary-fixed to-primary-container rounded-xl rotate-12 opacity-30" />
                  <div className="relative w-full h-full glass-card rounded-xl flex items-center justify-center inner-glow">
                    <Droplet className="w-4 h-4 text-secondary fill-secondary" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-black text-secondary uppercase tracking-wider">Lyn Recommends</p>
                  <p className="text-[10px] text-on-surface-variant">Based on your conversations</p>
                </div>
              </div>
              {currentUser?.settings?.privacy?.aiDiscoverable ? (
                <>
                  <p className="text-xs text-on-surface leading-relaxed mb-3">
                    Lyn AI is analyzing your interests to find the best channels for you.
                  </p>
                  <button
                    onClick={() => setQuery('AI_RECOMMENDED')}
                    className="px-3 py-1.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold transition-all hover:bg-secondary/20 active:scale-95"
                  >
                    Show AI Recommendations
                  </button>
                </>
              ) : (
                <p className="text-xs text-on-surface leading-relaxed">
                  Enable <span className="font-bold text-secondary">AI Discoverability</span> in your Privacy settings so Lyn can connect you with channels aligned to your interests.
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── People tab ──────────────────────────────────────────────────── */}
        {activeTab === 'people' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-4">

            {/* Empty / hint state when no query typed */}
            {!query.trim() && !hasSearchedPeople && (
              <div className="text-center py-16 flex flex-col items-center gap-4">
                <div className="w-16 h-16 mx-auto relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary-fixed to-primary-container rounded-2xl rotate-12 opacity-20" />
                  <div className="relative w-full h-full glass-card rounded-2xl flex items-center justify-center">
                    <Users className="w-8 h-8 text-on-surface-variant" />
                  </div>
                </div>
                <div>
                  <p className="text-on-surface-variant font-semibold text-sm">Find anyone on Aqualyn</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">Search by name, @username, or user ID</p>
                </div>
              </div>
            )}

            {/* Skeleton while searching */}
            {isSearchingPeople && (
              <div className="grid gap-3">
                {[1, 2, 3, 4].map(i => <SkeletonUser key={i} />)}
              </div>
            )}

            {/* Skeleton while searching first time */}
            {!isSearchingPeople && hasSearchedPeople && peopleResults.length === 0 && query.trim() && (
              <div className="text-center py-12 glass-card rounded-2xl border border-white/20">
                <p className="text-on-surface-variant font-medium text-sm">No people found for "{query}".</p>
                <p className="text-[11px] text-on-surface-variant/60 mt-1">Try a different name, username, or ID.</p>
              </div>
            )}

            {/* Results */}
            {!isSearchingPeople && peopleResults.length > 0 && (
              <div className="grid gap-3">
                {peopleResults.map(user => {
                  const isFollowing = currentUser?.following?.includes(user.id);
                  const hasSentReq = user.followRequests?.includes(currentUser?.id || '') || user.receivedFollowReqs?.some?.((r: any) => r.senderId === currentUser?.id);
                  return (
                    <div key={user.id} className="glass-card rounded-2xl p-4 border border-white/10 flex items-center gap-4 transition-all hover:bg-surface-container/50">
                      <div
                        className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-surface-container cursor-pointer"
                        onClick={() => { setActiveContactId(user.id); onNavigate('contact-profile'); }}
                      >
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-lg">
                            {(user.displayName || user.name || 'U')[0]}
                          </div>
                        )}
                      </div>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => { setActiveContactId(user.id); onNavigate('contact-profile'); }}
                      >
                        <div className="flex items-center gap-1">
                          <h4 className="font-headline font-bold text-sm text-on-surface truncate">{user.displayName || user.name || 'User'}</h4>
                          {user.isPrivate && <Lock className="w-3 h-3 text-on-surface-variant shrink-0" />}
                        </div>
                        <p className="text-[11px] text-on-surface-variant truncate">@{user.username}</p>
                        {user.bio && <p className="text-[11px] text-on-surface-variant/70 mt-0.5 truncate">{user.bio}</p>}
                      </div>
                      {isFollowing ? (
                        <button
                          onClick={() => { setActiveChatId(user.id); onNavigate('chat-detail'); }}
                          className="px-4 py-1.5 rounded-full bg-secondary/10 text-secondary font-bold text-[11px] transition-all hover:bg-secondary/20 shrink-0"
                        >
                          Message
                        </button>
                      ) : hasSentReq ? (
                        <button className="px-4 py-1.5 rounded-full bg-surface-container text-on-surface-variant font-bold text-[11px] shrink-0 cursor-default">
                          Requested
                        </button>
                      ) : (
                        <button
                          onClick={() => followUser(user.id)}
                          className="px-4 py-1.5 rounded-full liquid-gradient text-white font-bold text-[11px] active:scale-95 transition-all shadow-sm aqua-glow shrink-0"
                        >
                          Follow
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Lyn AI banner */}
            <div className="glass-card rounded-2xl p-4 border border-secondary/20 shadow-sm bg-secondary/5 mt-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative w-8 h-8 shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary-fixed to-primary-container rounded-xl rotate-12 opacity-30" />
                  <div className="relative w-full h-full glass-card rounded-xl flex items-center justify-center inner-glow">
                    <Droplet className="w-4 h-4 text-secondary fill-secondary" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-black text-secondary uppercase tracking-wider">Lyn AI Match</p>
                  <p className="text-[10px] text-on-surface-variant">Find people like you</p>
                </div>
              </div>
              <p className="text-xs text-on-surface leading-relaxed">
                Lyn can analyze your interests to suggest the best people for you to connect with.
              </p>
              {!currentUser?.settings?.privacy?.aiDiscoverable && (
                <p className="text-[10px] text-secondary font-medium mt-2">
                  Enable AI Discoverability in Privacy settings to show up in Lyn recommendations.
                </p>
              )}
            </div>
          </motion.div>
        )}

      </main>
    </motion.div>
  );
}
