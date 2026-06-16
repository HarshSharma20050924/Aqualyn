import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Modal, 
  ScrollView, 
  Pressable, 
  StyleSheet 
} from 'react-native';
import { X, Send, Heart, Share2, MoreHorizontal, Star, Trash2, VolumeX } from 'lucide-react-native';
import { useAppContext, Story } from '../context/AppContext';

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export default function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const { 
    addStoryComment, deleteStory, currentUser, addToast, chats, sendMessage 
  } = useAppContext();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSendMenuOpen, setIsSendMenuOpen] = useState(false);

  const currentStory = stories[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  const handleSendReply = () => {
    if (currentStory && replyText.trim()) {
      addStoryComment(currentStory.id, replyText);
      
      if (currentStory.userId !== currentUser?.id) {
        const existingChat = chats.find(c => !c.isGroup && c.participantIds?.includes(currentStory.userId));
        if (existingChat) {
          sendMessage(existingChat.id, replyText, {
            imageUrl: currentStory.mediaType === 'image' ? currentStory.mediaUrl : undefined,
            videoUrl: currentStory.mediaType === 'video' ? currentStory.mediaUrl : undefined
          });
        }
      }
      
      setReplyText('');
      addToast('Reply sent', 'success');
    }
  };

  const handleSendReaction = (emoji: string) => {
    if (currentStory) {
      addStoryComment(currentStory.id, emoji);
      
      if (currentStory.userId !== currentUser?.id) {
        const existingChat = chats.find(c => !c.isGroup && c.participantIds?.includes(currentStory.userId));
        if (existingChat) {
          sendMessage(existingChat.id, emoji, {
            imageUrl: currentStory.mediaType === 'image' ? currentStory.mediaUrl : undefined,
            videoUrl: currentStory.mediaType === 'video' ? currentStory.mediaUrl : undefined
          });
        }
      }
      addToast(`Sent ${emoji}`, 'success');
    }
  };

  const handleDeleteStory = async () => {
    if (!currentStory) return;
    try {
      await deleteStory(currentStory.id);
      setIsMenuOpen(false);
      if (stories.length <= 1) {
        onClose();
      } else {
        handleNext();
      }
    } catch (e) {
      addToast('Failed to delete story', 'error');
    }
  };

  const handleAddToHighlights = () => {
    addToast('Added to highlights', 'success');
    setIsMenuOpen(false);
  };

  const handleShare = () => {
    addToast('Link copied to clipboard', 'success');
    setIsMenuOpen(false);
  };

  const handleSendToChat = (chatId: string) => {
    if (currentStory) {
      const options: any = {};
      if (currentStory.mediaType === 'image') {
        options.imageUrl = currentStory.mediaUrl;
      } else if (currentStory.mediaType === 'video') {
        options.videoUrl = currentStory.mediaUrl;
      }
      sendMessage(chatId, `Shared a story from ${currentStory.userName}`, options);
      addToast('Story sent to chat', 'success');
    }
    setIsSendMenuOpen(false);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (isPaused || isMenuOpen || isSendMenuOpen) return;

    const duration = 5000; 
    const interval = 50; 
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev + step >= 100) {
          clearInterval(timer);
          handleNext();
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, isMenuOpen, isSendMenuOpen, handleNext]);

  if (!currentStory) return null;

  return (
    <Modal visible transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewportContainer}>
        
        {/* Dynamic Multi-Segment Step Progress Indicators */}
        <View style={styles.progressIndicatorsContainer}>
          {stories.map((story, index) => (
            <View key={story.id} style={styles.progressTrack}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${index < currentIndex ? 100 : index === currentIndex ? progress : 0}%`
                  }
                ]}
              />
            </View>
          ))}
        </View>

        {/* Global Floating Header Panel context overlay */}
        <View style={styles.floatingHeaderPanel}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarRing}>
              <Image source={{ uri: currentStory.userAvatar }} style={styles.avatarImage} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.userNameText}>{currentStory.userName}</Text>
              <Text style={styles.timestampText}>{currentStory.timestamp}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setIsMenuOpen(true)}>
              <MoreHorizontal size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Interactive Story Canvas Space View */}
        <TouchableOpacity 
          activeOpacity={1}
          onPressIn={() => setIsPaused(true)}
          onPressOut={() => setIsPaused(false)}
          style={styles.interactiveStoryCanvas}
        >
          {currentStory.mediaType === 'image' ? (
            <Image source={{ uri: currentStory.mediaUrl }} style={styles.storyImage} />
          ) : (
            // Native Platform abstraction layout representation placeholder
            <View style={styles.videoPlaceholder}>
              <Image source={{ uri: currentStory.mediaUrl }} style={styles.videoPlaceholderBgImage} />
              <Text style={styles.videoPlaceholderText}>Video Feed Loop Audio Native Layer</Text>
            </View>
          )}

          {/* Left / Right Tap Steering Segments */}
          <View style={styles.tapSteeringOverlay}>
            <TouchableOpacity activeOpacity={1} style={styles.tapSteeringLeft} onPress={handlePrev} />
            <TouchableOpacity activeOpacity={1} style={styles.tapSteeringRight} onPress={handleNext} />
          </View>
        </TouchableOpacity>

        {/* Interaction Dashboard Footer Overlay wrapper */}
        <View style={styles.dashboardFooter}>
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <TextInput 
                value={replyText}
                onChangeText={setReplyText}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                placeholder="Send message..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={styles.textInput}
              />
              <TouchableOpacity onPress={handleSendReply} style={styles.sendButton}>
                <Send size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => handleSendReaction('❤️')}>
              <Heart size={26} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.emojiRow}>
            {['🔥', '😂', '😮', '😢', '😍', '👏'].map(emoji => (
              <TouchableOpacity key={emoji} onPress={() => handleSendReaction(emoji)}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Config Options Actions Sheet Menu Modal */}
        <Modal visible={isMenuOpen} transparent animationType="fade" onRequestClose={() => setIsMenuOpen(false)}>
          <Pressable style={styles.menuBackdrop} onPress={() => setIsMenuOpen(false)}>
            <View style={styles.menuContainer}>
              {currentStory.userId === currentUser?.id ? (
                <>
                  <TouchableOpacity onPress={handleAddToHighlights} style={styles.menuItem}>
                    <Star size={18} color="#FFF" />
                    <Text style={styles.menuItemText}>Add to Highlights</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDeleteStory} style={styles.menuItem}>
                    <Trash2 size={18} color="#EF4444" />
                    <Text style={styles.menuItemTextDanger}>Delete</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={() => { addToast('Story muted', 'info'); setIsMenuOpen(false); }} style={styles.menuItem}>
                  <VolumeX size={18} color="#EF4444" />
                  <Text style={styles.menuItemTextDanger}>Mute Story</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleShare} style={styles.menuItem}>
                <Share2 size={18} color="#FFF" />
                <Text style={styles.menuItemText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setIsMenuOpen(false); setIsSendMenuOpen(true); }} style={styles.menuItem}>
                <Send size={18} color="#FFF" />
                <Text style={styles.menuItemText}>Send to Chat</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* Forward Destination Sharing Menu Sheet Modal */}
        <Modal visible={isSendMenuOpen} transparent animationType="slide" onRequestClose={() => setIsSendMenuOpen(false)}>
          <View style={styles.sendMenuBackdrop}>
            <View style={styles.sendMenuContainer}>
              <View style={styles.sendMenuHeader}>
                <Text style={styles.sendMenuTitle}>Send to...</Text>
                <TouchableOpacity onPress={() => setIsSendMenuOpen(false)} style={styles.sendMenuCloseButton}>
                  <X size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.sendMenuScrollView}>
                {chats.filter(c => !c.isGroup && !c.id.startsWith('bot')).map(chat => (
                  <TouchableOpacity 
                    key={chat.id} 
                    onPress={() => handleSendToChat(chat.id)}
                    style={styles.chatSelectItem}
                  >
                    <Image source={{ uri: chat.avatar }} style={styles.chatSelectAvatar} />
                    <Text style={styles.chatSelectName}>{chat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  viewportContainer: {
    flex: 1,
    backgroundColor: '#000000',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
  },
  progressIndicatorsContainer: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    gap: 6,
  },
  progressTrack: {
    height: 4,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ffffff',
  },
  floatingHeaderPanel: {
    position: 'absolute',
    top: 64,
    left: 24,
    right: 24,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    padding: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    resizeMode: 'cover',
  },
  headerTextContainer: {
    flexDirection: 'column',
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  timestampText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  interactiveStoryCanvas: {
    flex: 1,
    width: '100%',
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholderBgImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
    opacity: 0.4,
  },
  videoPlaceholderText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
  },
  tapSteeringOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  tapSteeringLeft: {
    width: '33.33%',
    height: '100%',
  },
  tapSteeringRight: {
    width: '66.67%',
    height: '100%',
  },
  dashboardFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingTop: 40,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    padding: 0,
    height: 40,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  emojiText: {
    fontSize: 24,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 16,
    flexDirection: 'column',
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  menuItemText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  menuItemTextDanger: {
    color: '#ef4444',
    fontWeight: '600',
  },
  sendMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sendMenuContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    height: '60%',
    flexDirection: 'column',
  },
  sendMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sendMenuTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  sendMenuCloseButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  sendMenuScrollView: {
    flex: 1,
  },
  chatSelectItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 8,
  },
  chatSelectAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    resizeMode: 'cover',
  },
  chatSelectName: {
    fontWeight: '700',
    color: '#ffffff',
    fontSize: 16,
  },
});