import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, FlatList, KeyboardAvoidingView, Platform, Modal, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Video, Phone, MoreVertical, Plus, Smile, Mic, CheckCheck, Users, X, Clock, Lock, Search, Download, Trash2, Edit2, Share2, User, MapPin, Wallet } from 'lucide-react-native';
import { useAppContext } from '../../src/context/AppContext';
import { useCall } from '../../src/context/CallContext';
import { MessageBubble } from '../../src/components/MessageBubble';
import { Theme } from '../../src/config/theme';
import { apiFetch } from '../../src/utils/fetcher';
import { ENDPOINTS } from '../../src/config/api';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { 
    messages, setMessages, sendMessage, editMessage, deleteMessage, 
    currentUser, chats, addToast, setActiveChatId, setActiveContactId, 
    globalUsers, typingUsers, setTyping, markAsRead 
  } = useAppContext();

  const { startCall } = useCall();
  const [text, setText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const chat = chats.find((c: any) => c.id === id);
  const chatMessages = id ? (messages[id as string] || []) : [];
  const typingInThisChat = typingUsers[id as string] || [];
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    if (id) {
      markAsRead(id as string);
    }
  }, [id, chatMessages.length]);

  useEffect(() => {
    if (id && (!messages[id as string] || messages[id as string].length === 0)) {
      setIsLoadingMessages(true);
      const fetchHistory = async () => {
        try {
          const res = await apiFetch(ENDPOINTS.CHAT_MESSAGES(id as string));
          if (res.ok) {
            const data = await res.json();
            setMessages((prev: any) => ({ ...prev, [id as string]: data }));
          }
        } catch (e) {
          console.error("Failed to fetch history:", e);
        } finally {
          setIsLoadingMessages(false);
        }
      };
      fetchHistory();
    }
  }, [id, messages]);

  useEffect(() => {
    if (!id) return;
    if (text.length > 0) {
      setTyping(id as string, true);
    } else {
      setTyping(id as string, false);
    }
  }, [text, id]);

  if (!chat) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Chat not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSend = () => {
    if (!text.trim() || !id) return;

    if (editingMessage) {
      editMessage(id as string, editingMessage.id, text);
      setEditingMessage(null);
    } else {
      sendMessage(id as string, text, { replyToId: replyingTo?.id });
    }

    setText('');
    setReplyingTo(null);
    setTyping(id as string, false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleEdit = (msg: any) => {
    setEditingMessage(msg);
    setText(msg.text || '');
    setReplyingTo(null);
  };

  const handleAttachmentSelect = (type: string) => {
    setIsAttachmentOpen(false);
    switch (type) {
      case 'location':
        sendMessage(id as string, '', {
          location: { lat: 37.7749, lng: -122.4194, address: 'San Francisco, CA' },
          replyToId: replyingTo?.id
        });
        addToast('Mock location sent', 'success');
        break;
      case 'wallet':
        sendMessage(id as string, '', {
          wallet: { asset: 'ETH', amount: 0.05, address: '0x71C...3a42', type: 'request' },
          replyToId: replyingTo?.id
        });
        addToast('Wallet request sent', 'success');
        break;
      case 'photo':
        sendMessage(id as string, '', {
          imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
          replyToId: replyingTo?.id
        });
        addToast('Photo sent', 'success');
        break;
      case 'audio':
        sendMessage(id as string, '', {
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          replyToId: replyingTo?.id
        });
        addToast('Voice message sent', 'success');
        break;
      default:
        addToast(`${type} attachment coming soon`, 'info');
    }
  };

  const filteredMessages = useMemo(
    () => chatMessages.filter((m: any) =>
      !searchQuery || m.text?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [chatMessages, searchQuery]
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, chat.isSecret && styles.containerSecret]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* HEADER */}
      <View style={[styles.header, chat.isSecret && styles.headerSecret]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft size={24} color={chat.isSecret ? '#94a3b8' : 'white'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => {
              if (chat.isGroup) {
                router.push({ pathname: '/group-info', params: { id: chat.id } });
              } else if (chat.isSecret) {
                router.push({ pathname: '/secret-chat-info', params: { id: chat.id } });
              } else {
                const targetId = chat.participantIds?.find((id: string) => id !== currentUser?.id);
                setActiveContactId(targetId || null);
                router.push(`/contact-profile`);
              }
            }}
          >
            {chat.isGroup ? (
              <View style={styles.groupAvatar}>
                <Users size={20} color="white" />
              </View>
            ) : (
              <Image source={{ uri: chat.avatar }} style={styles.avatar} />
            )}
            <View style={styles.onlineDot} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.headerInfo}
            onPress={() => {
              if (chat.isGroup) {
                router.push({ pathname: '/group-info', params: { id: chat.id } });
              } else if (chat.isSecret) {
                router.push({ pathname: '/secret-chat-info', params: { id: chat.id } });
              } else {
                const targetId = chat.participantIds?.find((id: string) => id !== currentUser?.id);
                setActiveContactId(targetId || null);
                router.push(`/contact-profile`);
              }
            }}
          >
            <Text style={[styles.chatName, chat.isSecret && styles.chatNameSecret]}>
              {chat.isSecret && <Lock size={14} color="#3b82f6" />} {chat.name}
            </Text>
            <Text style={[styles.chatStatus, chat.isSecret && styles.chatStatusSecret]}>
              {chat.isSecret ? '🔒 Incognito Session' : 'online now'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => startCall(chat.id, chat.name, chat.avatar, 'VIDEO')} 
            style={styles.iconButton}
          >
            <Video size={20} color={chat.isSecret ? '#94a3b8' : 'white'} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => startCall(chat.id, chat.name, chat.avatar, 'VOICE')} 
            style={styles.iconButton}
          >
            <Phone size={20} color={chat.isSecret ? '#94a3b8' : 'white'} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowHeaderMenu(!showHeaderMenu)} 
            style={styles.iconButton}
          >
            <MoreVertical size={20} color={chat.isSecret ? '#94a3b8' : 'white'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {isSearchOpen && (
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity onPress={() => { setIsSearchOpen(false); setSearchQuery(''); }}>
            <X size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      )}

      {/* Header Dropdown Menu */}
      {showHeaderMenu && (
        <Modal transparent={true} visible={true} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setShowHeaderMenu(false)}>
            <View style={styles.menuDropdown}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowHeaderMenu(false);
                  if (chat.isGroup) {
                    router.push({ pathname: '/group-info', params: { id: chat.id } });
                  } else {
                    const targetId = chat.participantIds?.find((id: string) => id !== currentUser?.id);
                    setActiveContactId(targetId || null);
                    router.push(`/contact-profile`);
                  }
                }}
              >
                <User size={16} color="white" />
                <Text style={styles.menuItemText}>{chat.isGroup ? 'Group Info' : 'View Profile'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSearchOpen(true); setShowHeaderMenu(false); }}>
                <Search size={16} color="white" />
                <Text style={styles.menuItemText}>Search</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowHeaderMenu(false); addToast('Chat exported', 'success'); }}>
                <Download size={16} color="white" />
                <Text style={styles.menuItemText}>Export Chat</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity 
                style={[styles.menuItem, styles.deleteItem]}
                onPress={() => {
                  setShowHeaderMenu(false);
                  addToast('Chat deleted', 'success');
                  router.back();
                }}
              >
                <Trash2 size={16} color="#ef4444" />
                <Text style={styles.menuItemTextDelete}>Delete Chat</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* MESSAGES VIEW */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesListContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {isLoadingMessages ? (
          <Text style={styles.loadingText}>Loading history...</Text>
        ) : filteredMessages.length === 0 ? (
          <Text style={styles.noMessagesText}>No messages yet. Say hello!</Text>
        ) : (
          filteredMessages.map((msg: any) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMe={msg.senderId === currentUser?.id}
              onReply={setReplyingTo}
              onEdit={handleEdit}
              isSecret={chat.isSecret}
            />
          ))
        )}

        {typingInThisChat.length > 0 && (
          <Text style={styles.typingIndicator}>
            {typingInThisChat.join(', ')} is typing...
          </Text>
        )}
      </ScrollView>

      {/* Replying Status */}
      {replyingTo && (
        <View style={styles.replyingBar}>
          <View style={styles.replyingInfo}>
            <Text style={styles.replyingTitle}>Replying to message</Text>
            <Text style={styles.replyingText} numberOfLines={1}>{replyingTo.text || 'Attachment'}</Text>
          </View>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <X size={18} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Editing Status */}
      {editingMessage && (
        <View style={styles.replyingBar}>
          <View style={styles.replyingInfo}>
            <Text style={styles.replyingTitle}>Editing message</Text>
            <Text style={styles.replyingText} numberOfLines={1}>{editingMessage.text}</Text>
          </View>
          <TouchableOpacity onPress={() => { setEditingMessage(null); setText(''); }}>
            <X size={18} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* INPUT BAR */}
      <View style={[styles.inputBar, chat.isSecret && styles.inputBarSecret]}>
        <TouchableOpacity 
          onPress={() => setIsAttachmentOpen(!isAttachmentOpen)} 
          style={styles.attachmentButton}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder={chat.isSecret ? "Send secret message..." : "Type a message..."}
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
        />

        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>{editingMessage ? 'Save' : 'Send'}</Text>
        </TouchableOpacity>
      </View>

      {/* Attachments Modal Drawer */}
      {isAttachmentOpen && (
        <Modal transparent={true} visible={true} animationType="slide">
          <Pressable style={styles.modalOverlay} onPress={() => setIsAttachmentOpen(false)}>
            <View style={styles.attachmentDrawer}>
              <Text style={styles.drawerTitle}>Send Attachment</Text>
              <View style={styles.drawerGrid}>
                <TouchableOpacity style={styles.drawerItem} onPress={() => handleAttachmentSelect('photo')}>
                  <View style={[styles.drawerIconBg, { backgroundColor: '#3b82f6' }]}>
                    <Plus size={20} color="white" />
                  </View>
                  <Text style={styles.drawerItemText}>Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerItem} onPress={() => handleAttachmentSelect('audio')}>
                  <View style={[styles.drawerIconBg, { backgroundColor: '#ef4444' }]}>
                    <Mic size={20} color="white" />
                  </View>
                  <Text style={styles.drawerItemText}>Audio</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerItem} onPress={() => handleAttachmentSelect('location')}>
                  <View style={[styles.drawerIconBg, { backgroundColor: '#22c55e' }]}>
                    <MapPin size={20} color="white" />
                  </View>
                  <Text style={styles.drawerItemText}>Location</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerItem} onPress={() => handleAttachmentSelect('wallet')}>
                  <View style={[styles.drawerIconBg, { backgroundColor: '#eab308' }]}>
                    <Wallet size={20} color="white" />
                  </View>
                  <Text style={styles.drawerItemText}>Wallet Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  containerSecret: {
    backgroundColor: '#020617',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a192f',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
  headerSecret: {
    backgroundColor: '#0f172a',
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconButton: {
    padding: 8,
    borderRadius: 9999,
  },
  avatarContainer: {
    position: 'relative',
    marginLeft: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    backgroundColor: '#10b981',
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#0a192f',
  },
  headerInfo: {
    marginLeft: 10,
    flex: 1,
  },
  chatName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatNameSecret: {
    color: '#e2e8f0',
  },
  chatStatus: {
    color: '#0ea5e9',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  chatStatusSecret: {
    color: '#3b82f6',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 20,
  },
  noMessagesText: {
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  typingIndicator: {
    color: '#0ea5e9',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  replyingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  replyingInfo: {
    flex: 1,
    marginRight: 10,
  },
  replyingTitle: {
    color: '#0ea5e9',
    fontSize: 11,
    fontWeight: 'bold',
  },
  replyingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(10, 25, 47, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputBarSecret: {
    backgroundColor: '#0f172a',
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
  },
  attachmentButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
  },
  input: {
    flex: 1,
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 10,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuDropdown: {
    position: 'absolute',
    right: 16,
    top: 90,
    backgroundColor: 'rgb(24, 30, 36)',
    borderRadius: 14,
    padding: 6,
    minWidth: 180,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuItemText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  deleteItem: {
    paddingVertical: 8,
  },
  menuItemTextDelete: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  attachmentDrawer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  drawerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  drawerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 16,
  },
  drawerItem: {
    alignItems: 'center',
    width: 70,
  },
  drawerIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  drawerItemText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
