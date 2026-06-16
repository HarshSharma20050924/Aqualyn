import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, TextInput, Platform, Modal, TouchableWithoutFeedback } from 'react-native';
import { useAppContext } from '../../src/context/AppContext';
import { Theme } from '../../src/config/theme';
import { Search, Plus, Archive, Edit2, Check, X, Pin, Volume2, VolumeX, Trash2, MessageCircle, MessageSquare, Info } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Chat } from '../../src/types';
import { useRouter } from 'expo-router';

export default function ChatListScreen() {
  const { chats, setActiveChatId, archiveChat, pinChat, muteChat, deleteChat } = useAppContext();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [previewChat, setPreviewChat] = useState<Chat | null>(null);

  const toggleSelection = (chatId: string) => {
    setSelectedChats(prev => {
      const isSelected = prev.includes(chatId);
      const updated = isSelected ? prev.filter(id => id !== chatId) : [...prev, chatId];
      if (updated.length === 0) {
        setIsSelectionMode(false);
      } else {
        setIsSelectionMode(true);
      }
      return updated;
    });
  };

  const handleArchiveSelected = () => {
    selectedChats.forEach(id => archiveChat(id));
    setIsSelectionMode(false);
    setSelectedChats([]);
  };

  const handlePinSelected = () => {
    selectedChats.forEach(id => pinChat(id));
    setIsSelectionMode(false);
    setSelectedChats([]);
  };

  const handleMuteSelected = () => {
    selectedChats.forEach(id => muteChat(id));
    setIsSelectionMode(false);
    setSelectedChats([]);
  };

  const handleDeleteSelected = () => {
    selectedChats.forEach(id => deleteChat(id));
    setIsSelectionMode(false);
    setSelectedChats([]);
  };

  const filteredChats = chats.filter((c: Chat) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChatItem = ({ item }: { item: Chat }) => {
    const isSelected = selectedChats.includes(item.id);
    
    return (
      <TouchableOpacity 
        style={[styles.chatItem, isSelected && styles.chatItemSelected]}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelection(item.id);
          } else {
            setActiveChatId(item.id);
          }
        }}
        onLongPress={() => toggleSelection(item.id)}
        delayLongPress={300}
      >
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => {
            if (isSelectionMode) {
              toggleSelection(item.id);
            } else {
              setPreviewChat(item);
            }
          }}
          style={styles.avatarContainer}
        >
          <Image source={{ uri: item.avatar }} style={styles.chatAvatar} />
          {isSelected && (
            <View style={styles.checkmarkOverlay}>
              <Check size={18} color="#fff" strokeWidth={3} />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.chatTime}>{item.lastMessageTime}</Text>
          </View>
          <View style={styles.chatFooter}>
            <Text style={styles.chatMessage} numberOfLines={1}>{item.lastMessage}</Text>
            {!isSelected && !!item.unreadCount && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {isSelectionMode ? (
        <View style={[styles.header, { backgroundColor: Theme.colors.surfaceContainer }]}>
          <View style={styles.headerSelectionLeft}>
            <TouchableOpacity style={styles.iconButton} onPress={() => { setIsSelectionMode(false); setSelectedChats([]); }}>
              <X size={24} color={Theme.colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.headerSelectionTitle}>Select Chats</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={handleArchiveSelected}>
              <Archive size={22} color={Theme.colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handlePinSelected}>
              <Pin size={22} color={Theme.colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleMuteSelected}>
              <Volume2 size={22} color={Theme.colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleDeleteSelected}>
              <Trash2 size={22} color={Theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="light" style={styles.header}>
            <Text style={styles.headerTitle}>Messages</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Edit2 size={22} color={Theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
          </BlurView>
        ) : (
          <View style={[styles.header, { backgroundColor: Theme.colors.surface }]}>
            <Text style={styles.headerTitle}>Messages</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Edit2 size={22} color={Theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
          </View>
        )
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Theme.colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor={Theme.colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MessageCircle size={48} color={Theme.colors.surfaceVariant} />
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Plus size={24} color={Theme.colors.onPrimary} />
      </TouchableOpacity>

      {/* Profile Picture Preview Modal */}
      <Modal
        visible={previewChat !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewChat(null)}
      >
        <TouchableWithoutFeedback onPress={() => setPreviewChat(null)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={1}>{previewChat?.name}</Text>
                </View>
                <Image 
                  source={{ uri: previewChat?.avatar }} 
                  style={styles.modalImage} 
                  resizeMode="cover"
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.modalActionButton}
                    onPress={() => {
                      if (previewChat) {
                        setActiveChatId(previewChat.id);
                        setPreviewChat(null);
                      }
                    }}
                  >
                    <MessageSquare size={22} color={Theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalActionButton}
                    onPress={() => {
                      if (previewChat) {
                        alert(`Info:\nName: ${previewChat.name}\nDescription: ${previewChat.description || 'No description'}`);
                      }
                    }}
                  >
                    <Info size={22} color={Theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.onSurface,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: Theme.spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainer,
    borderRadius: Theme.radii.lg,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Theme.spacing.sm,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Theme.spacing.md,
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  chatInfo: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceContainer,
    paddingBottom: Theme.spacing.sm,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.onSurface,
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  unreadBadge: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: Theme.colors.onPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: Theme.spacing.md,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  chatItemSelected: {
    backgroundColor: Theme.colors.surfaceContainer,
  },
  checkmarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 87, 189, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSelectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSelectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.onSurface,
    marginLeft: Theme.spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 260,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  modalHeader: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.onSurface,
  },
  modalImage: {
    width: 260,
    height: 260,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xs,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.surfaceContainer,
  },
  modalActionButton: {
    padding: Theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
});
