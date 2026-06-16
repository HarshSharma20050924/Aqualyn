import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  StyleSheet, 
  Dimensions, 
  Platform 
} from 'react-native';
import { 
  X, Camera, Image as ImageIcon, Type, Smile, Music, 
  Send, ChevronLeft, Star, RefreshCw, 
  MapPin, Hash, AtSign, Search, Heart, Check, Settings
} from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

interface Sticker {
  id: string;
  type: 'mention' | 'hashtag' | 'location' | 'gif' | 'emoji';
  content: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export default function StoryCreator({ onClose }: { onClose: () => void }) {
  const { addStory, currentUser, toggleCloseFriend, globalUsers, addToast } = useAppContext();
  const [step, setStep] = useState<'capture' | 'edit' | 'settings'>('capture');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [filter, setFilter] = useState('none');
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [isAddingText, setIsAddingText] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isCloseFriendsOnly, setIsCloseFriendsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const filters = [
    { name: 'Normal', value: 'none' },
    { name: 'Vivid', value: 'vivid' },
    { name: 'B&W', value: 'bw' },
    { name: 'Warm', value: 'warm' },
    { name: 'Cool', value: 'cool' },
  ];

  const handleCapture = () => {
    addToast('Camera hardware capture hook triggered.', 'info');
    setMediaUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe');
    setMediaType('image');
    setStep('edit');
  };

  const handleFileUploadMock = () => {
    setMediaUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe');
    setMediaType('image');
    setStep('edit');
  };

  const handleAddText = () => {
    if (currentText.trim()) {
      setStickers([...stickers, {
        id: Date.now().toString(),
        type: 'emoji', // Treated as text container layout
        content: currentText,
        x: 40,
        y: 40,
        scale: 1,
        rotation: 0
      }]);
      setCurrentText('');
      setIsAddingText(false);
    }
  };

  const handleAddSticker = (type: Sticker['type'], content: string) => {
    setStickers([...stickers, {
      id: Date.now().toString(),
      type,
      content,
      x: 35,
      y: 45,
      scale: 1,
      rotation: 0
    }]);
    setShowStickers(false);
  };

  const handleShare = async () => {
    if (mediaUrl) {
      setIsUploading(true);
      try {
        await addStory({
          mediaUrl: mediaUrl,
          mediaType,
          stickers,
          isCloseFriends: isCloseFriendsOnly,
        });
        onClose();
      } catch (e) {
        addToast('Failed to prepare story media', 'error');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const filteredUsers = globalUsers.filter(u => 
    u.id !== currentUser?.id && 
    ((u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
     (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        
        {/* Navigation Floating Header Overlay */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose}
            style={styles.headerButton}
          >
            <X size={24} color="#FFF" />
          </TouchableOpacity>
          
          {step === 'edit' && (
            <View style={styles.headerActionsTrack}>
              <TouchableOpacity onPress={() => setStep('settings')} style={styles.headerButton}>
                <Settings size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsAddingText(true)} style={styles.headerButton}>
                <Type size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowStickers(true)} style={styles.headerButton}>
                <Smile size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Music size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Dynamic Workflow Engine Steps */}
        {step === 'capture' ? (
          <View style={styles.captureContainer}>
            <View style={styles.opacityContainer}>
              <Camera size={80} color="#FFF" style={styles.cameraIconPlaceholder} />
              <Text style={styles.captureLabel}>Camera Live View</Text>
            </View>
            
            {/* Control Dashboard Overlay */}
            <View style={styles.controls}>
              <TouchableOpacity onPress={handleFileUploadMock} style={styles.sideButton}>
                <ImageIcon size={24} color="#FFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleCapture}
                onLongPress={() => setIsRecording(true)}
                onPressOut={() => setIsRecording(false)}
                style={styles.captureButtonOuter}
              >
                <View style={[
                  styles.captureButtonInner,
                  isRecording ? styles.captureButtonInnerActive : styles.captureButtonInnerInactive
                ]} />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setIsFrontCamera(!isFrontCamera)} style={styles.sideButton}>
                <RefreshCw size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : step === 'edit' ? (
          <View style={styles.editContainer}>
            {mediaUrl && <Image source={{ uri: mediaUrl }} style={[StyleSheet.absoluteFill as any, styles.coverImage as any]} />}
            
            {/* Stickers Render Layer */}
            <View style={StyleSheet.absoluteFill}>
              {stickers.map(sticker => (
                <View key={sticker.id} style={[styles.stickerWrapper, { left: `${sticker.x}%`, top: `${sticker.y}%` }]}>
                  {sticker.type === 'mention' && (
                    <View style={styles.stickerMention}>
                      <AtSign size={14} color="#000" /> 
                      <Text style={styles.stickerMentionText}>{sticker.content}</Text>
                    </View>
                  )}
                  {sticker.type === 'hashtag' && (
                    <View style={styles.stickerHashtag}>
                      <Hash size={14} color="#FFF" /> 
                      <Text style={styles.stickerHashtagText}>{sticker.content}</Text>
                    </View>
                  )}
                  {sticker.type === 'location' && (
                    <View style={styles.stickerLocation}>
                      <MapPin size={14} color="#FFF" /> 
                      <Text style={styles.stickerLocationText}>{sticker.content}</Text>
                    </View>
                  )}
                  {sticker.type === 'emoji' && (
                    <Text style={styles.stickerEmoji}>{sticker.content}</Text>
                  )}
                </View>
              ))}
            </View>

            {/* Filter Carousels */}
            <View style={styles.filterCarousel}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterCarouselContent}>
                {filters.map(f => (
                  <TouchableOpacity key={f.name} onPress={() => setFilter(f.value)} style={styles.filterItem}>
                    <View style={[
                      styles.filterThumbnail,
                      filter === f.value ? styles.filterThumbnailActive : styles.filterThumbnailInactive
                    ]}>
                      {mediaUrl && <Image source={{ uri: mediaUrl }} style={styles.coverImage as any} />}
                    </View>
                    <Text style={styles.filterLabel}>{f.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Bottom Panel Actions */}
            <View style={styles.editActions}>
              <TouchableOpacity onPress={() => setStep('capture')} style={styles.backButton}>
                <ChevronLeft size={24} color="#FFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setIsCloseFriendsOnly(!isCloseFriendsOnly)}
                style={[
                  styles.closeFriendsButton,
                  isCloseFriendsOnly ? styles.closeFriendsButtonActive : styles.closeFriendsButtonInactive
                ]}
              >
                <Star size={20} color="#FFF" />
                <Text style={styles.closeFriendsButtonText}>Close Friends</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleShare}
                disabled={isUploading}
                style={styles.shareButton}
              >
                <Text style={styles.shareButtonText}>{isUploading ? 'Sharing...' : 'Share'}</Text> 
                {isUploading ? <ActivityIndicator size="small" color="#000" /> : <Send size={18} color="#000" />}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Settings Panel Layout Context */
          <View style={styles.settingsContainer}>
            <View style={styles.settingsHeader}>
              <TouchableOpacity onPress={() => setStep('edit')} style={styles.settingsBackButton}>
                <ChevronLeft size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.settingsTitle}>Story Settings</Text>
              <View style={styles.w10} />
            </View>
            
            <ScrollView style={styles.settingsBody} contentContainerStyle={styles.settingsBodyContent}>
              <View style={styles.settingsSection}>
                <Text style={styles.sectionHeader}>Close Friends</Text>
                <View style={styles.searchBar}>
                  <Search size={18} color="#94A3B8" />
                  <TextInput 
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search friends..."
                    placeholderTextColor="#94A3B8"
                    style={styles.searchInput}
                  />
                </View>
                <View style={styles.usersList}>
                  {filteredUsers.map(user => {
                    const isCloseFriend = currentUser?.closeFriends?.includes(user.id);
                    return (
                      <View key={user.id} style={styles.userItem}>
                        <View style={styles.userInfo}>
                          <Image source={{ uri: user.avatar }} style={styles.userAvatar as any} />
                          <View>
                            <Text style={styles.userName}>{user.name || user.displayName || 'User'}</Text>
                            <Text style={styles.userUsername}>@{user.username}</Text>
                          </View>
                        </View>
                        <TouchableOpacity 
                          onPress={() => toggleCloseFriend(user.id)}
                          style={[
                            styles.checkOutline,
                            isCloseFriend ? styles.checkOutlineActive : styles.checkOutlineInactive
                          ]}
                        >
                          {isCloseFriend && <Check size={14} color="#FFF" />}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.settingsSection}>
                <Text style={styles.sectionHeader}>Privacy</Text>
                <View style={styles.privacyItem}>
                  <View>
                    <Text style={styles.privacyText}>Hide story from</Text>
                    <Text style={styles.privacySubtext}>0 people</Text>
                  </View>
                  <ChevronLeft size={20} color="#94A3B8" style={styles.rotateRight} />
                </View>
                <View style={styles.privacyItem}>
                  <View>
                    <Text style={styles.privacyText}>Allow message replies</Text>
                    <Text style={styles.privacySubtext}>Everyone</Text>
                  </View>
                  <ChevronLeft size={20} color="#94A3B8" style={styles.rotateRight} />
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.settingsFooter}>
              <TouchableOpacity onPress={() => setStep('edit')} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Text Input overlay Layer Modal */}
        <Modal visible={isAddingText} transparent animationType="fade">
          <View style={styles.textModalContainer}>
            <TextInput 
              autoFocus
              value={currentText}
              onChangeText={setCurrentText}
              placeholder="Type something..."
              placeholderTextColor="#FFFFFF60"
              style={styles.textModalInput}
            />
            <View style={styles.textModalButtons}>
              <TouchableOpacity onPress={() => setIsAddingText(false)} style={styles.textModalCancel}>
                <Text style={styles.textModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddText} style={styles.textModalConfirm}>
                <Text style={styles.textModalConfirmText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Stickers Menu Sheet Modal */}
        <Modal visible={showStickers} transparent animationType="slide">
          <View style={styles.stickersModalContainer}>
            <View style={styles.stickersModalHeader}>
              <Text style={styles.stickersModalTitle}>Stickers</Text>
              <TouchableOpacity onPress={() => setShowStickers(false)}>
                <X size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.stickerGrid}>
              <TouchableOpacity onPress={() => handleAddSticker('location', 'San Francisco, CA')} style={styles.stickerOptionLocation}>
                <MapPin size={32} color="#60A5FA" />
                <Text style={styles.stickerOptionLocationText}>Location</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleAddSticker('mention', 'alex_rivero')} style={styles.stickerOptionMention}>
                <AtSign size={32} color="#FFF" />
                <Text style={styles.stickerOptionMentionText}>Mention</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleAddSticker('hashtag', 'aqualyn')} style={styles.stickerOptionHashtag}>
                <Hash size={32} color="#F472B6" />
                <Text style={styles.stickerOptionHashtagText}>Hashtag</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stickerOptionMusic}>
                <Heart size={32} color="#FBBF24" />
                <Text style={styles.stickerOptionMusicText}>Music</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.flex1}>
              <Text style={styles.emojisSectionHeader}>Emojis</Text>
              <View style={styles.emojiGrid}>
                {['❤️', '🔥', '😂', '🙌', '✨', '🚀', '🌈', '🍕', '🌊', '🎸', '🎮', '📸'].map(emoji => (
                  <TouchableOpacity key={emoji} onPress={() => handleAddSticker('emoji', emoji)}>
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </Modal>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 32,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionsTrack: {
    flexDirection: 'row',
    gap: 12,
  },
  captureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  opacityContainer: {
    alignItems: 'center',
    opacity: 0.3,
  },
  cameraIconPlaceholder: {
    marginBottom: 16,
  },
  captureLabel: {
    color: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  controls: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  captureButtonInnerActive: {
    backgroundColor: '#ef4444',
    transform: [{ scale: 0.75 }],
    borderRadius: 16,
  },
  captureButtonInnerInactive: {
    backgroundColor: '#ffffff',
  },
  editContainer: {
    flex: 1,
    position: 'relative',
  },
  stickerWrapper: {
    position: 'absolute',
  },
  stickerMention: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  stickerMentionText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  stickerHashtag: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  stickerHashtagText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  stickerLocation: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  stickerLocationText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  stickerEmoji: {
    fontSize: 36,
    color: '#ffffff',
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  filterCarousel: {
    position: 'absolute',
    bottom: 144,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  filterCarouselContent: {
    gap: 16,
  },
  filterItem: {
    alignItems: 'center',
    gap: 8,
  },
  filterThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#27272a',
  },
  filterThumbnailActive: {
    borderColor: '#ffffff',
    transform: [{ scale: 1.05 }],
  },
  filterThumbnailInactive: {
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: -0.2,
  },
  editActions: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeFriendsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 16,
  },
  closeFriendsButtonActive: {
    backgroundColor: '#22c55e',
  },
  closeFriendsButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeFriendsButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
    height: 56,
    borderRadius: 16,
  },
  shareButtonText: {
    color: '#000000',
    fontWeight: '900',
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    flexDirection: 'column',
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
  },
  settingsHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsBackButton: {
    padding: 8,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  w10: {
    width: 40,
  },
  settingsBody: {
    flex: 1,
    paddingHorizontal: 24,
  },
  settingsBodyContent: {
    paddingVertical: 24,
    gap: 32,
  },
  settingsSection: {
    gap: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 16,
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    fontWeight: '600',
    padding: 0,
  },
  usersList: {
    marginTop: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userName: {
    fontWeight: 'bold',
    color: '#0f172a',
    fontSize: 14,
  },
  userUsername: {
    fontSize: 12,
    color: '#64748b',
  },
  checkOutline: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOutlineActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  checkOutlineInactive: {
    borderColor: '#d1d5db',
  },
  privacyItem: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  privacyText: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  privacySubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  rotateRight: {
    transform: [{ rotate: '180deg' }],
  },
  settingsFooter: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  doneButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  doneButtonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  textModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  textModalInput: {
    width: '100%',
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 48,
  },
  textModalButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  textModalCancel: {
    paddingHorizontal: 32,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
  },
  textModalCancelText: {
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  textModalConfirm: {
    paddingHorizontal: 48,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textModalConfirmText: {
    color: '#000000',
    fontWeight: '900',
  },
  stickersModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingHorizontal: 32,
  },
  stickersModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  stickersModalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  stickerOptionLocation: {
    width: '47%',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    gap: 8,
  },
  stickerOptionLocationText: {
    fontWeight: 'bold',
    color: '#60a5fa',
  },
  stickerOptionMention: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    gap: 8,
  },
  stickerOptionMentionText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stickerOptionHashtag: {
    width: '47%',
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.4)',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    gap: 8,
  },
  stickerOptionHashtagText: {
    fontWeight: 'bold',
    color: '#f472b6',
  },
  stickerOptionMusic: {
    width: '47%',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    gap: 8,
  },
  stickerOptionMusicText: {
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  flex1: {
    flex: 1,
  },
  emojisSectionHeader: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 36,
  },
});