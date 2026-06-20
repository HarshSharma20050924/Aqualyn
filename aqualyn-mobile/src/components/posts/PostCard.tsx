import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Platform,
  Share,
} from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  ZoomIn, 
  ZoomOut 
} from 'react-native-reanimated';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Volume2, VolumeX } from 'lucide-react-native';
import { Post } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface PostCardProps {
  post: Post;
  onViewPost: (post: Post) => void;
}

export default function PostCard({ post, onViewPost }: PostCardProps) {
  const { currentUser, likePost, savePost, addToast } = useAppContext();
  const [isLiked, setIsLiked] = useState(post.likes.includes(currentUser?.id || ''));
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [isSaved, setIsSaved] = useState(currentUser?.savedPostIds?.includes(post.id) || false);
  const [isMuted, setIsMuted] = useState(true);
  const [lastTap, setLastTap] = useState(0);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);

  const handleLike = () => {
    likePost(post.id);
    if (isLiked) {
      setLikesCount(prev => prev - 1);
    } else {
      setLikesCount(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleSave = () => {
    savePost(post.id);
    setIsSaved(!isSaved);
    addToast(isSaved ? 'Removed from saved' : 'Post saved', 'success');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: `Post by ${post.userName}`,
        message: `${post.caption}\n\nCheck out this post!`,
      });
    } catch (error) {
      addToast('Sharing failed on this device', 'error');
    }
  };

  const handleMediaPress = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double Tap detected
      if (!isLiked) handleLike();
      setShowHeartOverlay(true);
      setTimeout(() => setShowHeartOverlay(false), 1000);
    } else {
      setLastTap(now);
      // Single tap fallback handler
      setTimeout(() => {
        if (Date.now() - lastTap >= 300) {
          onViewPost(post);
        }
      }, 310);
    }
  };

  const hasVideo = post.mediaType === 'video' || post.videoUrl;

  return (
    <Animated.View 
      
      style={styles.cardContainerWrapper}
    >
      {/* Post Header */}
      <View style={styles.cardHeaderFlexRow}>
        <TouchableOpacity 
          style={styles.headerLeftProfileContainer} 
          onPress={() => onViewPost(post)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarGradientBorderRing}>
            <Image 
              source={{ uri: post.userAvatar || `https://ui-avatars.com/api/?name=${post.userName}&background=random` }} 
              style={styles.avatarImageRenderElement}
            />
          </View>
          <View>
            <Text style={styles.headerProfileUsernameText}>{post.userName}</Text>
            <Text style={styles.headerProfileTimestampMetaText}>{post.timestamp}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerRightMenuButtonCircle}>
          <MoreHorizontal size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Post Media Platform Element */}
      <TouchableOpacity 
        activeOpacity={0.95} 
        onPress={handleMediaPress}
        style={styles.mediaContentBoxSquareFrame}
      >
        {hasVideo ? (
          <View style={styles.videoPlayerContainerFallbackCanvas}>
            {/* Implemented via simple canvas placeholder setup; switch directly to <Video> from react-native-video in production */}
            <Image 
              source={{ uri: post.mediaUrl || 'https://images.unsplash.com/photo-1558655146-d09347e92766' }} 
              style={StyleSheet.absoluteFill} 
            />
            <View style={styles.videoIndicatorAbsoluteTopOverlayBadge}>
              <Text style={styles.videoIndicatorMicroBadgeLabelText}>Video Pre-play</Text>
            </View>
            <View style={styles.videoAbsoluteActionControlsLayerBox}>
              <TouchableOpacity 
                onPress={() => setIsMuted(!isMuted)}
                style={styles.videoVolumeControlCircularActionButton}
              >
                {isMuted ? <VolumeX size={16} color="#ffffff" /> : <Volume2 size={16} color="#ffffff" />}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Image 
            source={{ uri: post.imageUrl || post.mediaUrl || `https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800&h=800&sig=${post.id}` }} 
            style={styles.imageContentAssetFullStretch}
          />
        )}
        
        {showHeartOverlay && (
          <Animated.View 
             
             
            style={styles.doubleTapHeartOverlayCenterAnchor}
          >
            <Heart size={80} color="#ffffff" fill="#ffffff" style={styles.heartGraphicFilterShadowDrop} />
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Interactions Control Deck Toolbar */}
      <View style={styles.cardActionsFooterModuleContainer}>
        <View style={styles.footerActionButtonsHorizontalRowStrip}>
          <View style={styles.footerActionsLeftAlignedGroup}>
            <TouchableOpacity 
              onPress={handleLike}
              style={[styles.actionPillContainerShapeButton, isLiked ? styles.actionPillLikedStateActiveBackground : styles.actionPillDefaultStateInactiveBackground]}
            >
              <Heart size={18} color={isLiked ? '#ef4444' : '#475569'} fill={isLiked ? '#ef4444' : 'transparent'} />
              <Text style={[styles.actionPillMetricLabelCounterText, isLiked ? styles.actionPillLikedLabelTextHighlight : styles.actionPillDefaultLabelTextVariant]}>
                {likesCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => onViewPost(post)}
              style={[styles.actionPillContainerShapeButton, styles.actionPillDefaultStateInactiveBackground]}
            >
              <MessageCircle size={18} color="#475569" />
              <Text style={[styles.actionPillMetricLabelCounterText, styles.actionPillDefaultLabelTextVariant]}>
                {post.comments.length}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleShare} style={styles.actionStandaloneCircularTriggerButton}>
              <Send size={18} color="#475569" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            onPress={handleSave}
            style={[styles.bookmarkActionPillCircularShapeButton, isSaved ? styles.bookmarkSavedStateActiveBackground : styles.actionPillDefaultStateInactiveBackground]}
          >
            <Bookmark size={18} color={isSaved ? '#3b82f6' : '#475569'} fill={isSaved ? '#3b82f6' : 'transparent'} />
          </TouchableOpacity>
        </View>

        {/* Caption Typography Wrapper */}
        <View style={styles.captionInformationTextGroupBlock}>
          <Text style={styles.captionTypographyBodyParagraphText}>
            <Text style={styles.captionUserNameStrongBoldPrefixText}>{post.userName}  </Text>
            {post.caption || post.text}
          </Text>
          {post.comments.length > 0 && (
            <TouchableOpacity onPress={() => onViewPost(post)} activeOpacity={0.6}>
              <Text style={styles.viewConversationsActionLinkAnchorLabel}>View all conversations</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainerWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  cardHeaderFlexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeftProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarGradientBorderRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    backgroundColor: '#06b6d4', // simplified gradient mapping path representation
  },
  avatarImageRenderElement: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: '#f1f5f9',
  },
  headerProfileUsernameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerProfileTimestampMetaText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  headerRightMenuButtonCircle: {
    padding: 8,
    borderRadius: 20,
  },
  mediaContentBoxSquareFrame: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f8fafc',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerContainerFallbackCanvas: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoIndicatorAbsoluteTopOverlayBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  videoIndicatorMicroBadgeLabelText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
  },
  videoAbsoluteActionControlsLayerBox: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  videoVolumeControlCircularActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContentAssetFullStretch: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  doubleTapHeartOverlayCenterAnchor: {
    position: 'absolute',
    zIndex: 10,
  },
  heartGraphicFilterShadowDrop: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  cardActionsFooterModuleContainer: {
    padding: 16,
  },
  footerActionButtonsHorizontalRowStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  footerActionsLeftAlignedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPillContainerShapeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    gap: 6,
  },
  actionPillDefaultStateInactiveBackground: {
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
  },
  actionPillLikedStateActiveBackground: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  actionPillMetricLabelCounterText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionPillDefaultLabelTextVariant: {
    color: '#475569',
  },
  actionPillLikedLabelTextHighlight: {
    color: '#ef4444',
  },
  actionStandaloneCircularTriggerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkActionPillCircularShapeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkSavedStateActiveBackground: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  captionInformationTextGroupBlock: {
    gap: 6,
  },
  captionTypographyBodyParagraphText: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
  },
  captionUserNameStrongBoldPrefixText: {
    fontWeight: '700',
  },
  viewConversationsActionLinkAnchorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
});