import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  ArrowLeft,
  TrendingUp,
  Radio,
  Users,
  Play,
  Droplet,
  Check,
  Compass,
  Lock,
  Hash,
  X
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../context/AppContext';
import { apiFetch } from '../utils/fetcher';
import { ENDPOINTS } from '../config/api';
import BubbleLoader from '../components/ui/BubbleLoader';

const { width: W } = Dimensions.get('window');

const CATEGORIES = ['All', 'Creative', 'Tech', 'Lifestyle', 'Design', 'Health'];

const CATEGORY_COLORS: Record<string, string> = {
  Creative: '#a855f7',
  Tech: '#3b82f6',
  Lifestyle: '#22c55e',
  Design: '#f59e0b',
  Health: '#14b8a6',
};

export default function ExploreScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (s: string) => void }) {
  const insets = useSafeAreaInsets();
  const { posts, currentUser, addToast, fetchInitialData, setActiveChatId, setActiveContactId, setGlobalUsers, followUser, startChatWithContact } = useAppContext();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'posts' | 'channels' | 'people'>('posts');

  const [channels, setChannels] = useState<any[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [requestedChannels, setRequestedChannels] = useState<Set<string>>(new Set());
  const [joiningChannelId, setJoiningChannelId] = useState<string | null>(null);

  const [peopleResults, setPeopleResults] = useState<any[]>([]);
  const [isSearchingPeople, setIsSearchingPeople] = useState(false);
  const [hasSearchedPeople, setHasSearchedPeople] = useState(false);

  const HISTORY_KEY = 'exploreSearchHistory';
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then(val => {
      if (val) {
        try { setSearchHistory(JSON.parse(val)); } catch (e) {}
      }
    });
  }, []);

  const saveToHistory = async (q: string) => {
    if (!q.trim() || q === 'AI_RECOMMENDED_PEOPLE') return;
    setSearchHistory(prev => {
      const updated = [q, ...prev.filter(h => h !== q)].slice(0, 10);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromHistory = async (q: string) => {
    setSearchHistory(prev => {
      const updated = prev.filter(h => h !== q);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = async () => {
    setSearchHistory([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
  };

  useEffect(() => {
    AsyncStorage.getItem('exploreQuery').then(initialQuery => {
      if (initialQuery) {
        setQuery(initialQuery);
        if (initialQuery === 'AI_RECOMMENDED_PEOPLE') {
          setActiveTab('people');
        } else {
          setActiveTab('channels');
        }
        AsyncStorage.removeItem('exploreQuery');
      }
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'channels') {
      setIsLoadingChannels(true);
      apiFetch(ENDPOINTS.CHANNELS)
        .then(res => res.ok ? res.json() : [])
        .then(data => { if (Array.isArray(data)) setChannels(data); })
        .catch(console.error)
        .finally(() => setIsLoadingChannels(false));
    }
  }, [activeTab]);

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

  useEffect(() => {
    if (activeTab !== 'people') return;
    const timer = setTimeout(() => {
      searchPeople(query);
      if (query.trim()) saveToHistory(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query, activeTab, searchPeople]);

  const publicPosts = [...posts]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter(p => {
      if (!query.trim()) return true;
      return (p.caption || '').toLowerCase().includes(query.toLowerCase())
        || (p.userName || '').toLowerCase().includes(query.toLowerCase());
    });

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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={24} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <Search size={18} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === 'people' ? 'Search people...' : 'Search posts, channels...'}
              placeholderTextColor="#94a3b8"
              value={query}
              onChangeText={setQuery}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setTimeout(() => setIsInputFocused(false), 150)}
              onSubmitEditing={() => { if (query.trim()) saveToHistory(query.trim()); }}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.compassContainer}>
            <Compass size={20} color="#0057bd" />
          </View>
        </View>

        {/* Search History Dropdown */}
        {isInputFocused && !query.trim() && searchHistory.length > 0 && (
          <View style={styles.historyDropdown}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.historyClear}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 200 }}>
              {searchHistory.map(h => (
                <TouchableOpacity
                  key={h}
                  onPress={() => { setQuery(h); setIsInputFocused(false); }}
                  style={styles.historyItem}
                >
                  <Search size={14} color="#94a3b8" />
                  <Text style={styles.historyText} numberOfLines={1}>{h}</Text>
                  <TouchableOpacity onPress={() => removeFromHistory(h)}>
                    <X size={14} color="#94a3b8" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {(['posts', 'channels', 'people'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            >
              {tab === 'posts' ? <TrendingUp size={16} color={activeTab === tab ? '#0057bd' : '#64748b'} /> :
               tab === 'channels' ? <Radio size={16} color={activeTab === tab ? '#0057bd' : '#64748b'} /> :
               <Users size={16} color={activeTab === tab ? '#0057bd' : '#64748b'} />}
              <Text style={[styles.tabTxt, activeTab === tab && styles.tabTxtActive]}>
                {tab === 'posts' ? 'Trending' : tab === 'channels' ? 'Channels' : 'People'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
        {/* POSTS TAB */}
        {activeTab === 'posts' && (
          <Animated.View entering={FadeIn}>
            {publicPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <Compass size={40} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>Nothing to explore yet.</Text>
                <Text style={styles.emptyDesc}>Public posts will appear here.</Text>
              </View>
            ) : (
              <View style={styles.postsGrid}>
                {publicPosts.map(post => (
                  <TouchableOpacity key={post.id} style={styles.postCard}>
                    <Image
                      source={{ uri: post.mediaUrl || post.imageUrl || `https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=300&h=300&sig=${post.id}` }}
                      style={styles.postImage}
                    />
                    {(post.mediaType === 'video' || post.videoUrl) && (
                      <View style={styles.videoIcon}>
                        <Play size={16} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* CHANNELS TAB */}
        {activeTab === 'channels' && (
          <Animated.View entering={FadeIn} style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
                >
                  <Text style={[styles.catChipTxt, activeCategory === cat && styles.catChipTxtActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {isLoadingChannels ? (
              <View style={{ alignItems: 'center', marginTop: 40 }}><BubbleLoader size={30} /></View>
            ) : filteredChannels.length === 0 ? (
              <View style={styles.emptyState}>
                <Radio size={40} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No channels found.</Text>
                <Text style={styles.emptyDesc}>Try a different category or search term.</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {filteredChannels.map(channel => (
                  <TouchableOpacity key={channel.id} style={styles.channelCard} onPress={() => { 
                    if (!channel.isJoined) {
                      handleJoinChannel(channel); 
                    } else {
                      setActiveChatId(channel.id);
                      onNavigate('chat-detail');
                    }
                  }}>
                    <View style={styles.channelIconBox}>
                      <Hash size={20} color="#0057bd" />
                    </View>
                    <View style={styles.channelInfo}>
                      <View style={styles.channelNameRow}>
                        <Text style={styles.channelName} numberOfLines={1}>{channel.name}</Text>
                        {channel.isLive && (
                          <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveTxt}>LIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.channelDesc} numberOfLines={1}>{channel.description}</Text>
                      <View style={styles.channelMeta}>
                        <View style={[styles.channelCatBadge, { borderColor: CATEGORY_COLORS[channel.category] || '#94a3b8' }]}>
                          <Text style={[styles.channelCatTxt, { color: CATEGORY_COLORS[channel.category] || '#94a3b8' }]}>{channel.category}</Text>
                        </View>
                        <View style={styles.channelMembers}>
                          <Users size={12} color="#64748b" />
                          <Text style={styles.channelMembersTxt}>{channel.memberCount?.toLocaleString?.() ?? 0}</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => { 
                        if (!channel.isJoined) {
                          handleJoinChannel(channel); 
                        } else {
                          setActiveChatId(channel.id);
                          onNavigate('chat-detail');
                        }
                      }}
                      disabled={channel.isJoined || joiningChannelId === channel.id || requestedChannels.has(channel.id)}
                      style={[styles.joinBtn, channel.isJoined ? styles.joinBtnJoined : requestedChannels.has(channel.id) ? styles.joinBtnReq : styles.joinBtnActive]}
                    >
                      {channel.isJoined ? (
                        <><Check size={12} color="#64748b" /><Text style={styles.joinBtnJoinedTxt}> Joined</Text></>
                      ) : joiningChannelId === channel.id ? (
                        <BubbleLoader size={16} />
                      ) : requestedChannels.has(channel.id) ? (
                        <Text style={styles.joinBtnJoinedTxt}>Requested</Text>
                      ) : (
                        <Text style={styles.joinBtnActiveTxt}>Join</Text>
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Lyn Banner */}
            <View style={styles.lynBanner}>
              <View style={styles.lynHeader}>
                <View style={styles.lynIconBox}>
                  <Droplet size={16} color="#0057bd" />
                </View>
                <View>
                  <Text style={styles.lynTitle}>LYN RECOMMENDS</Text>
                  <Text style={styles.lynSub}>Based on your conversations</Text>
                </View>
              </View>
              {currentUser?.settings?.privacy?.aiDiscoverable ? (
                <>
                  <Text style={styles.lynDesc}>Lyn AI is analyzing your interests to find the best channels for you.</Text>
                  <TouchableOpacity onPress={() => setQuery('AI_RECOMMENDED')} style={styles.lynBtn}>
                    <Text style={styles.lynBtnTxt}>Show AI Recommendations</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.lynDesc}>Enable AI Discoverability in your Privacy settings so Lyn can connect you with channels aligned to your interests.</Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* PEOPLE TAB */}
        {activeTab === 'people' && (
          <Animated.View entering={FadeIn} style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            {!query.trim() && !hasSearchedPeople && (
              <View style={styles.emptyState}>
                <Users size={40} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>Find anyone on Aqualyn</Text>
                <Text style={styles.emptyDesc}>Search by name, @username, or user ID</Text>
              </View>
            )}

            {isSearchingPeople && (
              <View style={{ alignItems: 'center', marginTop: 40 }}><BubbleLoader size={30} /></View>
            )}

            {!isSearchingPeople && hasSearchedPeople && peopleResults.length === 0 && query.trim() !== '' && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No people found for "{query}".</Text>
                <Text style={styles.emptyDesc}>Try a different name, username, or ID.</Text>
              </View>
            )}

            {!isSearchingPeople && peopleResults.length > 0 && (
              <View style={{ gap: 12 }}>
                {peopleResults.map(user => {
                  const isFollowing = currentUser?.following?.includes(user.id);
                  const hasSentReq = user.followRequests?.includes(currentUser?.id || '') || user.receivedFollowReqs?.some?.((r: any) => r.senderId === currentUser?.id);
                  return (
                    <View key={user.id} style={styles.userCard}>
                      <TouchableOpacity onPress={() => { setActiveContactId(user.id); onNavigate('contact-profile'); }}>
                        {user.avatar ? (
                          <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
                        ) : (
                          <View style={styles.userAvatarPlaceholder}>
                            <Image source={{ uri: `https://ui-avatars.com/api/?background=random&format=png&name=${encodeURIComponent(user.displayName || user.name || 'U')}` }} style={styles.userAvatar} />
                          </View>
                        )}
                      </TouchableOpacity>
                      <View style={styles.userInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={styles.userName} numberOfLines={1}>{user.displayName || user.name || 'User'}</Text>
                          {user.isPrivate && <Lock size={12} color="#94a3b8" />}
                        </View>
                        <Text style={styles.userHandle} numberOfLines={1}>@{user.username}</Text>
                        {user.bio ? <Text style={styles.userBio} numberOfLines={1}>{user.bio}</Text> : null}
                      </View>
                      {isFollowing ? (
                        <TouchableOpacity
                          onPress={() => { startChatWithContact(user.id); setTimeout(() => onNavigate('chat-detail'), 50); }}
                          style={styles.followBtnMsg}
                        >
                          <Text style={styles.followBtnMsgTxt}>Message</Text>
                        </TouchableOpacity>
                      ) : hasSentReq ? (
                        <View style={styles.followBtnReq}>
                          <Text style={styles.followBtnReqTxt}>Requested</Text>
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => followUser(user.id)} style={styles.followBtnActive}>
                          <Text style={styles.followBtnActiveTxt}>Follow</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Lyn AI Match Banner */}
            <View style={[styles.lynBanner, { marginTop: 24 }]}>
              <View style={styles.lynHeader}>
                <View style={styles.lynIconBox}>
                  <Droplet size={16} color="#0057bd" />
                </View>
                <View>
                  <Text style={styles.lynTitle}>LYN AI MATCH</Text>
                  <Text style={styles.lynSub}>Find people like you</Text>
                </View>
              </View>
              <Text style={styles.lynDesc}>Lyn can analyze your interests to suggest the best people for you to connect with.</Text>
              {!currentUser?.settings?.privacy?.aiDiscoverable && (
                <Text style={[styles.lynDesc, { color: '#0057bd', fontWeight: '500', marginTop: 8 }]}>Enable AI Discoverability in Privacy settings to show up in Lyn recommendations.</Text>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    paddingBottom: 8,
    zIndex: 50,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, gap: 12 },
  backBtn: { padding: 8, marginLeft: -8 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 20, height: 40, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a' },
  clearBtn: { padding: 4 },
  compassContainer: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(0,87,189,0.1)', alignItems: 'center', justifyContent: 'center' },
  historyDropdown: { position: 'absolute', top: 96, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, zIndex: 60, borderWidth: 1, borderColor: '#e2e8f0' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  historyTitle: { fontSize: 10, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
  historyClear: { fontSize: 10, fontWeight: '700', color: '#ef4444' },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  historyText: { flex: 1, fontSize: 14, color: '#0f172a' },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 8 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8, borderBottomWidth: 2, borderColor: 'transparent' },
  tabBtnActive: { borderColor: '#0057bd' },
  tabTxt: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  tabTxtActive: { color: '#0057bd' },
  content: { flexGrow: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 16 },
  emptyDesc: { fontSize: 13, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
  postsGrid: { flexDirection: 'row', flexWrap: 'wrap', width: W },
  postCard: { width: W / 3, height: W / 3, padding: 1 },
  postImage: { width: '100%', height: '100%', backgroundColor: '#e2e8f0' },
  videoIcon: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  catChipActive: { backgroundColor: '#0057bd', borderColor: '#0057bd' },
  catChipTxt: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  catChipTxtActive: { color: '#fff' },
  channelCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  channelIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(0,87,189,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  channelInfo: { flex: 1 },
  channelNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  channelName: { fontSize: 14, fontWeight: '700', color: '#0f172a', flexShrink: 1 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 4 },
  liveDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#ef4444' },
  liveTxt: { fontSize: 9, fontWeight: '800', color: '#ef4444' },
  channelDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  channelMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  channelCatBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  channelCatTxt: { fontSize: 9, fontWeight: '700' },
  channelMembers: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  channelMembersTxt: { fontSize: 10, color: '#64748b' },
  joinBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, minWidth: 64, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  joinBtnActive: { backgroundColor: '#0057bd' },
  joinBtnJoined: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  joinBtnReq: { backgroundColor: '#f1f5f9' },
  joinBtnActiveTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  joinBtnJoinedTxt: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  lynBanner: { backgroundColor: 'rgba(0,87,189,0.05)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,87,189,0.1)', marginTop: 16 },
  lynHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  lynIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(0,87,189,0.1)', alignItems: 'center', justifyContent: 'center' },
  lynTitle: { fontSize: 10, fontWeight: '800', color: '#0057bd', letterSpacing: 0.5 },
  lynSub: { fontSize: 10, color: '#64748b' },
  lynDesc: { fontSize: 12, color: '#334155', lineHeight: 18 },
  lynBtn: { marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(0,87,189,0.1)' },
  lynBtnTxt: { fontSize: 12, fontWeight: '700', color: '#0057bd' },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  userAvatar: { width: 48, height: 48, borderRadius: 24 },
  userAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,87,189,0.1)', alignItems: 'center', justifyContent: 'center' },
  userAvatarTxt: { fontSize: 18, fontWeight: '700', color: '#0057bd' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  userHandle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  userBio: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  followBtnActive: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#0057bd' },
  followBtnActiveTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
  followBtnMsg: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(0,87,189,0.1)' },
  followBtnMsgTxt: { fontSize: 11, fontWeight: '700', color: '#0057bd' },
  followBtnReq: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9' },
  followBtnReqTxt: { fontSize: 11, fontWeight: '600', color: '#64748b' }
});
