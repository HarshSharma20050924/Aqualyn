import React, { useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  TextInput,
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreVertical,
  Plus,
  PlayCircle
} from 'lucide-react-native';

import { useAppContext } from '../context/AppContext';
import BubbleLoader from '../components/ui/BubbleLoader';
import { Post, User, Story } from '../types';
import StoryViewer from '../components/StoryViewer';
import StoryCreator from '../components/stories/StoryCreator';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

// Interactive Modular Post Card Architecture (Standalone to prevent invalid hook calls)
const PostCard = ({ post }: { post: Post }) => {
  const {
    commentPost,
    deletePost,
    likePost,
    savePost,
    addToast,
    currentUser,
    globalUsers
  } = useAppContext();

  const user = globalUsers.find(u => u.id === post.userId) || currentUser;
  const isLiked = currentUser && post.likes.includes(currentUser.id);
  const isSaved = currentUser?.savedPostIds?.includes(post.id);
  
  const [commentText, setCommentText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  
  // Custom Double-Tap Multi-Platform Mechanics Engine Tracking
  let lastTapRef = useRef<number | null>(null);
  const handleImageTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (lastTapRef.current && (now - lastTapRef.current < DOUBLE_TAP_DELAY)) {
      setShowHeartAnimation(true);
      if (!isLiked) {
        likePost(post.id);
      }
      setTimeout(() => setShowHeartAnimation(false), 1000);
    } else {
      lastTapRef.current = now;
    }
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      commentPost(post.id, commentText);
      setCommentText('');
    }
  };

  const handleDelete = async () => {
    try {
      await (deletePost as any)(post.id);
      addToast('Post deleted', 'success');
    } catch (e) {
      addToast('Failed to delete', 'error');
    }
    setIsMenuOpen(false);
  };

  return (
    <View style={styles.postCardFrameContainer}>
      {/* Post Header Element Structure */}
      <View style={styles.postHeaderRow}>
        <View style={styles.postHeaderProfileLeft}>
          <View style={styles.postCardAvatarOuterCircle}>
            <Image source={{ uri: user?.avatar }} style={styles.postAvatarImgFluid} />
          </View>
          <Text style={styles.postHeaderUsernameHeadlineText}>
            {user?.username || user?.name || 'anonymous'}
          </Text>
        </View>
        <View style={styles.relativeMenuBoxAnchor}>
          <TouchableOpacity onPress={() => setIsMenuOpen(!isMenuOpen)} style={styles.moreActionInteractBtn}>
            <MoreVertical size={20} color="#64748b" />
          </TouchableOpacity>

          {isMenuOpen && (
            <View style={styles.dropdownAbsoluteMenuOverlayCard}>
              {post.userId === currentUser?.id ? (
                <TouchableOpacity onPress={handleDelete} style={styles.dropdownMenuItemBtn}>
                  <Text style={styles.dropdownItemLabelTextError}>Delete Post</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setIsMenuOpen(false)} style={styles.dropdownMenuItemBtn}>
                  <Text style={styles.dropdownItemLabelTextStandard}>Report Post</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setIsMenuOpen(false)} style={[styles.dropdownMenuItemBtn, { borderBottomWidth: 0 }]}>
                <Text style={styles.dropdownItemLabelTextCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Post Media Display Window */}
      <TouchableOpacity activeOpacity={0.95} onPress={handleImageTap} style={styles.mediaContainerAspectSquareWindow}>
        <Image source={{ uri: post.mediaUrl }} style={styles.mediaImgFluidDisplay} />
        {post.mediaType === 'video' && (
          <View style={styles.videoOverlayIndicatorCircle}>
            <PlayCircle size={28} color="#fff" />
          </View>
        )}

        {showHeartAnimation && (
          <Animated.View   style={styles.absoluteDoubleTapHeartBadgeCenter}>
            <Heart size={80} color="#fff" fill="#fff" style={styles.doubleTapHeartDropShadow} />
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Post Metadata Interacting Deck Footer */}
      <View style={styles.postContentPaddingBox}>
        <View style={styles.actionToolbarRow}>
          <View style={styles.actionToolbarLeftGroup}>
            <TouchableOpacity onPress={() => likePost(post.id)} style={styles.toolbarIconInteractionBtn}>
              <Heart size={24} color={isLiked ? '#ef4444' : '#1e293b'} fill={isLiked ? '#ef4444' : 'transparent'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarIconInteractionBtn}>
              <MessageCircle size={24} color="#1e293b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarIconInteractionBtn}>
              <Send size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => {
              savePost(post.id);
              addToast(isSaved ? 'Removed from saved' : 'Saved to collection', 'success');
            }}
            style={styles.toolbarIconInteractionBtn}
          >
            <Bookmark size={24} color="#1e293b" fill={isSaved ? '#1e293b' : 'transparent'} />
          </TouchableOpacity>
        </View>

        <Text style={styles.likesMetricsCountText}>{post.likes.length} likes</Text>

        {post.caption ? (
          <Text style={styles.captionWrappedLabelParagraphText}>
            <Text style={styles.inlineBoldUsernameLabelText}>{user?.username || user?.name} </Text>
            <Text style={styles.inlineCaptionContentBodyText}>{post.caption}</Text>
          </Text>
        ) : null}

        {/* Secondary Level Inner Comments Stack Stream */}
        {post.comments.length > 0 && (
          <View style={styles.commentsCondensedContainerStack}>
            {post.comments.map((c: any, i: number) => (
              <Text key={i} numberOfLines={2} style={styles.commentItemLineParagraphText}>
                <Text style={styles.commentInlineBoldUserHandleText}>{c.user?.username || 'User'} </Text>
                <Text style={styles.commentInlineContentBodyText}>{c.content}</Text>
              </Text>
            ))}
          </View>
        )}

        {/* Dynamic Interactive Keyboard Comments Field Input Inline Form Row */}
        <View style={styles.commentFormRowInlineBordered}>
          <TextInput
            style={styles.commentFieldTextInputBox}
            placeholder="Add a comment..."
            placeholderTextColor="#94a3b8"
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity
            disabled={!commentText.trim()}
            onPress={handleAddComment}
            style={styles.commentSubmissionActionBtn}
          >
            <Text style={[styles.commentSubmissionActionText, !commentText.trim() && styles.commentSubmissionDisabledOpacity]}>
              Post
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.timestampDisplayCapsLabelText}>
          {new Date(post.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </Text>
      </View>
    </View>
  );
};

interface Props {
  onNavigate: (screen: string) => void;
}

export default function FeedScreen({ onNavigate }: Props) {
  const insets = useSafeAreaInsets();
  const {
    posts,
    stories,
    globalUsers,
    currentUser,
    likePost,
    savePost,
    addToast,
    isFetchingData,
    fetchInitialData
  } = useAppContext();

  const [viewerStories, setViewerStories] = useState<Story[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  }, [fetchInitialData]);

  // Active non-expired story filtration sequence
  const activeStories = useMemo(() => {
    return stories.filter(s => {
      const createdAt = new Date(s.createdAt);
      const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
      return expiresAt > new Date();
    });
  }, [stories]);

  // Group stories by user
  const storiesByUser = useMemo(() => {
    return activeStories.reduce((acc, story) => {
      if (!acc[story.userId]) {
        acc[story.userId] = [];
      }
      acc[story.userId].push(story);
      return acc;
    }, {} as Record<string, typeof stories>);
  }, [activeStories]);

  // Extract unique profile instances running active story tracks
  const storyUsers = useMemo(() => {
    return Object.values(storiesByUser).map(msgs => {
      const first = msgs[0];
      return {
        id: first.userId,
        name: first.userName || 'User',
        username: first.userName || 'user',
        avatar: first.userAvatar || `https://ui-avatars.com/api/?background=random&name=${first.userId}`
      } as any as User;
    });
  }, [storiesByUser]);

  const hasMyStory = currentUser ? storiesByUser[currentUser.id]?.length > 0 : false;
  const feedPosts = useMemo(() => {
    return [...posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [posts]);



  const PostSkeleton = () => (
    <View style={styles.skeletonContainerCardBlock}>
      <View style={styles.skeletonHeaderRow}>
        <View style={styles.skeletonHeaderAvatarCircle} />
        <View style={styles.skeletonHeaderUsernameLine} />
      </View>
      <View style={styles.skeletonSquareMediaBox} />
      <View style={styles.skeletonFooterPaddingBlock}>
        <View style={styles.skeletonFooterActionLine} />
        <View style={styles.skeletonFooterShortLine} />
        <View style={styles.skeletonFooterLongLine} />
      </View>
    </View>
  );

  return (
    <Animated.View  style={styles.screenViewContainer}>
      {/* Absolute Sticky Floating Navigation Deck Layer Top */}
      <View style={[styles.headerFloatingStickyNavbarBox, { paddingTop: insets.top }]}>
        <View style={styles.headerToolbarInteriorFlexRow}>
          <Text style={styles.headerAqualynBrandTypographyText}>Aqualyn</Text>
          <View style={styles.headerRightActionButtonsGroupRow}>
            <TouchableOpacity onPress={() => onNavigate('notifications')} style={styles.headerCircleActionInteractiveBtn}>
              <Heart size={22} color="#0f172a" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate('chats')} style={styles.headerCircleActionInteractiveBtn}>
              <MessageCircle size={22} color="#0f172a" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Core Viewport Content Deck Pipeline Rendering List */}
      <View style={{ flex: 1, position: 'relative' }}>
        {refreshing && (
          <View style={{ position: 'absolute', top: 10, left: 0, right: 0, zIndex: 100, alignItems: 'center' }}>
            <BubbleLoader size={30} />
          </View>
        )}
        <FlatList
          data={isFetchingData ? [] : feedPosts}
          keyExtractor={(item) => item.id}
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
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={[styles.mainScrollableContentTrack, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          /* Content Core Stream Layer Segment Header: Stories Tray Slider Assembly Component */
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalStoriesTrackTrayRow}>
            {/* My Story Node Indicator Component Core layout */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                if (hasMyStory && currentUser) {
                  setViewerStories(storiesByUser[currentUser.id]);
                  setActiveStoryIndex(0);
                } else {
                  setIsCreatorOpen(true);
                }
              }}
              style={styles.storyCardColumnFlexCenterItemNode}
            >
              <View style={[styles.storyAvatarOuterGradientRingFrame, { backgroundColor: '#e2e8f0' }]}>
                <View style={styles.storyAvatarInnerWhiteGapShield}>
                  <Image source={{ uri: currentUser?.avatar }} style={styles.storyAvatarContentImgFluid} />
                </View>
                {!hasMyStory && (
                  <View style={styles.addStoryPlusFloatingBadgeBtn}>
                    <Plus size={12} color="#fff" strokeWidth={3} />
                  </View>
                )}
              </View>
              <Text style={styles.storyUserHandleTypographyLabelText}>Your story</Text>
            </TouchableOpacity>

            {/* Friends Outer Interactive Relationship Stories Blocks loop pipeline elements */}
            {storyUsers.map(user => {
              if (user.id === currentUser?.id) return null;
              return (
                <TouchableOpacity
                  key={user.id}
                  activeOpacity={0.9}
                  onPress={() => {
                    setViewerStories(storiesByUser[user.id]);
                    setActiveStoryIndex(0);
                  }}
                  style={styles.storyCardColumnFlexCenterItemNode}
                >
                  <View style={styles.storyAvatarOuterGradientRingFrameActive}>
                    <View style={styles.storyAvatarInnerWhiteGapShield}>
                      <Image source={{ uri: user.avatar }} style={styles.storyAvatarContentImgFluid} />
                    </View>
                  </View>
                  <Text numberOfLines={1} style={styles.storyUserHandleTypographyLabelTextActive}>
                    {user.username || (user.name ? user.name.split(' ')[0] : 'user')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        }
        ListEmptyComponent={
          isFetchingData ? (
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
              <PostSkeleton />
              <PostSkeleton />
            </View>
          ) : (
            <View style={styles.emptyStateStreamFallbackCenterMessageBox}>
              <Text style={styles.emptyStateHeadingTitleText}>No posts yet.</Text>
              <Text style={styles.emptyStateSubheadingDescHelperText}>Follow some friends to see their updates here.</Text>
            </View>
          )
        }
      />
      </View>

      {/* Full Account Story Segment Context Overlays Viewers Engine Module */}
      {activeStoryIndex !== null && (
        <StoryViewer
          stories={viewerStories}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
        />
      )}

      {/* Account Personal Story Composer Studio Layout Layer Assembly */}
      {isCreatorOpen && (
        <StoryCreator onClose={() => Platform.OS === 'ios' ? setIsCreatorOpen(false) : setTimeout(() => setIsCreatorOpen(false), 50)} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screenViewContainer: { flex: 1, backgroundColor: '#ffffff' },
  
  // Header Sticky Assembly Configuration Metrics
  headerFloatingStickyNavbarBox: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    zIndex: 200
  },
  headerToolbarInteriorFlexRow: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20
  },
  headerAqualynBrandTypographyText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0891b2',
    letterSpacing: -0.8
  },
  headerRightActionButtonsGroupRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerCircleActionInteractiveBtn: { padding: 10, borderRadius: 99, backgroundColor: '#f8fafc' },

  // Scroll Content Streams List Body tracking guidelines
  mainScrollableContentTrack: { paddingTop: 8 },

  // Stories Horizontal Slider Track Component layout structures
  horizontalStoriesTrackTrayRow: { paddingVertical: 14, paddingHorizontal: 16, gap: 14, borderBottomWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#fff' },
  storyCardColumnFlexCenterItemNode: { alignItems: 'center', gap: 6, width: 72 },
  storyAvatarOuterGradientRingFrame: { position: 'relative', width: 64, height: 64, borderRadius: 32, padding: 2, justifyContent: 'center', alignItems: 'center' },
  storyAvatarOuterGradientRingFrameActive: { width: 64, height: 64, borderRadius: 32, padding: 2.5, backgroundColor: '#0891b2', justifyContent: 'center', alignItems: 'center' },
  storyAvatarInnerWhiteGapShield: { width: '100%', height: '100%', borderRadius: 32, borderWidth: 2, borderColor: '#fff', overflow: 'hidden', backgroundColor: '#f8fafc' },
  storyAvatarContentImgFluid: { width: '100%', height: '100%', resizeMode: 'cover' },
  addStoryPlusFloatingBadgeBtn: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: '#06b6d4', borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  storyUserHandleTypographyLabelText: { fontSize: 11, color: '#64748b', fontWeight: '500', textAlign: 'center' },
  storyUserHandleTypographyLabelTextActive: { fontSize: 11, color: '#1e293b', fontWeight: '600', textAlign: 'center' },

  // Post Card Framing Structure Custom Design System Variables
  postCardFrameContainer: { backgroundColor: '#fff', width: '100%', maxWidth: 500, alignSelf: 'center', marginBottom: 12, borderBottomWidth: 1, borderColor: '#f8fafc' },
  postHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingHorizontal: 16 },
  postHeaderProfileLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  postCardAvatarOuterCircle: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  postAvatarImgFluid: { width: '100%', height: '100%', resizeMode: 'cover' },
  postHeaderUsernameHeadlineText: { fontSize: 14, fontWeight: '700', color: '#0f172a', letterSpacing: -0.1 },
  moreActionInteractBtn: { padding: 6, borderRadius: 99 },
  
  // Custom Dynamic Dropdown Overlays Action structures inside Native Layout Matrix
  relativeMenuBoxAnchor: { position: 'relative' },
  dropdownAbsoluteMenuOverlayCard: { position: 'absolute', right: 0, top: 36, width: 180, backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden', zIndex: 300, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  dropdownMenuItemBtn: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#f8fafc', width: '100%' },
  dropdownItemLabelTextError: { fontSize: 13, fontWeight: '700', color: '#ef4444' },
  dropdownItemLabelTextStandard: { fontSize: 13, fontWeight: '600', color: '#334155' },
  dropdownItemLabelTextCancel: { fontSize: 13, fontWeight: '500', color: '#94a3b8' },

  // Media Window Configurations
  mediaContainerAspectSquareWindow: { position: 'relative', width: WINDOW_WIDTH, maxWidth: 500, aspectRatio: 1, backgroundColor: '#090d16', justifyContent: 'center', alignItems: 'center' },
  mediaImgFluidDisplay: { width: '100%', height: '100%', resizeMode: 'cover' },
  videoOverlayIndicatorCircle: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.4)', padding: 10, borderRadius: 99 },
  absoluteDoubleTapHeartBadgeCenter: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', zIndex: 40 },
  doubleTapHeartDropShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },

  // Post Interact elements core paddings structures
  postContentPaddingBox: { paddingHorizontal: 16, paddingVertical: 12 },
  actionToolbarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  actionToolbarLeftGroup: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  toolbarIconInteractionBtn: { paddingVertical: 4 },
  likesMetricsCountText: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  captionWrappedLabelParagraphText: { flexDirection: 'row', flexWrap: 'wrap', lineHeight: 18, marginBottom: 6 },
  inlineBoldUsernameLabelText: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  inlineCaptionContentBodyText: { fontSize: 13, color: '#334155' },

  // Secondary Internal Feed Comments configurations lines layouts
  commentsCondensedContainerStack: { gap: 3, marginVertical: 4, paddingLeft: 2 },
  commentItemLineParagraphText: { flexDirection: 'row', flexWrap: 'wrap', lineHeight: 16 },
  commentInlineBoldUserHandleText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  commentInlineContentBodyText: { fontSize: 12, color: '#64748b' },

  // Embedded Inline Comment Addition Form
  commentFormRowInlineBordered: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: '#f1f5f9', marginTop: 10, paddingTop: 10, paddingBottom: 2 },
  commentFieldTextInputBox: { flex: 1, height: 36, paddingHorizontal: 4, fontSize: 13, color: '#1e293b' },
  commentSubmissionActionBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  commentSubmissionActionText: { fontSize: 13, fontWeight: '700', color: '#0891b2' },
  commentSubmissionDisabledOpacity: { opacity: 0.4 },
  timestampDisplayCapsLabelText: { fontSize: 9, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 10 },

  // Stream Empty Fallbacks Viewport components layout
  emptyStateStreamFallbackCenterMessageBox: { paddingVertical: 100, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  emptyStateHeadingTitleText: { fontSize: 16, fontWeight: '700', color: '#64748b', textAlign: 'center' },
  emptyStateSubheadingDescHelperText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4, lineHeight: 18 },

  // Skeleton Loaders Structure Design Blocks mapping
  skeletonContainerCardBlock: { marginBottom: 24, gap: 12 },
  skeletonHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skeletonHeaderAvatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9' },
  skeletonHeaderUsernameLine: { width: 100, height: 14, borderRadius: 4, backgroundColor: '#f1f5f9' },
  skeletonSquareMediaBox: { width: '100%', aspectRatio: 1, backgroundColor: '#f1f5f9', borderRadius: 16 },
  skeletonFooterPaddingBlock: { gap: 8 },
  skeletonFooterActionLine: { width: '40%', height: 14, borderRadius: 4, backgroundColor: '#f1f5f9' },
  skeletonFooterShortLine: { width: '20%', height: 12, borderRadius: 4, backgroundColor: '#f1f5f9' },
  skeletonFooterLongLine: { width: '80%', height: 12, borderRadius: 4, backgroundColor: '#f1f5f9' }
});