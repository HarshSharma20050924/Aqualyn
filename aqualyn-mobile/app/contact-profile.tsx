import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Modal, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, MessageCircle, Phone, Video, Info, Bell, Ban, Trash2, Lock, ShieldCheck, UserPlus, UserCheck, Clock, Grid, PlayCircle, X } from 'lucide-react-native';
import { useAppContext } from '../src/context/AppContext';
import { useCall } from '../src/context/CallContext';
import { Theme } from '../src/config/theme';
import { apiFetch } from '../src/utils/fetcher';
import { ENDPOINTS } from '../src/config/api';

export default function ContactProfileScreen() {
  const router = useRouter();
  const { 
    contacts, activeContactId, setActiveContactId, startChatWithContact, 
    addToast, chats, currentUser, blockContact, reportContact, muteChat, 
    followUser, unfollowUser, globalUsers, setGlobalUsers, requestSecretChat, createGroupChat 
  } = useAppContext();

  const { startCall } = useCall();
  const [activeTab, setActiveTab] = useState<'posts' | 'highlights'>('posts');
  const [userPostsData, setUserPostsData] = useState<any[]>([]);
  const [userStoriesData, setUserStoriesData] = useState<any[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const contact = globalUsers.find((c: any) => c.id === activeContactId) || 
                  contacts.find((c: any) => c.id === activeContactId) ||
                  (currentUser?.id === activeContactId ? currentUser : null);

  const chat = chats.find((c: any) => c.id === activeContactId || c.participantIds?.includes(activeContactId || ''));
  const isBlocked = currentUser?.blockedUsers?.includes(activeContactId || '');
  const isFollowing = currentUser?.following?.includes(activeContactId || '');

  const [mediaCount, setMediaCount] = useState({ total: 0 });
  const [showList, setShowList] = useState<'followers' | 'following' | null>(null);
  const [listData, setListData] = useState<any[]>([]);
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

  useEffect(() => {
    if (activeContactId) {
      const fetchData = async () => {
        try {
          if (!contact) {
            const res = await apiFetch(ENDPOINTS.USER_PROFILE(activeContactId));
            if (res.ok) {
              const data = await res.json();
              setGlobalUsers((prev: any[]) => prev.some(u => u.id === data.id) ? prev : [...prev, data]);
            }
          }
          if (chat) {
            const mediaRes = await apiFetch(ENDPOINTS.CHAT_MEDIA(chat.id));
            if (mediaRes.ok) {
              const mediaData = await mediaRes.json();
              setMediaCount(mediaData);
            }
          }
        } catch (e) {
          console.error("Data fetch error:", e);
        }
      };
      fetchData();
    }
  }, [activeContactId, chat?.id]);

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

  if (!contact) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  const displayName = contact.displayName || contact.name || 'User';
  const username = contact.username || displayName.toLowerCase().replace(/\s+/g, '_');
  const isPrivate = contact.isPrivate && !isFollowing;

  const handleMessage = () => {
    startChatWithContact(contact.id);
    setTimeout(() => {
      router.push(`/chat/${contact.id}`);
    }, 100);
  };

  const handleRequestSecretChat = () => {
    requestSecretChat(contact.id);
    setTimeout(() => {
      router.push(`/chat/${contact.id}`);
    }, 100);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Info</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main Identity */}
      <View style={styles.profileSection}>
        <Image source={{ uri: contact.avatar }} style={styles.avatar} />
        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.username}>@{username}</Text>
        {contact.bio && <Text style={styles.bio}>{contact.bio}</Text>}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userPostsData.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <TouchableOpacity style={styles.statBox} onPress={() => fetchSocialList('followers')}>
            <Text style={styles.statNumber}>
              {contact._count?.followers ?? contact.followers?.length ?? 0}
            </Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statBox} onPress={() => fetchSocialList('following')}>
            <Text style={styles.statNumber}>
              {contact._count?.following ?? contact.following?.length ?? 0}
            </Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* Calls Buttons */}
        <View style={styles.callsRow}>
          <TouchableOpacity 
            style={styles.callButton}
            onPress={() => startCall(contact.id, displayName, contact.avatar, 'VOICE')}
          >
            <Phone size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.callButton}
            onPress={() => startCall(contact.id, displayName, contact.avatar, 'VIDEO')}
          >
            <Video size={20} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Interaction Actions */}
        <View style={styles.actionRow}>
          {isFollowing ? (
            <>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleMessage}>
                <MessageCircle size={18} color="white" />
                <Text style={styles.primaryBtnText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => unfollowUser(contact.id)}>
                <Text style={styles.secondaryBtnText}>Following</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {!contact.isPrivate && (
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleMessage}>
                  <MessageCircle size={18} color="white" />
                  <Text style={styles.secondaryBtnText}>Message</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.primaryBtn} onPress={() => followUser(contact.id)}>
                <UserPlus size={18} color="white" />
                <Text style={styles.primaryBtnText}>{contact.isPrivate ? 'Request' : 'Follow'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {isPrivate ? (
        <View style={styles.privateContainer}>
          <Lock size={40} color="rgba(255, 255, 255, 0.4)" />
          <Text style={styles.privateTitle}>This Account is Private</Text>
          <Text style={styles.privateText}>Follow this account to see their posts and highlights.</Text>
        </View>
      ) : (
        <>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
              onPress={() => setActiveTab('posts')}
            >
              <Grid size={20} color={activeTab === 'posts' ? Theme.colors.primary : 'rgba(255, 255, 255, 0.4)'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'highlights' && styles.activeTab]}
              onPress={() => setActiveTab('highlights')}
            >
              <PlayCircle size={20} color={activeTab === 'highlights' ? Theme.colors.primary : 'rgba(255, 255, 255, 0.4)'} />
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.gridContainer}>
            {activeTab === 'posts' ? (
              <View style={styles.postsGrid}>
                {userPostsData.length > 0 ? (
                  userPostsData.map((post: any, idx: number) => (
                    <Image key={post.id || idx} source={{ uri: post.mediaUrl }} style={styles.postThumbnail} />
                  ))
                ) : (
                  <Text style={styles.emptyText}>No posts yet</Text>
                )}
              </View>
            ) : (
              <View style={styles.highlightsRow}>
                {userStoriesData.length > 0 ? (
                  userStoriesData.map((story: any, idx: number) => (
                    <View key={story.id || idx} style={styles.storyPill}>
                      <Image source={{ uri: story.mediaUrl }} style={styles.storyThumbnail} />
                      <Text style={styles.storyTime}>
                        {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No highlights yet</Text>
                )}
              </View>
            )}
          </View>
        </>
      )}

      {/* About Section */}
      <View style={styles.detailsCard}>
        <View style={styles.detailsItem}>
          <Text style={styles.detailsLabel}>About</Text>
          <Text style={styles.detailsText}>{contact.bio || 'Hey there! I am using Aqualyn.'}</Text>
        </View>

        <TouchableOpacity 
          style={styles.detailsRowItem}
          onPress={() => {
            createGroupChat(`${currentUser?.displayName || 'My'} & ${contact.displayName || contact.name} Group`, [contact.id]);
            addToast('Group Chat created', 'success');
            router.push('/(tabs)/chats');
          }}
        >
          <UserCheck size={20} color="#06b6d4" />
          <Text style={styles.detailsItemTitle}>Start Group Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.detailsRowItem} onPress={handleRequestSecretChat}>
          <Lock size={20} color={Theme.colors.primary} />
          <Text style={[styles.detailsItemTitle, { color: Theme.colors.primary }]}>Start Secret Chat (Incognito)</Text>
        </TouchableOpacity>

        <View style={styles.detailsRowItem}>
          <Bell size={20} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.detailsItemTitle}>Mute Notifications</Text>
          <TouchableOpacity 
            style={[styles.toggle, chat?.isMuted ? styles.toggleOn : styles.toggleOff]}
            onPress={() => muteChat(contact.id)}
          >
            <View style={styles.toggleKnob} />
          </TouchableOpacity>
        </View>

        <View style={styles.detailsRowItem}>
          <Info size={20} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.detailsItemTitle}>Media, Links, and Docs</Text>
          <Text style={styles.detailsCount}>{mediaCount.total}</Text>
        </View>
      </View>

      <View style={styles.blockCard}>
        <TouchableOpacity style={styles.dangerRowItem} onPress={() => blockContact(contact.id)}>
          <Ban size={20} color="#ef4444" />
          <Text style={styles.dangerText}>{isBlocked ? 'Unblock' : 'Block'} Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerRowItem} onPress={() => reportContact(contact.id)}>
          <Trash2 size={20} color="#ef4444" />
          <Text style={styles.dangerText}>Report Contact</Text>
        </TouchableOpacity>
      </View>

      {/* Social List Modal */}
      {showList && (
        <Modal transparent={true} visible={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowList(null)} />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{showList === 'followers' ? 'Followers' : 'Following'}</Text>
                <TouchableOpacity onPress={() => setShowList(null)}>
                  <X size={20} color="white" />
                </TouchableOpacity>
              </View>

              {isListLoading ? (
                <ActivityIndicator size="small" color="white" style={{ margin: 20 }} />
              ) : listData.length === 0 ? (
                <Text style={styles.modalEmpty}>No users found</Text>
              ) : (
                <FlatList
                  data={listData}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.modalUserItem}
                      onPress={() => {
                        setShowList(null);
                        setActiveContactId(item.id);
                      }}
                    >
                      <Image source={{ uri: item.avatar }} style={styles.modalUserAvatar} />
                      <View>
                        <Text style={styles.modalUserName}>{item.displayName || item.name}</Text>
                        <Text style={styles.modalUserUsername}>@{item.username}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a192f',
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(10, 25, 47, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: 'white',
    marginBottom: 12,
  },
  displayName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  username: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  bio: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 30,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 2,
  },
  callsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 20,
    width: '100%',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  privateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  privateTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  privateText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0ea5e9',
  },
  gridContainer: {
    padding: 4,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  postThumbnail: {
    width: '32%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  highlightsRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  storyPill: {
    alignItems: 'center',
    gap: 4,
  },
  storyThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  storyTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    width: '100%',
    paddingVertical: 40,
  },
  detailsCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  detailsItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  detailsLabel: {
    color: '#0ea5e9',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailsText: {
    color: 'white',
    fontSize: 14,
  },
  detailsRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  detailsItemTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  detailsCount: {
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  toggleOn: {
    backgroundColor: '#0ea5e9',
    alignItems: 'flex-end',
  },
  toggleOff: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'flex-start',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  blockCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  dangerRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dangerText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  modalEmpty: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    paddingVertical: 30,
  },
  modalUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  modalUserName: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalUserUsername: {
    color: '#0ea5e9',
    fontSize: 12,
  },
});
