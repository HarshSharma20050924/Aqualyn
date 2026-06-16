import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  Dimensions,
  Modal,
  Alert
} from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInDown, 
  SlideInUp, 
  useAnimatedStyle, 
  useSharedValue, 
  withSequence, 
  withTiming 
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Video, 
  Phone, 
  MoreVertical, 
  Plus, 
  Smile, 
  Mic, 
  CheckCheck, 
  Users, 
  X, 
  Clock, 
  Lock, 
  Search, 
  Download, 
  Trash2, 
  Edit2, 
  Share2, 
  UserPlus, 
  User 
} from 'lucide-react-native';

// State & Context (Kept exactly identical to your web architecture)
import { useAppContext } from '../context/AppContext';
import { useCall } from '../context/CallContext';
import { Message } from '../types';

// Mobile Equivalent Sub-Components
import MediaAttachmentPicker from '../components/chat/MediaAttachmentPicker';
import AudioRecorderUI from '../components/chat/AudioRecorderUI';
import CameraUI from '../components/chat/CameraUI';
import MessageBubble from '../components/chat/MessageBubble';
import MediaGallery from '../components/chat/MediaGallery';
import GroupInfoScreen from './GroupInfoScreen';
import SecretChatInfoScreen from './SecretChatInfoScreen';
import ShareContactModal from '../components/chat/ShareContactModal';

import { uploadFile } from '../utils/uploads';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function ChatDetailScreen({ onBack, onNavigate }: Props) {
  const insets = useSafeAreaInsets();
  const { 
    messages, 
    setMessages, 
    sendMessage, 
    editMessage, 
    currentUser, 
    chats, 
    activeChatId, 
    addToast, 
    setActiveChatId, 
    setActiveContactId, 
    contacts, 
    globalUsers, 
    followUser, 
    typingUsers, 
    setTyping, 
    markAsRead, 
    handleSecretChatInvitation 
  } = useAppContext();
  
  const { startCall } = useCall();
  const [text, setText] = useState('');
  
  const scrollRef = useRef<ScrollView>(null);

  // UI Control states
  const [isAttachmentPickerOpen, setIsAttachmentPickerOpen] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const typingInThisChat = typingUsers[activeChatId || ''] || [];
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isShareContactOpen, setIsShareContactOpen] = useState(false);

  // Gallery and Modals
  const [galleryMedia, setGalleryMedia] = useState<{ id: string, url: string, type: 'image' | 'video' }[]>([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isSecretInfoOpen, setIsSecretInfoOpen] = useState(false);

  const chat = chats.find(c => c.id === activeChatId);
  const chatMessages = activeChatId ? (messages[activeChatId] || []) : [];
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [screenshotAlert, setScreenshotAlert] = useState(false);

  const flashOpacity = useSharedValue(0);

  if (!chat) return null;

  const targetUserId = !chat.isGroup ? chat.participantIds?.find(id => id !== currentUser?.id) : null;
  const targetUser = targetUserId ? globalUsers.find(u => u.id === targetUserId) : null;
  const isPrivateRestricted = targetUser?.isPrivate && !currentUser?.following?.includes(targetUser.id);
  const isRequested = targetUser?.followRequests?.includes(currentUser?.id || '');

  // Screenshot Alert Trigger (Native Reanimated Implementation)
  const triggerScreenshotAlert = () => {
    const settings = (chat as any)?.settings || {};
    if (settings.screenshotProtection === false) return;

    setScreenshotAlert(true);
    addToast('⚠️ INCOGNITO SCREENSHOT ATTEMPT DETECTED!', 'error');
    
    if (activeChatId) {
      sendMessage(activeChatId, '[System] Screenshot not allowed');
    }

    // Flash loop sequence simulation
    flashOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 150 }),
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 150 })
    );

    setTimeout(() => setScreenshotAlert(false), 2500);
  };

  const animatedFlashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  // Auto scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages.length]);

  useEffect(() => {
    if (activeChatId) {
      markAsRead(activeChatId);
    }
  }, [activeChatId, chatMessages.length]);

  // Handle typing presence
  useEffect(() => {
    if (!activeChatId) return;
    setTyping(activeChatId, text.length > 0);
  }, [text, activeChatId]);

  const handleSend = () => {
    if (!text.trim() || !activeChatId) return;

    if (editingMessage) {
      editMessage(activeChatId, editingMessage.id, text);
      setEditingMessage(null);
    } else {
      sendMessage(activeChatId, text, { replyToId: replyingTo?.id });
    }

    setText('');
    setReplyingTo(null);
    if (activeChatId) setTyping(activeChatId, false);
    scrollToBottom();
  };

  const handleEdit = (msg: Message) => {
    setEditingMessage(msg);
    setText(msg.text || '');
    setReplyingTo(null);
  };

  const handleScheduleMessage = () => {
    if (!text.trim() || !activeChatId) return;
    sendMessage(activeChatId, text, {
      schedule: { title: 'Reminder: ' + text, time: 'Tomorrow at 9:00 AM' },
      replyToId: replyingTo?.id
    });
    addToast('Message scheduled', 'success');
    setText('');
    setReplyingTo(null);
    setShowSchedulePicker(false);
  };

  const handleAttachmentSelect = (type: string) => {
    switch (type) {
      case 'camera':
        setIsCameraOpen(true);
        break;
      case 'document':
      case 'photo':
        // Connect this to your React Native DocumentPicker or ImagePicker package
        Alert.alert("Attachment Triggered", `Launch native native pickers for ${type}`);
        break;
      case 'location':
        if (activeChatId) {
          sendMessage(activeChatId, '', {
            location: { lat: 23.1793, lng: 75.7849, address: 'Current Location' },
            replyToId: replyingTo?.id
          });
          setReplyingTo(null);
          addToast('Location sent', 'success');
        }
        break;
      case 'schedule':
        setShowSchedulePicker(true);
        break;
      case 'contact':
        setIsShareContactOpen(true);
        break;
      default:
        addToast(`Feature coming soon`, 'info');
    }
  };

  const handleAudioStop = async (audioUrl?: string) => {
    setIsRecordingAudio(false);
    if (audioUrl && activeChatId) {
      try {
        // Direct handling of local file path URI in React Native
        const url = await uploadFile({ uri: audioUrl, name: `voice-${Date.now()}.webm`, type: 'audio/webm' });
        sendMessage(activeChatId, '', { audioUrl: url, replyToId: replyingTo?.id });
        setReplyingTo(null);
        addToast('Voice message sent', 'success');
      } catch (err) {
        addToast('Failed to send voice message', 'error');
      }
    }
  };

  const handleCameraCapture = async (mediaUrl: string, type: 'photo' | 'video') => {
    if (activeChatId) {
      try {
        const fileData = {
          uri: mediaUrl,
          name: `camera-${Date.now()}.${type === 'photo' ? 'jpg' : 'webm'}`,
          type: type === 'photo' ? 'image/jpeg' : 'video/webm'
        };
        const url = await uploadFile(fileData);
        if (type === 'photo') {
          sendMessage(activeChatId, '', { imageUrl: url, replyToId: replyingTo?.id });
        } else {
          sendMessage(activeChatId, '', { videoUrl: url, replyToId: replyingTo?.id });
        }
        setReplyingTo(null);
        addToast(`${type === 'photo' ? 'Photo' : 'Video'} sent`, 'success');
      } catch (err) {
        addToast('Capture upload failed', 'error');
      }
    }
  };

  const handleMediaClick = (msg: Message) => {
    const allMedia = chatMessages
      .filter(m => m.imageUrl || m.videoUrl)
      .map(m => ({
        id: m.id,
        url: (m.imageUrl || m.videoUrl) as string,
        type: m.imageUrl ? 'image' as const : 'video' as const
      }));

    const clickedIndex = allMedia.findIndex(m => m.id === msg.id);
    if (clickedIndex !== -1) {
      setGalleryMedia(allMedia);
      setGalleryInitialIndex(clickedIndex);
      setIsGalleryOpen(true);
    }
  };

  const filteredMessages = useMemo(() => {
    return chatMessages.filter(m => !searchQuery || m.text?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [chatMessages, searchQuery]);

  const isSecret = chat.isSecret;

  // Render Sub-components to keep clean architecture
  const renderSkeletonBubble = (isMe: boolean, index: number) => (
    <View key={index} style={[styles.skeletonContainer, isMe ? styles.alignEnd : styles.alignStart]}>
      <View style={[styles.skeletonBubble, isMe ? styles.bgMeSkeleton : styles.bgOtherSkeleton]}>
        <View style={styles.skeletonLineLong} />
        <View style={styles.skeletonLineShort} />
      </View>
    </View>
  );

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[styles.container, isSecret ? styles.bgSecret : styles.bgNormal]}>
      
      {/* Screenshot Flash Layer */}
      {screenshotAlert && (
        <Animated.View style={[styles.flashAlertContainer, animatedFlashStyle]}>
          <View style={styles.flashAlertCard}>
            <Text style={styles.flashEmoji}>⚠️</Text>
            <Text style={styles.flashTitle}>SCREENSHOT DETECTED</Text>
            <Text style={styles.flashSubtitle}>Incognito security protocols triggered. Warning notification sent.</Text>
          </View>
        </Animated.View>
      )}

      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }, isSecret ? styles.headerSecret : styles.headerNormal]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeftContainer}>
            <TouchableOpacity onPress={onBack} style={styles.headerIconButton}>
              <ArrowLeft size={24} color={isSecret ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                if (chat.isGroup) setIsGroupInfoOpen(true);
                else if (chat.isSecret) setIsSecretInfoOpen(true);
                else {
                  const id = targetUserId || chat.participantIds?.find(uid => uid !== currentUser?.id) || chat.id;
                  setActiveContactId(id);
                  onNavigate('contact-profile');
                }
              }} 
              style={styles.avatarWrapper}
            >
              {chat.isGroup ? (
                <View style={[styles.groupAvatar, isSecret ? styles.groupAvatarSecret : styles.groupAvatarNormal]}>
                  <Users size={20} color={isSecret ? '#60a5fa' : '#0057bd'} />
                </View>
              ) : (
                <Image source={{ uri: chat.avatar }} style={styles.userAvatar} />
              )}
              <View style={[styles.statusDot, isSecret ? styles.dotSecret : styles.dotNormal]} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                if (chat.isGroup) setIsGroupInfoOpen(true);
                else if (chat.isSecret) setIsSecretInfoOpen(true);
                else {
                  const id = targetUserId || chat.participantIds?.find(uid => uid !== currentUser?.id) || chat.id;
                  setActiveContactId(id);
                  onNavigate('contact-profile');
                }
              }}
              style={styles.headerInfoText}
            >
              <Text style={[styles.chatName, isSecret ? styles.textLight : styles.textDark]}>
                {isSecret && <Lock size={14} color="#60a5fa" />} {chat.name}
              </Text>
              <Text style={[styles.chatStatus, isSecret ? styles.statusSecret : styles.statusNormal]}>
                {isSecret ? '🔒 Incognito Session' : 'online now'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerRightContainer}>
            <TouchableOpacity onPress={() => startCall(chat.id, chat.name || '', chat.avatar || '', 'VIDEO')} style={styles.headerIconButton}>
              <Video size={20} color={isSecret ? '#94a3b8' : '#0891b2'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => startCall(chat.id, chat.name || '', chat.avatar || '', 'VOICE')} style={styles.headerIconButton}>
              <Phone size={20} color={isSecret ? '#94a3b8' : '#0891b2'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowHeaderMenu(!showHeaderMenu)} style={styles.headerIconButton}>
              <MoreVertical size={20} color={isSecret ? '#94a3b8' : '#0891b2'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Field Dropdown */}
        {isSearchOpen && (
          <Animated.View entering={SlideInUp} exiting={FadeOut} style={styles.searchBarContainer}>
            <Search size={16} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search in chat..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => { setIsSearchOpen(false); setSearchQuery(''); }}>
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Main Messages Dynamic Stream */}
      <ScrollView 
        ref={scrollRef}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.dateStampContainer}>
          <View style={styles.dateStampBadge}>
            <Text style={styles.dateStampText}>Today, Oct 24</Text>
          </View>
        </View>

        {isLoadingMessages ? (
          [0, 1, 2, 3, 4].map((i) => renderSkeletonBubble(i % 3 === 0, i))
        ) : (
          filteredMessages.map((msg) => {
            if (msg.text?.startsWith('[System] 🔒 Secret Chat Request:::')) {
              const secretChatId = msg.text.split(':::')[1];
              const isSender = msg.senderId === currentUser?.id;
              
              return (
                <View key={msg.id} style={styles.secretRequestContainer}>
                  <View style={styles.secretRequestCard}>
                    <View style={styles.secretLockBadge}>
                      <Lock size={24} color="#3b82f6" />
                    </View>
                    <Text style={styles.secretRequestTitle}>Secret Chat Request</Text>
                    <Text style={styles.secretRequestDesc}>
                      {isSender 
                        ? 'Waiting for the other user to accept your request to start an end-to-end encrypted session.'
                        : 'Wants to start an end-to-end encrypted secret chat with you.'}
                    </Text>
                    {!isSender && (
                      <View style={styles.secretActionRow}>
                        <TouchableOpacity 
                          style={styles.secretAcceptBtn}
                          onPress={async () => {
                            await handleSecretChatInvitation(secretChatId, 'accept');
                            setActiveChatId(secretChatId);
                          }}
                        >
                          <Text style={styles.btnTextLight}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.secretDeclineBtn}
                          onPress={() => handleSecretChatInvitation(secretChatId, 'decline')}
                        >
                          <Text style={styles.btnTextDark}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            }

            return (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMe={msg.senderId === currentUser?.id}
                onReply={setReplyingTo}
                onEdit={handleEdit}
                replyMessage={msg.replyToId ? chatMessages.find(m => m.id === msg.replyToId) : undefined}
                onMediaClick={handleMediaClick}
                isSecret={chat.isSecret}
              />
            );
          })
        )}

        {/* Dynamic Typing Indicator */}
        {typingInThisChat.length > 0 && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>
              {typingInThisChat.length === 1 ? `${typingInThisChat[0]} is typing...` : 'People are typing...'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action / Dropdown Header Menu Context */}
      <Modal visible={showHeaderMenu} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowHeaderMenu(false)}>
          <View style={[styles.menuDropdown, { top: insets.top + 60 }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowHeaderMenu(false); if (chat.isGroup) setIsGroupInfoOpen(true); }}>
              {chat.isGroup ? <Users size={16} color="#475569" /> : <User size={16} color="#475569" />}
              <Text style={styles.menuItemText}>{chat.isGroup ? 'Group Info' : 'View Profile'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSearchOpen(true); setShowHeaderMenu(false); }}>
              <Search size={16} color="#475569" /><Text style={styles.menuItemText}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setIsShareContactOpen(true); setShowHeaderMenu(false); }}>
              <Share2 size={16} color="#475569" /><Text style={styles.menuItemText}>Share Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.deleteItem]} onPress={() => { setShowHeaderMenu(false); addToast('Chat history cleared', 'success'); }}>
              <Trash2 size={16} color="#ef4444" /><Text style={[styles.menuItemText, styles.deleteItemText]}>Delete Chat</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Footer System Dock Container */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.footerWrapper, { paddingBottom: insets.bottom + 10 }]}
      >
        {isPrivateRestricted ? (
          <View style={styles.restrictedContainer}>
            <View style={styles.restrictedRow}>
              <Lock size={14} color="#3b82f6" />
              <Text style={styles.restrictedText}>This account is private</Text>
            </View>
            {isRequested ? (
              <View style={styles.pendingButton}><Text style={styles.pendingText}>Follow Request Pending</Text></View>
            ) : (
              <TouchableOpacity style={styles.followButton} onPress={() => followUser(targetUser!.id)}>
                <UserPlus size={16} color="#fff" />
                <Text style={styles.followBtnText}>Follow to Message</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : chat.isSecret && !(chat as any)?.settings?.isVerified ? (
          <View style={styles.restrictedContainer}>
            <Lock size={20} color="#3b82f6" />
            <Text style={styles.restrictedTextTitle}>Chat Locked — Verification Required</Text>
            <Text style={styles.restrictedTextSub}>Both participants must verify identity first.</Text>
          </View>
        ) : (
          <View style={styles.inputContainerRow}>
            {/* Context Reply/Edit bars */}
            {editingMessage && (
              <Animated.View entering={SlideInDown} style={styles.contextBar}>
                <View style={styles.contextLine} />
                <View style={styles.contextInfo}>
                  <Text style={styles.contextTitle}>Edit Message</Text>
                  <Text numberOfLines={1} style={styles.contextText}>{editingMessage.text}</Text>
                </View>
                <TouchableOpacity onPress={() => { setEditingMessage(null); setText(''); }}><X size={18} color="#64748b" /></TouchableOpacity>
              </Animated.View>
            )}

            <TouchableOpacity 
              onPress={() => setIsAttachmentPickerOpen(!isAttachmentPickerOpen)}
              style={[styles.plusButton, isAttachmentPickerOpen ? styles.plusButtonActive : styles.plusButtonInactive]}
            >
              <Plus size={24} color="#fff" style={{ transform: [{ rotate: isAttachmentPickerOpen ? '45deg' : '0deg' }] }} />
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.textInput, isSecret ? styles.inputSecret : styles.inputNormal]}
                placeholder={`Message ${chat.name}...`}
                placeholderTextColor={isSecret ? '#475569' : '#94a3b8'}
                value={text}
                onChangeText={setText}
                multiline
              />
              <TouchableOpacity style={styles.smileButton}>
                <Smile size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={text.trim() ? handleSend : () => setIsRecordingAudio(true)}
              style={styles.sendButtonCircle}
            >
              {text.trim() ? <CheckCheck size={20} color="#fff" /> : <Mic size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Embedded Native Screens Modals */}
      <MediaAttachmentPicker isOpen={isAttachmentPickerOpen} onClose={() => setIsAttachmentPickerOpen(false)} onSelect={handleAttachmentSelect} />
      <AudioRecorderUI isRecording={isRecordingAudio} onStop={handleAudioStop} onCancel={() => setIsRecordingAudio(false)} />
      <CameraUI isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCameraCapture} />
      {isGalleryOpen && <MediaGallery items={galleryMedia} initialIndex={galleryInitialIndex} onClose={() => setIsGalleryOpen(false)} />}
      {isGroupInfoOpen && chat.isGroup && <GroupInfoScreen chat={chat} onBack={() => setIsGroupInfoOpen(false)} onNavigate={onNavigate} />}
      {isSecretInfoOpen && chat.isSecret && <SecretChatInfoScreen chat={chat} onBack={() => setIsSecretInfoOpen(false)} />}
      <ShareContactModal isOpen={isShareContactOpen} onClose={() => setIsShareContactOpen(false)} appContext={{ chats, currentUser }} onShare={(contactId) => {
         const contact = contacts.find(c => c.id === contactId);
         if (contact && activeChatId) {
           sendMessage(activeChatId, '', { contact: { name: contact.name || 'User', phone: contact.phone || '+1 234', avatar: contact.avatar } });
           addToast('Contact shared', 'success');
         }
      }} />

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgSecret: { backgroundColor: '#0a0f14' },
  bgNormal: { backgroundColor: '#e0f2fe' }, // matching aqua-depth aesthetic
  textLight: { color: '#f1f5f9' },
  textDark: { color: '#0f172a' },
  
  // Flash system styles
  flashAlertContainer: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(220,38,38,0.4)', zIndex: 9999, justifyContent: 'center', alignItems: 'center' },
  flashAlertCard: { backgroundColor: '#000', padding: 24, borderRadius: 24, width: '80%', alignItems: 'center', borderWidth: 2, borderColor: '#ef4444' },
  flashEmoji: { fontSize: 36, marginBottom: 8 },
  flashTitle: { color: '#ef4444', fontWeight: '900', fontSize: 18, letterSpacing: 1.5 },
  flashSubtitle: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontSize: 12, marginTop: 6 },

  // Header styles
  header: { borderBottomWidth: 1, paddingHorizontal: 16, paddingBottom: 12 },
  headerSecret: { backgroundColor: 'rgba(10,15,20,0.95)', borderColor: '#1e293b' },
  headerNormal: { backgroundColor: 'rgba(248,250,252,0.8)', borderColor: 'rgba(255,255,255,0.2)' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 56 },
  headerLeftContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerRightContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconButton: { padding: 6, borderRadius: 99 },
  avatarWrapper: { position: 'relative', marginLeft: 6 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  groupAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  groupAvatarSecret: { backgroundColor: '#0a0f14', borderColor: '#334155' },
  groupAvatarNormal: { backgroundColor: '#f1f5f9', borderColor: '#fff' },
  statusDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  dotSecret: { backgroundColor: '#3b82f6', borderColor: '#0a0f14' },
  dotNormal: { backgroundColor: '#22c55e', borderColor: '#fff' },
  headerInfoText: { marginLeft: 10, justifyContent: 'center' },
  chatName: { fontSize: 16, fontWeight: '700' },
  chatStatus: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  statusSecret: { color: '#60a5fa' },
  statusNormal: { color: '#0891b2' },

  // Dropdown floating context menu
  modalOverlay: { flex: 1, backgroundColor: 'transparent' },
  menuDropdown: { position: 'absolute', right: 16, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 6, width: 180, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, gap: 10 },
  menuItemText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  deleteItem: { backgroundColor: 'rgba(239,68,68,0.05)' },
  deleteItemText: { color: '#ef4444' },

  // Search Engine input style
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12, paddingHorizontal: 12, height: 40, marginTop: 8 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a' },

  // List Messaging Stream
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  dateStampContainer: { alignItems: 'center', marginVertical: 16 },
  dateStampBadge: { backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  dateStampText: { fontSize: 11, fontWeight: '600', color: '#64748b' },

  // Secret Invitation Requests cards layout
  secretRequestContainer: { alignItems: 'center', marginVertical: 12 },
  secretRequestCard: { backgroundColor: '#fff', width: '100%', maxWidth: 320, padding: 16, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  secretLockBadge: { backgroundColor: 'rgba(59,130,246,0.1)', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  secretRequestTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  secretRequestDesc: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 16, paddingHorizontal: 6 },
  secretActionRow: { flexDirection: 'row', gap: 8, width: '100%' },
  secretAcceptBtn: { flex: 1, backgroundColor: '#2563eb', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  secretDeclineBtn: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  btnTextLight: { color: '#fff', fontWeight: '600' },
  btnTextDark: { color: '#334155', fontWeight: '600' },

  // Skeleton UI styles
  skeletonContainer: { width: '85%', marginVertical: 6 },
  alignEnd: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  alignStart: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  skeletonBubble: { padding: 16, borderRadius: 16, width: 200 },
  bgMeSkeleton: { backgroundColor: 'rgba(0,87,189,0.1)' },
  bgOtherSkeleton: { backgroundColor: 'rgba(255,255,255,0.4)' },
  skeletonLineLong: { height: 12, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 6, width: '80%', marginBottom: 8 },
  skeletonLineShort: { height: 12, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 6, width: '50%' },

  // Typing state component
  typingContainer: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 6 },
  typingText: { fontSize: 13, color: '#64748b', fontWeight: '500' },

  // System Dock System Styles
  footerWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16 },
  inputContainerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  plusButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  plusButtonActive: { backgroundColor: '#2563eb' },
  plusButtonInactive: { backgroundColor: 'rgba(0,0,0,0.7)' },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingHorizontal: 12, height: 48 },
  inputSecret: { backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#e2e8f0' },
  inputNormal: { backgroundColor: '#fff', color: '#0f172a' },
  textInput: { flex: 1, height: '100%', fontSize: 15, paddingRight: 36 },
  smileButton: { position: 'absolute', right: 12 },
  sendButtonCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0057bd', justifyContent: 'center', alignItems: 'center' },

  // Reply contextual banner
  contextBar: { position: 'absolute', bottom: 60, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderColor: '#0057bd' },
  contextLine: { width: 4, height: '100%', borderRadius: 2 },
  contextInfo: { flex: 1, marginLeft: 8 },
  contextTitle: { fontSize: 12, fontWeight: '700', color: '#0057bd' },
  contextText: { fontSize: 13, color: '#475569' },

  // Restrictions States Styles
  restrictedContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  restrictedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  restrictedText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  followButton: { backgroundColor: '#0057bd', flexDirection: 'row', width: '100%', height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12 },
  followBtnText: { color: '#fff', fontWeight: '700' },
  pendingButton: { backgroundColor: '#f1f5f9', width: '100%', height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  pendingText: { color: '#64748b', fontWeight: '600' },
  restrictedTextTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginTop: 6 },
  restrictedTextSub: { fontSize: 12, color: '#64748b', marginTop: 2 }
});