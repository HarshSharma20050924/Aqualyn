import BubbleLoader from '../components/ui/BubbleLoader';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Switch,
  Platform
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MessageCircle,
  Phone,
  Video,
  Info,
  Bell,
  Ban,
  Trash2,
  Lock,
  UserPlus,
  UserCheck,
  Clock,
  Grid,
  PlayCircle
} from 'lucide-react-native';

import { useAppContext } from '../context/AppContext';
import { useCall } from '../context/CallContext';
import { ENDPOINTS } from '../config/api';
import { apiFetch } from '../utils/fetcher';
import { User } from '../types';
import UserListModal from '../components/social/UserListModal';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function ContactProfileScreen({ onBack, onNavigate }: Props) {
  const insets = useSafeAreaInsets();
  const {
    contacts,
    activeContactId,
    setActiveContactId,
    startChatWithContact,
    addToast,
    chats,
    currentUser,
    blockContact,
    reportContact,
    muteChat,
    followUser,
    unfollowUser,
    globalUsers,
    setGlobalUsers,
    requestSecretChat,
    createGroupChat
  } = useAppContext();

  const { startCall } = useCall();
  const [activeTab, setActiveTab] = useState<'posts' | 'highlights'>('posts');
  const [userPostsData, setUserPostsData] = useState<any[]>([]);
  const [userStoriesData, setUserStoriesData] = useState<any[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Look in globalUsers first, then contacts, and finally currentUser (for self-profile view)
  const contact = globalUsers.find(c => c.id === activeContactId) || 
                  contacts.find(c => c.id === activeContactId) ||
                  (currentUser?.id === activeContactId ? currentUser : null);

  const chat = chats.find(c => c.id === activeContactId || c.participantIds?.includes(activeContactId || ''));
  const isBlocked = currentUser?.blockedUsers?.includes(activeContactId || '');
  
  // Follow/request state
  const isFollowing = currentUser?.following?.includes(activeContactId || '');
  const isRequested = contact?.receivedFollowReqs?.some((r: any) => r.senderId === currentUser?.id);

  const [mediaCount, setMediaCount] = useState({ total: 0 });
  const [showList, setShowList] = useState<'followers' | 'following' | null>(null);
  const [listData, setListData] = useState<User[]>([]);
  const [isListLoading, setIsListLoading] = useState(false);

  useEffect(() => {
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
  useEffect(() => {
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
      <View style={styles.loadingFallbackContainer}>
        {activeContactId ? (
          <View style={styles.centerAlignGap}>
            <BubbleLoader size={48} />
            <Text style={styles.loadingIdentityText}>Fetching Identity...</Text>
          </View>
        ) : (
          <View style={styles.centerAlignGap}>
            <View style={styles.notFoundAvatarBox}>
              <UserPlus size={40} color="#64748b" />
            </View>
            <Text style={styles.notFoundHeading}>User not found</Text>
            <TouchableOpacity onPress={onBack} style={styles.errorBackBtn}>
              <Text style={styles.errorBackText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  const displayName = contact.displayName || contact.name || 'User';
  const username = contact.username || displayName.toLowerCase().replace(/\s+/g, '_');
  const avatarUrl = contact.avatar;
  const isPrivate = contact.isPrivate && !isFollowing;

  const handleMessage = () => {
    startChatWithContact(contact.id);
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
    <Animated.View  style={styles.container}>
      {/* Header Deck Layer */}
      <View style={[styles.headerDock, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButtonFrame}>
          <ArrowLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Info</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.mainScrollArea, { paddingBottom: insets.bottom + 40 }]}>
        {/* Profile Card & Avatar Assembly */}
        <View style={styles.avatarCardCenter}>
          <View style={styles.avatarContainerOuter}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarMainImage} />
            ) : (
              <View style={styles.fallbackAvatarBox}>
                <Text style={styles.fallbackAvatarInitials}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {contact.isPrivate && (
              <View style={styles.privateLockBadge}>
                <Lock size={14} color="#64748b" />
              </View>
            )}
          </View>

          <View style={styles.metaSpacing}>
            <Text style={styles.displayNameText}>{displayName}</Text>
            <Text style={styles.usernameHandleText}>@{username}</Text>
            {contact.bio && <Text style={styles.bioText}>{contact.bio}</Text>}
          </View>

          {/* Social Counts Line */}
          <View style={styles.socialCountsRow}>
            <View style={styles.socialStatsBlock}>
              <Text style={styles.statsCountNumber}>{userPostsData.length}</Text>
              <Text style={styles.statsLabelText}>Posts</Text>
            </View>
            <TouchableOpacity onPress={() => fetchSocialList('followers')} style={styles.socialStatsBlock}>
              <Text style={styles.statsCountNumber}>
                {contact._count?.followers ?? contact.followers?.length ?? 0}
              </Text>
              <Text style={styles.statsLabelText}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => fetchSocialList('following')} style={styles.socialStatsBlock}>
              <Text style={styles.statsCountNumber}>
                {contact._count?.following ?? contact.following?.length ?? 0}
              </Text>
              <Text style={styles.statsLabelText}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Call Docks */}
          <View style={styles.callButtonsDockRow}>
            <TouchableOpacity
              onPress={() => startCall(contact.id, displayName, contact.avatar, 'VOICE')}
              style={styles.callIconBtn}
            >
              <Phone size={20} color="#1e293b" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => startCall(contact.id, displayName, contact.avatar, 'VIDEO')}
              style={styles.callIconBtn}
            >
              <Video size={20} color="#0891b2" />
            </TouchableOpacity>
          </View>

          {/* Dynamic Relational Interaction Stream Action System */}
          <View style={styles.primaryActionsWrapper}>
            {isFollowing ? (
              <View style={styles.dualFlexRowGap}>
                <TouchableOpacity onPress={handleMessage} style={styles.messageFlexPrimaryBtn}>
                  <MessageCircle size={18} color="#fff" />
                  <Text style={styles.messageFlexPrimaryText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => unfollowUser(contact.id)} style={styles.followingOutlineBtn}>
                  <Text style={styles.followingOutlineText}>Following</Text>
                </TouchableOpacity>
              </View>
            ) : isRequested ? (
              <View style={styles.pendingRequestedStateBtn}>
                <Clock size={18} color="#64748b" />
                <Text style={styles.pendingRequestedStateText}>Requested</Text>
              </View>
            ) : (
              <View style={styles.dualFlexRowGap}>
                {!contact.isPrivate && (
                  <TouchableOpacity onPress={handleMessage} style={styles.messageOutlinePublicBtn}>
                    <MessageCircle size={18} color="#1e293b" />
                    <Text style={styles.messageOutlinePublicText}>Message</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => followUser(contact.id)} style={styles.liquidGradientFollowBtn}>
                  <UserPlus size={18} color="#fff" />
                  <Text style={styles.liquidGradientFollowText}>
                    {contact.isPrivate ? 'Request' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Media Block Content vs Protected Account Systems Switch */}
        {isPrivate ? (
          <View style={styles.privateVaultShieldContainer}>
            <View style={styles.privateVaultShieldIconBox}>
              <Lock size={36} color="#64748b" />
            </View>
            <View style={styles.centerAlignGap}>
              <Text style={styles.vaultTitleText}>This Account is Private</Text>
              <Text style={styles.vaultSubtitleText}>Follow this account to see their posts and highlights.</Text>
            </View>
          </View>
        ) : (
          <>
            {/* Custom Interactive Tab System */}
            <View style={styles.tabNavbarRow}>
              <TouchableOpacity
                onPress={() => setActiveTab('posts')}
                style={[styles.tabNavItem, activeTab === 'posts' && styles.tabNavItemActive]}
              >
                <Grid size={22} color={activeTab === 'posts' ? '#0057bd' : '#64748b'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('highlights')}
                style={[styles.tabNavItem, activeTab === 'highlights' && styles.tabNavItemActive]}
              >
                <PlayCircle size={22} color={activeTab === 'highlights' ? '#0057bd' : '#64748b'} />
              </TouchableOpacity>
            </View>

            {/* Dynamic Content Streams Matrix Panel */}
            <View style={styles.contentMatrixWindow}>
              {isLoadingContent ? (
                <View style={styles.matrixInlineLoading}>
                  <BubbleLoader size={24} />
                </View>
              ) : activeTab === 'posts' ? (
                <View style={styles.postResponsiveGrid}>
                  {userPostsData.length > 0 ? (
                    userPostsData.map((post: any, i) => (
                      <View key={post.id || i} style={styles.postThumbnailFrame}>
                        <Image source={{ uri: post.mediaUrl }} style={styles.postThumbnailImage} />
                        {post.mediaType === 'video' && (
                          <View style={styles.videoOverlayIndicator}>
                            <PlayCircle size={14} color="#fff" />
                          </View>
                        )}
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyMatrixFallbackBox}>
                      <Text style={styles.emptyMatrixFallbackText}>No posts yet</Text>
                    </View>
                  )}
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightsHorizontalTrack}>
                  {userStoriesData.length > 0 ? (
                    userStoriesData.map((story: any, i) => (
                      <View key={story.id || i} style={styles.highlightTrackItemCircle}>
                        <View style={styles.highlightImgBorderRundown}>
                          <View style={styles.highlightImgContainerInner}>
                            <Image source={{ uri: story.mediaUrl }} style={styles.highlightThumbnailImage} />
                          </View>
                        </View>
                        <Text style={styles.highlightTimestampText}>
                          {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyMatrixFallbackBoxFullWidth}>
                      <Text style={styles.emptyMatrixFallbackText}>No highlights yet</Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </>
        )}

        {/* Informational Group Metadata Menu Blocks */}
        <View style={styles.menuGroupGlassCard}>
          <View style={styles.aboutCardBodyPadding}>
            <Text style={styles.aboutTitleHeaderText}>About</Text>
            <Text style={styles.aboutDescriptionBodyText}>{contact.bio || 'Hey there! I am using Aqualyn.'}</Text>
          </View>
          
          <TouchableOpacity
            onPress={() => {
              if (contact) {
                createGroupChat(`${currentUser?.displayName || 'My'} & ${contact.displayName || contact.name || 'Friend'} Group`, [contact.id]);
              }
            }}
            style={styles.interactiveMenuListItemBtn}
          >
            <View style={styles.menuItemFlexLayoutRow}>
              <UserCheck size={20} color="#0891b2" />
              <Text style={styles.menuItemLabelText}>Start Group Chat</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRequestSecretChat} style={styles.interactiveMenuListItemBtn}>
            <View style={styles.menuItemFlexLayoutRow}>
              <Lock size={20} color="#0057bd" />
              <Text style={[styles.menuItemLabelText, { color: '#0057bd' }]}>Start Secret Chat (Incognito)</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.interactiveMenuListItemBtn}>
            <View style={styles.menuItemFlexLayoutRow}>
              <Bell size={20} color="#64748b" />
              <Text style={styles.menuItemLabelText}>Mute Notifications</Text>
            </View>
            <Switch
              value={!!chat?.isMuted}
              onValueChange={handleMute}
              trackColor={{ false: '#e2e8f0', true: '#0057bd' }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : chat?.isMuted ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={[styles.interactiveMenuListItemBtn, { borderBottomWidth: 0 }]}>
            <View style={styles.menuItemFlexLayoutRow}>
              <Info size={20} color="#64748b" />
              <Text style={styles.menuItemLabelText}>Media, Links, and Docs</Text>
            </View>
            <Text style={styles.mediaCountersDisplayBadgeText}>{mediaCount.total}</Text>
          </View>
        </View>

        {/* Destructive Native Action System Panels */}
        <View style={styles.menuGroupGlassCard}>
          <TouchableOpacity onPress={handleBlock} style={styles.interactiveMenuListItemBtn}>
            <View style={styles.menuItemFlexLayoutRow}>
              <Ban size={20} color="#ef4444" />
              <Text style={styles.destructiveActionLabelText}>
                {isBlocked ? 'Unblock' : 'Block'} {contact.name}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReport} style={[styles.interactiveMenuListItemBtn, { borderBottomWidth: 0 }]}>
            <View style={styles.menuItemFlexLayoutRow}>
              <Trash2 size={20} color="#ef4444" />
              <Text style={styles.destructiveActionLabelText}>Report Contact</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Shared Followers Overlay Module Integration */}
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
          }
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  // Navigation Layout styles
  headerDock: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(248,250,252,0.85)',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    zIndex: 50
  },
  backButtonFrame: { padding: 8, borderRadius: 99, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', letterSpacing: -0.3 },

  mainScrollArea: { paddingHorizontal: 16, paddingTop: 16 },

  // Profile Avatar Framing Matrix Components
  avatarCardCenter: { alignItems: 'center', marginBottom: 24 },
  avatarContainerOuter: { position: 'relative', width: 128, height: 128, borderRadius: 64, borderWidth: 4, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  avatarMainImage: { width: '100%', height: '100%', borderRadius: 64, resizeMode: 'cover' },
  fallbackAvatarBox: { width: '100%', height: '100%', borderRadius: 64, backgroundColor: '#0057bd', justifyContent: 'center', alignItems: 'center' },
  fallbackAvatarInitials: { fontSize: 44, fontWeight: '800', color: '#fff' },
  privateLockBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', padding: 6, borderRadius: 99, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },

  metaSpacing: { alignItems: 'center', marginTop: 16, paddingHorizontal: 24 },
  displayNameText: { fontSize: 24, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  usernameHandleText: { fontSize: 14, color: '#64748b', fontWeight: '500', marginTop: 2 },
  bioText: { fontSize: 13, color: '#475569', textAlign: 'center', marginTop: 8, lineHeight: 18 },

  // Social Stats Dock Layout Row grid elements
  socialCountsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32, marginTop: 16, paddingVertical: 4 },
  socialStatsBlock: { alignItems: 'center' },
  statsCountNumber: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  statsLabelText: { fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  // Hardware Call Action Trigger Systems
  callButtonsDockRow: { flexDirection: 'row', gap: 12, width: '100%', maxWidth: 280, marginTop: 16 },
  callIconBtn: { flex: 1, height: 46, borderRadius: 14, backgroundColor: '#fff', borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },

  // Relational Logic Stream Action System layouts
  primaryActionsWrapper: { width: '100%', maxWidth: 320, marginTop: 14 },
  dualFlexRowGap: { flexDirection: 'row', gap: 10, width: '100%' },
  messageFlexPrimaryBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: '#0057bd', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#0057bd', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  messageFlexPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  followingOutlineBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: '#fff', borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  followingOutlineText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  pendingRequestedStateBtn: { width: '100%', height: 48, borderRadius: 14, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  pendingRequestedStateText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  messageOutlinePublicBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  messageOutlinePublicText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  liquidGradientFollowBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: '#0891b2', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#0891b2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  liquidGradientFollowText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Account Shield Layouts for private profiles
  privateVaultShieldContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  privateVaultShieldIconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  vaultTitleText: { fontSize: 16, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  vaultSubtitleText: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 4, lineHeight: 18 },

  // Segment Tab Navigation System components
  tabNavbarRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e2e8f0', marginTop: 8 },
  tabNavItem: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderColor: 'transparent' },
  tabNavItemActive: { borderColor: '#0057bd' },

  // Content Window Dynamic Grids Layout System
  contentMatrixWindow: { marginTop: 4 },
  matrixInlineLoading: { paddingVertical: 32, alignItems: 'center' },
  postResponsiveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  postThumbnailFrame: { width: (WINDOW_WIDTH - 36) / 3, aspectRatio: 1, backgroundColor: '#f1f5f9', position: 'relative' },
  postThumbnailImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  videoOverlayIndicator: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', padding: 3, borderRadius: 99 },
  emptyMatrixFallbackBox: { width: '100%', paddingVertical: 64, alignItems: 'center', justifyContent: 'center' },
  emptyMatrixFallbackBoxFullWidth: { width: WINDOW_WIDTH - 32, paddingVertical: 48, alignItems: 'center', justifyContent: 'center' },
  emptyMatrixFallbackText: { fontSize: 13, fontWeight: '600', color: '#64748b' },

  // Horizontal Highlight Track container design lines
  highlightsHorizontalTrack: { gap: 16, paddingVertical: 12, paddingHorizontal: 4 },
  highlightTrackItemCircle: { alignItems: 'center', gap: 6 },
  highlightImgBorderRundown: { width: 68, height: 68, borderRadius: 34, padding: 2, backgroundColor: 'rgba(0,87,189,0.15)', justifyContent: 'center', alignItems: 'center' },
  highlightImgContainerInner: { width: '100%', height: '100%', borderRadius: 32, borderWidth: 2, borderColor: '#fff', overflow: 'hidden' },
  highlightThumbnailImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  highlightTimestampText: { fontSize: 11, fontWeight: '500', color: '#64748b' },

  // About & Menu Integration Blocks layout configurations
  menuGroupGlassCard: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 1, marginTop: 16 },
  aboutCardBodyPadding: { padding: 20, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  aboutTitleHeaderText: { fontSize: 12, fontWeight: '800', color: '#0057bd', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  aboutDescriptionBodyText: { fontSize: 14, color: '#1e293b', lineHeight: 20 },
  interactiveMenuListItemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  menuItemFlexLayoutRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuItemLabelText: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  mediaCountersDisplayBadgeText: { fontSize: 13, fontWeight: '700', color: '#0057bd' },
  destructiveActionLabelText: { fontSize: 14, fontWeight: '700', color: '#ef4444' },

  // Fallback views layout
  loadingFallbackContainer: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  centerAlignGap: { alignItems: 'center', gap: 12 },
  loadingIdentityText: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  notFoundAvatarBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  notFoundHeading: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  errorBackBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, backgroundColor: '#0f172a', marginTop: 4 },
  errorBackText: { fontSize: 14, fontWeight: '700', color: '#fff' }
});