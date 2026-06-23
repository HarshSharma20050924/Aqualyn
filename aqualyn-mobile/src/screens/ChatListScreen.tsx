import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Dimensions,
  Platform,
  Vibration,
  Alert,
  RefreshControl
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  Pin,
  Users,
  CheckCheck,
  Mic,
  UserPlus,
  Lock,
  Pen,
  Globe,
  MoreVertical,
  Moon,
  Sun,
  Trash2,
  CheckSquare,
  Archive,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  FolderPlus,
  Eraser,
  ChevronRight,
  X,
  Check,
  MonitorSmartphone
} from 'lucide-react-native';

import { useAppContext } from '../context/AppContext';
import NewChatModal from '../components/chat/NewChatModal';
import NewFolderModal from '../components/modals/NewFolderModal';
import { ChatPeekPreview } from '../components/chat/ChatPeekPreview';
import DeleteChatDialog from '../components/chat/DeleteChatDialog';
import { ENDPOINTS } from '../config/api';
import { apiFetch } from '../utils/fetcher';
import BubbleLoader from '../components/ui/BubbleLoader';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

interface Props {
  onNavigate: (screen: string) => void;
}

export default function ChatListScreen({ onNavigate }: Props) {
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0); // Added header height tracking
  const {
    currentUser,
    chats,
    contacts,
    setActiveChatId,
    messages,
    isLoading,
    isFetchingData,
    folders,
    archiveChat,
    pinChat,
    muteChat,
    deleteChat,
    clearHistory,
    markAsRead,
    addChatToFolder,
    addToast,
    archiveLockPin,
    theme,
    setTheme,
    setGlobalUsers,
    followUser,
    startChatWithContact,
    setActiveContactId,
    globalUsers,
    createGroupChat,
    fetchInitialData
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());

  // Interaction timers and anchors
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [contextMenuChatId, setContextMenuChatId] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const lastTouchPos = useRef({ x: 0, y: 0 });
  const [showFolderSubmenu, setShowFolderSubmenu] = useState(false);
  const [isArchivePinModalOpen, setIsArchivePinModalOpen] = useState(false);
  const [archivePinValue, setArchivePinValue] = useState('');
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [peekChatId, setPeekChatId] = useState<string | null>(null);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  }, [fetchInitialData]);

  // Global Context Search Debouncer
  useEffect(() => {
    if (searchQuery && isSearching) {
      setIsSearchLoading(true);
      const timer = setTimeout(() => {
        apiFetch(ENDPOINTS.USER_SEARCH(searchQuery))
          .then((res) => res.json())
          .then((data) => {
            setGlobalSearchResults(data);
            setGlobalUsers((prev) => {
              const existingIds = new Set(prev.map((u) => u.id));
              const newUsers = data.filter((u: any) => !existingIds.has(u.id));
              return [...prev, ...newUsers];
            });
            setIsSearchLoading(false);
          })
          .catch((e) => {
            console.error(e);
            setIsSearchLoading(false);
          });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setGlobalSearchResults([]);
      setIsSearchLoading(false);
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

  // Custom Touch Handlers for Long-Press Context Menus
  const handleTouchStart = (e: any) => {
    const nativeEvent = e?.nativeEvent || {};
    lastTouchPos.current = {
      x: nativeEvent.pageX || nativeEvent.clientX || 0,
      y: nativeEvent.pageY || nativeEvent.clientY || 0
    };
  };

  const handleLongPress = (id: string) => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      Vibration.vibrate(50);
    }
    setContextMenuChatId(id);
    setContextMenuPos(lastTouchPos.current);
  };

  const toggleSelection = (id: string) => {
    setSelectedChats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setIsSelectionMode(next.size > 0);
      return next;
    });
  };

  const toggleTheme = () => {
    const newMode = theme.mode === 'dark' ? 'light' : 'dark';
    setTheme((prev) => ({ ...prev, mode: newMode }));
    setShowHeaderMenu(false);
    addToast(`Switched to ${newMode === 'dark' ? 'Dark' : 'Light'} Mode`, 'success');
  };

  const handleDeleteChats = () => {
    selectedChats.forEach((id) => deleteChat(id));
    setIsSelectionMode(false);
    setSelectedChats(new Set());
  };

  const handleContextAction = (action: () => void) => {
    action();
    setContextMenuChatId(null);
    setShowFolderSubmenu(false);
  };

  // List Streaming Pipelines
  let filteredChats = chats;
  if (activeTab === 'unread') {
    filteredChats = chats.filter((c) => c.unreadCount && c.unreadCount > 0);
  } else if (activeTab === 'groups') {
    filteredChats = chats.filter((c) => c.isGroup);
  } else if (activeTab === 'personal') {
    filteredChats = chats.filter((c) => !c.isGroup && !c.id.startsWith('bot'));
  } else if (activeTab === 'bots') {
    filteredChats = chats.filter((c) => c.id.startsWith('bot'));
  } else if (activeTab === 'archived') {
    filteredChats = chats.filter((c) => c.isArchived);
  } else {
    const folder = folders.find((f) => f.name.toLowerCase() === activeTab);
    if (folder) {
      filteredChats = chats.filter((c) => folder.chatIds.includes(c.id));
    }
  }

  if (activeTab !== 'archived') {
    filteredChats = filteredChats.filter((c) => !c.isArchived);
  }

  if (searchQuery) {
    filteredChats = filteredChats.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const pinnedChats = filteredChats.filter((c) => c.isPinned);
  const recentChats = filteredChats.filter((c) => !c.isPinned);

  const getLastMessage = (chatId: string) => {
    const chatMsgs = messages[chatId];
    return chatMsgs && chatMsgs.length > 0 ? chatMsgs[chatMsgs.length - 1] : null;
  };

  const renderSkeletonChat = (index: number) => (
    <View key={index} style={styles.skeletonCard}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonMeta}>
        <View style={styles.skeletonRowSpace}>
          <View style={[styles.skeletonLine, { width: '40%' }]} />
          <View style={[styles.skeletonLine, { width: 30 }]} />
        </View>
        <View style={[styles.skeletonLine, { width: '70%', marginTop: 8 }]} />
      </View>
    </View>
  );

  return (
    <Animated.View  style={styles.screenContainer}>
      
      {/* Absolute Header Dock System */}
      <View 
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        style={[styles.headerContainer, { paddingTop: insets.top }]}
      >
        <View style={styles.headerToolbar}>
          {isSelectionMode ? (
            <View style={styles.selectionToolbarRow}>
              <View style={styles.selectionLeftActions}>
                <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedChats(new Set()); }} style={styles.iconPad}>
                  <X size={24} color="#475569" />
                </TouchableOpacity>
                <Text style={styles.selectionTitle}>{selectedChats.size} Selected</Text>
                <TouchableOpacity
                  onPress={() => {
                    const allIds = filteredChats.map((c) => c.id);
                    setSelectedChats(selectedChats.size === allIds.length ? new Set() : new Set(allIds));
                  }}
                  style={styles.selectAllBadge}
                >
                  <Text style={styles.selectAllText}>
                    {selectedChats.size === filteredChats.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.selectionRightActions}>
                <TouchableOpacity onPress={() => { selectedChats.forEach(id => archiveChat(id)); setIsSelectionMode(false); setSelectedChats(new Set()); addToast(`Archived completed`, 'success'); }} style={styles.iconPad}>
                  <Archive size={22} color="#475569" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { selectedChats.forEach(id => pinChat(id)); setIsSelectionMode(false); setSelectedChats(new Set()); }} style={styles.iconPad}>
                  <Pin size={22} color="#475569" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { selectedChats.forEach(id => muteChat(id)); setIsSelectionMode(false); setSelectedChats(new Set()); }} style={styles.iconPad}>
                  <Volume2 size={22} color="#475569" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteChats} style={styles.iconPad}>
                  <Trash2 size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : isSearching ? (
            <View style={styles.searchBoxRow}>
              <Search size={20} color="#64748b" style={styles.searchIconLeft} />
              <TextInput
                autoFocus
                style={styles.globalSearchInput}
                placeholder="Global Search..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }}>
                <Text style={styles.cancelSearchBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.brandRow}>
                <TouchableOpacity onPress={() => onNavigate('profile')} style={styles.profileAvatarFrame}>
                  <Image source={{ uri: currentUser?.avatar }} style={styles.avatarImage} />
                </TouchableOpacity>
                <Text style={styles.brandTitleText}>Aqualyn</Text>
              </View>
              <View style={styles.utilityActionsRow}>
                <TouchableOpacity onPress={() => setIsSearching(true)} style={styles.iconPadCircle}>
                  <Search size={22} color="#0891b2" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowHeaderMenu(!showHeaderMenu)} style={styles.iconPadCircle}>
                  <MoreVertical size={22} color="#0891b2" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Categories Tab Bar */}
        {!isSearching && !isSelectionMode && (
          <View style={styles.tabsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
              {['all', ...folders.map((f) => f.name.toLowerCase()), 'personal', 'groups', 'unread', 'bots', 'archived'].map((tab) => {
                const isTabActive = activeTab === tab;
                const unreadBadgeCount = chats.filter((c) => {
                  if (tab === 'all') return (c.unreadCount || 0) > 0;
                  if (tab === 'groups') return c.isGroup && (c.unreadCount || 0) > 0;
                  if (tab === 'personal') return !c.isGroup && (c.unreadCount || 0) > 0;
                  if (tab === 'unread') return (c.unreadCount || 0) > 0;
                  return false;
                }).length;

                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => tab === 'archived' ? handleOpenArchive() : setActiveTab(tab)}
                    style={[styles.tabBadge, isTabActive ? styles.tabBadgeActive : styles.tabBadgeInactive]}
                  >
                    <Text style={[styles.tabBadgeText, isTabActive ? styles.textWhite : styles.textVariant]}>
                      {tab}
                    </Text>
                    {unreadBadgeCount > 0 && (
                      <View style={[styles.tabCounter, isTabActive ? styles.counterLight : styles.counterDark]}>
                        <Text style={[styles.counterText, isTabActive ? styles.textBrand : styles.textWhite]}>
                          {unreadBadgeCount > 9 ? '9+' : unreadBadgeCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity onPress={() => setIsNewFolderModalOpen(true)} style={styles.addFolderTabButton}>
                <FolderPlus size={18} color="#64748b" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </View>

{/* Main Messaging / Streams Center */}
       <View style={{ flex: 1, position: 'relative' }}>
         {refreshing && (
           <View style={{ position: 'absolute', top: headerHeight + 10, left: 0, right: 0, zIndex: 100, alignItems: 'center' }}>
             <BubbleLoader size={30} />
           </View>
         )}
         <ScrollView 
           contentContainerStyle={[styles.mainScroll, { paddingTop: headerHeight + 12, paddingBottom: insets.bottom + 100 }]}
           refreshControl={
             <RefreshControl
               refreshing={refreshing}
               onRefresh={onRefresh}
               tintColor="transparent"
               colors={['transparent']}
               progressBackgroundColor="transparent"
               progressViewOffset={-1000}
             />
           }
         >
        {((isLoading || isFetchingData) && chats.length === 0) ? (
          <View style={styles.skeletonContainer}>
            {[1, 2, 3, 4, 5].map((i) => renderSkeletonChat(i))}
          </View>
        ) : (
          <>
            {filteredChats.length === 0 && !searchQuery && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTextPrimary}>
                  {activeTab === 'all' ? 'No chats yet.' : `No ${activeTab} chats.`}
                </Text>
                {activeTab === 'all' && <Text style={styles.emptyTextSecondary}>Go to Contacts to start a conversation.</Text>}
              </View>
            )}

            {/* Global Search Interface Component */}
            {searchQuery ? (
              <View style={styles.globalSearchContainer}>
                <View style={styles.globalSearchTitleRow}>
                  <Globe size={14} color="#64748b" />
                  <Text style={styles.globalSearchTitle}>Global Search Results</Text>
                </View>
                {isSearchLoading ? (
                  <View style={styles.skeletonContainer}>
                    {[1, 2, 3].map((i) => renderSkeletonChat(i))}
                  </View>
                ) : (
                  <View style={styles.globalResultsList}>
                    {globalSearchResults
                    .filter((u) => u.id !== currentUser?.id)
                    .map((user) => {
                      const isFollowing = currentUser?.following?.includes(user.id);
                      const isRequested = user.followRequests?.includes(currentUser?.id || '');

                      return (
                        <View key={user.id} style={styles.globalUserCard}>
                          <TouchableOpacity
                            onPress={() => { setActiveContactId(user.id); onNavigate('contact-profile'); }}
                            style={styles.globalUserAvatarWrapper}
                          >
                            <Image source={{ uri: user.avatar || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(user.displayName || user.name || 'User')}` }} style={styles.globalUserAvatar} />
                          </TouchableOpacity>
                          <View style={styles.globalUserMeta}>
                            <View style={styles.globalUserNameRow}>
                              <Text style={styles.globalUserName}>{user.displayName || user.name || 'User'}</Text>
                              {user.isPrivate && <Lock size={12} color="#64748b" />}
                            </View>
                            <Text style={styles.globalUserHandle}>@{user.username || 'user'}</Text>
                          </View>
                          <View>
                            {isFollowing ? (
                              <TouchableOpacity
                                onPress={() => { startChatWithContact(user.id); onNavigate('chat-detail'); }}
                                style={styles.globalActionMsgBtn}
                              >
                                <Text style={styles.globalActionMsgText}>Message</Text>
                              </TouchableOpacity>
                            ) : isRequested ? (
                              <View style={styles.globalActionPendingBtn}>
                                <Text style={styles.globalActionPendingText}>Requested</Text>
                              </View>
                            ) : (
                              <TouchableOpacity onPress={() => followUser(user.id)} style={styles.globalActionFollowBtn}>
                                <Text style={styles.globalActionFollowText}>Follow</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : null}

            {/* Pinned Section */}
            {pinnedChats.length > 0 && !searchQuery && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeadingRow}>
                  <Text style={styles.sectionTitle}>Pinned</Text>
                  <Pin size={14} color="#0057bd" style={styles.sectionPinIcon} />
                </View>
                <View style={styles.chatsListGroup}>
                  {pinnedChats.map((chat) => {
                    const lastMsg = getLastMessage(chat.id);
                    const isSelected = selectedChats.has(chat.id);

                    return (
                      <TouchableOpacity
                        key={chat.id}
                        onPress={() => handleChatClick(chat.id)}
                        delayLongPress={500}
                        onPressIn={handleTouchStart}
                        onLongPress={() => handleLongPress(chat.id)}
                        style={[styles.chatCardItem, styles.chatCardPinned, isSelected && styles.chatCardSelected]}
                      >
                        <View style={styles.avatarContainer}>
                          {chat.isGroup ? (
                            <View style={styles.groupAvatarBox}>
                              <Users size={24} color="#0057bd" />
                            </View>
                          ) : (
                            <View style={styles.avatarTouchArea}>
                              <Image source={{ uri: chat.avatar || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(chat.name || 'Chat')}` }} style={styles.chatListItemAvatar} />
                              <View style={styles.aquaGlowDot} />
                            </View>
                          )}
                          {isSelectionMode && (
                            <View style={[styles.selectionCheckCircle, isSelected ? styles.checkSelectedBg : styles.checkUnselectedBg]}>
                              {isSelected && <Check size={12} color="#fff" strokeWidth={4} />}
                            </View>
                          )}
                        </View>
                        <View style={styles.chatCardContent}>
                          <View style={styles.cardHeaderLine}>
                            <Text numberOfLines={1} style={styles.chatItemName}>
                              {chat.isSecret && <Lock size={12} color="#22c55e" />} {chat.name}
                            </Text>
                            <Text style={styles.cardTimestampText}>{lastMsg?.timestamp || chat.lastMessageTime}</Text>
                          </View>
                          <Text numberOfLines={1} style={styles.cardLastMsgText}>{lastMsg?.text || chat.lastMessage || 'No messages yet'}</Text>
                        </View>
                        <View style={styles.cardIndicatorsColumn}>
                          {chat.unreadCount ? (
                            <View style={styles.unreadCounterBadge}>
                              <Text style={styles.unreadCounterText}>{chat.unreadCount}</Text>
                            </View>
                          ) : lastMsg?.status === 'seen' ? (
                            <CheckCheck size={16} color="#0057bd" />
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Recents Chat Stream Container */}
            {recentChats.length > 0 && !searchQuery && (
              <View style={[styles.sectionContainer, { marginTop: 16 }]}>
                <Text style={styles.sectionTitle}>Recent</Text>
                <View style={styles.chatsListGroup}>
                  {recentChats.map((chat) => {
                    const lastMsg = getLastMessage(chat.id);
                    const isSelected = selectedChats.has(chat.id);

                    return (
                      <TouchableOpacity
                        key={chat.id}
                        onPress={() => handleChatClick(chat.id)}
                        onPressIn={handleTouchStart}
                        onLongPress={() => handleLongPress(chat.id)}
                        style={[styles.chatCardItem, isSelected && styles.chatCardSelected]}
                      >
                        <View style={styles.avatarContainer}>
                          {chat.isSystem ? (
                            <View style={styles.systemAvatarBox}>
                              <UserPlus size={22} color="#0057bd" />
                            </View>
                          ) : (
                            <Image source={{ uri: chat.avatar || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(chat.name || 'Chat')}` }} style={styles.chatListItemAvatarRound} />
                          )}
                          {isSelectionMode && (
                            <View style={[styles.selectionCheckCircle, isSelected ? styles.checkSelectedBg : styles.checkUnselectedBg]}>
                              {isSelected && <Check size={12} color="#fff" strokeWidth={4} />}
                            </View>
                          )}
                        </View>
                        <View style={styles.chatCardContent}>
                          <View style={styles.cardHeaderLine}>
                            <Text numberOfLines={1} style={styles.chatItemName}>
                              {chat.isSecret && <Lock size={12} color="#22c55e" />} {chat.name}
                            </Text>
                            <Text style={styles.cardTimestampTextVariant}>{lastMsg?.timestamp || chat.lastMessageTime}</Text>
                          </View>
                          <Text numberOfLines={1} style={styles.cardLastMsgTextVariant}>{lastMsg?.text || chat.lastMessage || 'No messages'}</Text>
                        </View>
                        <View style={styles.cardIndicatorsColumn}>
                          {chat.unreadCount ? (
                            <View style={styles.unreadCounterBadge}>
                              <Text style={styles.unreadCounterText}>{chat.unreadCount}</Text>
                            </View>
                          ) : lastMsg?.status === 'seen' ? (
                            <CheckCheck size={16} color="#0057bd" />
                          ) : (
                            <CheckCheck size={16} color="#94a3b8" />
                          )}
                          {chat.isVoice && <Mic size={14} color="#64748b" style={{ marginTop: 4 }} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.encryptionFooterLock}>
          <Lock size={16} color="#64748b" />
          <Text style={styles.encryptionFooterText}>
            Messages are end-to-end encrypted.{"\n"}No one outside this chat can read them.
          </Text>
        </View>
      </ScrollView>
      </View>

      {/* Floating Action Pen System Dock */}
      <TouchableOpacity onPress={() => setIsNewChatModalOpen(true)} style={styles.floatingActionPen}>
        <Pen size={22} color="#fff" />
      </TouchableOpacity>

      {/* Header Context Overflow Menu Modal Layer */}
      <Modal visible={showHeaderMenu} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlayDismiss} activeOpacity={1} onPress={() => setShowHeaderMenu(false)}>
          <View style={[styles.floatingHeaderMenuCard, { top: insets.top + 50 }]}>
            <TouchableOpacity style={styles.menuDropOption} onPress={() => { setIsSelectionMode(true); setShowHeaderMenu(false); }}>
              <CheckSquare size={16} color="#475569" />
              <Text style={styles.menuDropText}>Select Chats</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuDropOption} onPress={() => { setShowHeaderMenu(false); onNavigate('linked-devices'); }}>
              <MonitorSmartphone size={16} color="#475569" />
              <Text style={styles.menuDropText}>Linked Devices</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuDropOption} onPress={toggleTheme}>
              {theme.mode === 'dark' ? <Sun size={16} color="#475569" /> : <Moon size={16} color="#475569" />}
              <Text style={styles.menuDropText}>{theme.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Security Vault Pin Layer Modal */}
      <Modal visible={isArchivePinModalOpen} transparent animationType="fade">
        <View style={styles.vaultPinOverlay}>
          <Animated.View  style={styles.vaultCardBox}>
            <Text style={styles.vaultTitle}>Archive Locked</Text>
            <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>Enter your PIN to access archived chats.</Text>
            <TextInput
              secureTextEntry
              maxLength={4}
              keyboardType="number-pad"
              autoFocus
              value={archivePinValue}
              onChangeText={(val) => setArchivePinValue(val.replace(/\D/g, ''))}
              placeholder="••••"
              placeholderTextColor="#94a3b8"
              style={styles.vaultPinInputField}
            />
            <View style={styles.vaultBtnRow}>
              <TouchableOpacity onPress={() => setIsArchivePinModalOpen(false)} style={styles.vaultCancelBtn}>
                <Text style={styles.vaultCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleVerifyArchivePin} style={styles.vaultUnlockBtn}>
                <Text style={styles.vaultUnlockText}>Unlock</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Dynamic Item Long Press Operations Engine */}
      <Modal visible={!!contextMenuChatId} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlayDismiss} activeOpacity={1} onPress={() => { setContextMenuChatId(null); setShowFolderSubmenu(false); }}>
          <View style={[styles.longPressContextMenuCard, {
            left: Math.min(contextMenuPos.x, WINDOW_WIDTH - 220),
            top: Math.min(contextMenuPos.y, WINDOW_HEIGHT - 350)
          }]}>
            <TouchableOpacity style={styles.menuDropOption} onPress={() => handleContextAction(() => { setIsSelectionMode(true); if (contextMenuChatId) toggleSelection(contextMenuChatId); })}>
              <CheckSquare size={16} color="#3b82f6" /><Text style={[styles.menuDropText, { color: '#3b82f6' }]}>Select</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuDropOption} onPress={() => handleContextAction(() => { if (contextMenuChatId) archiveChat(contextMenuChatId); })}>
              <Archive size={16} color="#475569" /><Text style={styles.menuDropText}>Archive</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuDropOption} onPress={() => handleContextAction(() => pinChat(contextMenuChatId!))}>
              <Pin size={16} color="#475569" /><Text style={styles.menuDropText}>Pin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuDropOption} onPress={() => handleContextAction(() => muteChat(contextMenuChatId!))}>
              <Volume2 size={16} color="#475569" /><Text style={styles.menuDropText}>Mute</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuDropOption} onPress={() => handleContextAction(() => markAsRead(contextMenuChatId!))}>
              <Eye size={16} color="#475569" /><Text style={styles.menuDropText}>Mark Read</Text>
            </TouchableOpacity>

            <View style={styles.submenuAnchorContainer}>
              <TouchableOpacity style={styles.menuDropOptionRowSpace} onPress={() => setShowFolderSubmenu(!showFolderSubmenu)}>
                <View style={styles.rowFlexGap}>
                  <FolderPlus size={16} color="#475569" />
                  <Text style={styles.menuDropText}>Add to folder</Text>
                </View>
                <ChevronRight size={14} color="#64748b" />
              </TouchableOpacity>
              {showFolderSubmenu && (
                <View style={styles.submenuFloatingBlock}>
                  {folders.map((f) => (
                    <TouchableOpacity key={f.id} style={styles.submenuItemBtn} onPress={() => handleContextAction(() => addChatToFolder(contextMenuChatId!, f.id))}>
                      <Text numberOfLines={1} style={styles.submenuItemText}>{f.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.menuDropOption} onPress={() => handleContextAction(() => clearHistory(contextMenuChatId!))}>
              <Eraser size={16} color="#475569" /><Text style={styles.menuDropText}>Clear History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuDropOption} onPress={() => { setChatToDelete(contextMenuChatId); setContextMenuChatId(null); }}>
              <Trash2 size={16} color="#ef4444" /><Text style={[styles.menuDropText, { color: '#ef4444' }]}>Delete Chat</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Auxiliary Operational Overlays */}
      <NewChatModal isOpen={isNewChatModalOpen} onClose={() => setIsNewChatModalOpen(false)} onNavigate={onNavigate} appContext={{ chats, contacts, currentUser, addToast, globalUsers, startChatWithContact, createGroupChat }} />
      <NewFolderModal isOpen={isNewFolderModalOpen} onClose={() => setIsNewFolderModalOpen(false)} appContext={{ addToast }} />
      {peekChatId && (
        <ChatPeekPreview
          chat={chats.find((c) => c.id === peekChatId)!}
          messages={messages[peekChatId] || []}
          currentUser={currentUser}
          isOpen={!!peekChatId}
          onClose={() => setPeekChatId(null)}
          onOpenChat={() => { setActiveChatId(peekChatId); setPeekChatId(null); onNavigate('chat-detail'); }}
          onArchive={() => archiveChat(peekChatId)}
          onPin={() => pinChat(peekChatId)}
          onMute={() => muteChat(peekChatId)}
          onDelete={() => { setChatToDelete(peekChatId); setPeekChatId(null); }}
        />
      )}
      <DeleteChatDialog
        isOpen={!!chatToDelete}
        chatName={chats.find((c) => c.id === chatToDelete)?.name || 'this user'}
        onConfirm={(forEveryone) => { if (chatToDelete) { deleteChat(chatToDelete, forEveryone ? 'everyone' : 'me'); setChatToDelete(null); } }}
        onCancel={() => setChatToDelete(null)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#f8fafc' },
  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'rgba(248,250,252,0.85)', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  headerToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 64, paddingHorizontal: 16 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileAvatarFrame: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: '#0891b2' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  brandTitleText: { fontSize: 22, fontWeight: '900', color: '#0891b2', letterSpacing: -0.5 },
  utilityActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconPadCircle: { padding: 8, borderRadius: 20 },
  iconPad: { padding: 8 },

  // Selection Layout System styles
  selectionToolbarRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectionLeftActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  selectAllBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: 'rgba(8,145,178,0.1)' },
  selectAllText: { fontSize: 11, fontWeight: '700', color: '#0891b2' },
  selectionRightActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },

  // Search Engine container elements
  searchBoxRow: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#e2e8f0' },
  searchIconLeft: { marginRight: 6 },
  globalSearchInput: { flex: 1, fontSize: 14, color: '#0f172a' },
  cancelSearchBtnText: { fontSize: 14, fontWeight: '700', color: '#0891b2', marginLeft: 8 },

  // Categories Scrollbar Dock System Layout
  tabsWrapper: { paddingVertical: 8 },
  tabsScrollContent: { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  tabBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 99, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tabBadgeActive: { backgroundColor: '#0057bd' },
  tabBadgeInactive: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  tabBadgeText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  textWhite: { color: '#fff' },
  textVariant: { color: '#64748b' },
  textBrand: { color: '#0057bd' },
  tabCounter: { marginLeft: 6, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  counterLight: { backgroundColor: '#fff' },
  counterDark: { backgroundColor: '#0057bd' },
  counterText: { fontSize: 9, fontWeight: '900' },
  addFolderTabButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },

  // Main Dynamic Messaging Streams
  mainScroll: { paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyTextPrimary: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  emptyTextSecondary: { fontSize: 13, color: '#94a3b8', marginTop: 4 },

  // Global Search Box interface elements
  globalSearchContainer: { marginBottom: 16 },
  globalSearchTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4, marginBottom: 12 },
  globalSearchTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  globalResultsList: { gap: 10 },
  globalUserCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  globalUserAvatarWrapper: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  globalUserAvatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  globalUserMeta: { flex: 1, marginLeft: 12 },
  globalUserNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  globalUserName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  globalUserHandle: { fontSize: 12, color: '#64748b', marginTop: 1 },
  globalActionMsgBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(0,87,189,0.06)' },
  globalActionMsgText: { fontSize: 12, fontWeight: '700', color: '#0057bd' },
  globalActionPendingBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, backgroundColor: '#f1f5f9' },
  globalActionPendingText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  globalActionFollowBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, backgroundColor: '#0057bd' },
  globalActionFollowText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // List Streaming Layout System
  sectionContainer: { marginBottom: 16 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', letterSpacing: -0.3 },
  sectionPinIcon: { marginRight: 4 },
  chatsListGroup: { gap: 8 },

  // Individual Dynamic Item Architecture Card Grid
  chatCardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  chatCardPinned: { backgroundColor: 'rgba(255,255,255,0.95)', borderWidth: 1, borderColor: 'rgba(8,145,178,0.15)' },
  chatCardSelected: { backgroundColor: 'rgba(0,87,189,0.08)', borderWidth: 1.5, borderColor: '#0057bd' },
  avatarContainer: { position: 'relative' },
  groupAvatarBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  avatarTouchArea: { position: 'relative', width: 52, height: 52 },
  chatListItemAvatar: { width: 52, height: 52, borderRadius: 16, resizeMode: 'cover' },
  chatListItemAvatarRound: { width: 52, height: 52, borderRadius: 26, resizeMode: 'cover' },
  aquaGlowDot: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#0891b2', borderWidth: 2, borderColor: '#fff' },
  selectionCheckCircle: { position: 'absolute', inset: 0, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  checkSelectedBg: { backgroundColor: 'rgba(0,87,189,0.85)' },
  checkUnselectedBg: { backgroundColor: 'rgba(0,0,0,0.2)' },
  chatCardContent: { flex: 1, marginLeft: 14 },
  cardHeaderLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  chatItemName: { fontSize: 14, fontWeight: '700', color: '#1e293b', flex: 1, paddingRight: 8 },
  cardTimestampText: { fontSize: 11, fontWeight: '600', color: '#0057bd' },
  cardTimestampTextVariant: { fontSize: 11, color: '#94a3b8' },
  cardLastMsgText: { fontSize: 13, fontWeight: '500', color: '#475569' },
  cardLastMsgTextVariant: { fontSize: 13, color: '#64748b' },
  cardIndicatorsColumn: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 20 },
  unreadCounterBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#0057bd', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  unreadCounterText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  systemAvatarBox: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,87,189,0.06)', justifyContent: 'center', alignItems: 'center' },

  // Context Header Floating Overlays Modals
  modalOverlayDismiss: { flex: 1, backgroundColor: 'transparent' },
  floatingHeaderMenuCard: { position: 'absolute', right: 16, backgroundColor: '#fff', borderRadius: 16, padding: 6, width: 180, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  menuDropOption: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, gap: 10 },
  menuDropOptionRowSpace: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 10 },
  menuDropText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  rowFlexGap: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Vault Security Modal
  vaultPinOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  vaultCardBox: { backgroundColor: '#fff', width: '100%', maxWidth: 340, borderRadius: 24, padding: 24, alignItems: 'center' },
  vaultTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 6 },
  vaultPinInputField: { width: '100%', height: 56, textAlign: 'center', fontSize: 24, fontWeight: '700', letterSpacing: 8, backgroundColor: '#f1f5f9', borderRadius: 14, marginBottom: 20, color: '#1e293b' },
  vaultBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  vaultCancelBtn: { flex: 1, height: 46, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  vaultCancelText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  vaultUnlockBtn: { flex: 1, height: 46, borderRadius: 12, backgroundColor: '#0057bd', justifyContent: 'center', alignItems: 'center' },
  vaultUnlockText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Item Long Press Operations Context Elements
  longPressContextMenuCard: { position: 'absolute', backgroundColor: '#fff', borderRadius: 18, padding: 6, width: 200, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  submenuAnchorContainer: { position: 'relative' },
  submenuFloatingBlock: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 4, marginTop: 4, marginLeft: 10 },
  submenuItemBtn: { padding: 8, borderRadius: 8 },
  submenuItemText: { fontSize: 13, color: '#475569', fontWeight: '500' },

  // Footer Architecture markers
  encryptionFooterLock: { alignItems: 'center', gap: 6, marginTop: 32, opacity: 0.5 },
  encryptionFooterText: { fontSize: 10, fontWeight: '600', color: '#64748b', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  floatingActionPen: { position: 'absolute', right: 20, bottom: 90, width: 56, height: 56, borderRadius: 18, backgroundColor: '#0057bd', justifyContent: 'center', alignItems: 'center', shadowColor: '#0057bd', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },

  // Skeleton UI components
  skeletonContainer: { gap: 8 },
  skeletonCard: { flexDirection: 'row', padding: 14, backgroundColor: '#fff', borderRadius: 20, alignItems: 'center' },
  skeletonAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f1f5f9' },
  skeletonMeta: { flex: 1, marginLeft: 14 },
  skeletonRowSpace: { flexDirection: 'row', justifyContent: 'space-between' },
  skeletonLine: { height: 12, backgroundColor: '#f1f5f9', borderRadius: 6 }
});