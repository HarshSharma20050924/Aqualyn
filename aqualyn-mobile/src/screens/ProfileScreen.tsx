import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
  Dimensions,
  Platform
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pen, Plus, Heart, MessageCircle, Grid, Bookmark, Folder } from 'lucide-react-native';
import { Post, Collection, User } from '../types';
import { useAppContext } from '../context/AppContext';

// Integration Stubs — Replace with your designated native modal/viewer assets
import StoryViewer from '../components/StoryViewer';
import StoryCreator from '../components/stories/StoryCreator';
import PostCreator from '../components/posts/PostCreator';
import PostViewer from '../components/posts/PostViewer';
import UserListModal from '../components/social/UserListModal';

import { apiFetch } from '../utils/fetcher';
import { ENDPOINTS } from '../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 40) / 3;

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
}

export default function ProfileScreen({ onNavigate }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { currentUser, posts = [], stories = [], createCollection, setActiveContactId, addToast } = useAppContext() || {};

  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isPostCreatorOpen, setIsPostCreatorOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'collections'>('posts');
  const [isNewCollectionModalOpen, setIsNewCollectionModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  // Social list states
  const [showList, setShowList] = useState<'followers' | 'following' | null>(null);
  const [listData, setListData] = useState<User[]>([]);
  const [isListLoading, setIsListLoading] = useState(false);

  if (!currentUser) return null;

  const myPosts = posts.filter((p: Post) => p.userId === currentUser.id && !p.isArchived);
  const savedPosts = posts.filter((p: Post) => currentUser.savedPostIds?.includes(p.id));
  const myStories = stories.filter((s: any) => s.userId === currentUser.id);

  const fetchSocialList = async (type: 'followers' | 'following') => {
    setShowList(type);
    setIsListLoading(true);
    try {
      const endpoint = type === 'followers' ? ENDPOINTS.GET_FOLLOWERS(currentUser.id) : ENDPOINTS.GET_FOLLOWING(currentUser.id);
      const res = await apiFetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setListData(data);
      }
    } catch (e) {
      console.error(e);
      addToast?.('Failed to load list', 'error');
    } finally {
      setIsListLoading(false);
    }
  };

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    createCollection?.(newCollectionName);
    setNewCollectionName('');
    setIsNewCollectionModalOpen(false);
  };

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.viewportBaseFrame}>
      {/* Fixed Sticky Header Panel */}
      <View style={[styles.stickyHeaderPanel, { paddingTop: insets.top, height: 64 + insets.top }]}>
        <View style={styles.headerContentWrapper}>
          <Text style={styles.brandingLogoTextHeadline}>Aqualyn</Text>
          <View style={styles.headerAvatarCircularBadgeBorder}>
            <Image source={{ uri: currentUser.avatar }} style={styles.headerMiniAvatarImg} />
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.mainScrollStackContainer, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Identity Info Profile Overview Card */}
        <View style={styles.profileMetaHeroSection}>
          <View style={styles.largeAvatarCompositeLayoutFrame}>
            <View style={styles.largeAvatarCircularBorderCard}>
              <Image source={{ uri: currentUser.largeAvatar || currentUser.avatar }} style={styles.largeProfileAvatarImg} />
            </View>
            <TouchableOpacity 
              onPress={() => onNavigate('edit-profile')} 
              style={styles.floatingPenIconButtonIndicator}
              activeOpacity={0.8}
            >
              <Pen size={18} color="#ffffff" fill="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.identityMetadataBlock}>
            <Text style={styles.displayNameTextHeadline}>
              {currentUser.displayName || currentUser.name || currentUser.username}
            </Text>
            <Text style={styles.usernameHandleTextSubtitle}>@{currentUser.username}</Text>
          </View>

          {currentUser.bio ? <Text style={styles.bioParagraphBodyText}>{currentUser.bio}</Text> : null}

          {/* Followers / Stats Counters Track */}
          <View style={styles.socialStatsHorizontalCounterRow}>
            <View style={styles.statSegmentCounterClickableBlock}>
              <Text style={styles.statIntegerCountLabelValue}>{myPosts.length}</Text>
              <Text style={styles.statSectionLabelCapsText}>Posts</Text>
            </View>
            
            <TouchableOpacity onPress={() => fetchSocialList('followers')} style={styles.statSegmentCounterClickableBlock}>
              <Text style={styles.statIntegerCountLabelValue}>
                {currentUser?._count?.followers || currentUser?.followers?.length || 0}
              </Text>
              <Text style={styles.statSectionLabelCapsText}>Followers</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => fetchSocialList('following')} style={styles.statSegmentCounterClickableBlock}>
              <Text style={styles.statIntegerCountLabelValue}>
                {currentUser?._count?.following || currentUser?.following?.length || 0}
              </Text>
              <Text style={styles.statSectionLabelCapsText}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Call To Actions Operational Hub Elements Row */}
          <View style={styles.profileActionCtaButtonsHorizontalRow}>
            <TouchableOpacity 
              onPress={() => onNavigate('edit-profile')} 
              style={styles.primaryActionButtonGradientShape}
            >
              <Text style={styles.primaryActionButtonGradientLabelText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryGlassOutlineActionButton}>
              <Text style={styles.secondaryGlassOutlineActionButtonLabelText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Horizontal Stories Component Framework */}
        <View style={styles.storiesContainerSectionGap}>
          <View style={styles.sectionHeaderMetaRowBlock}>
            <Text style={styles.sectionHeadingTitleText}>Recent Stories</Text>
            <TouchableOpacity onPress={() => onNavigate('feed')}>
              <Text style={styles.sectionHeadingInlineActionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.storiesHorizontalListTrack}
            snapToInterval={136}
            decelerationRate="fast"
          >
            <TouchableOpacity 
              onPress={() => setIsCreatorOpen(true)}
              style={styles.dashedStoryCreativeAdderCardTrigger}
            >
              <View style={styles.innerCircularPlusBadgeWrapper}>
                <Plus size={22} color="#0057bd" />
              </View>
              <Text style={styles.dashedStoryCreativeAdderLabelText}>Add Story</Text>
            </TouchableOpacity>

            {myStories.map((story: any, i: number) => (
              <TouchableOpacity 
                key={story.id} 
                onPress={() => setActiveStoryIndex(i)}
                style={styles.storyThumbnailCardContainerFrame}
              >
                <Image source={{ uri: story.mediaUrl }} style={styles.storyMediaThumbnailNativeImg} />
                <View style={styles.absoluteBottomFadedScrimOverlayGradient} />
                <Text style={styles.storyTimestampAbsoluteMetaLabelText}>{story.timestamp}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Secondary Modular Tab Segment Engine Switches */}
        <View style={styles.tabBarControlSelectionRowTrack}>
          <TouchableOpacity 
            onPress={() => setActiveTab('posts')} 
            style={[styles.tabBarInteractiveSegmentLink, activeTab === 'posts' && styles.activeTabBarInteractiveSegmentLinkBorder]}
          >
            <Grid size={18} color={activeTab === 'posts' ? '#0057bd' : '#64748b'} />
            <Text style={[styles.tabBarInteractiveSegmentLabel, activeTab === 'posts' && styles.activeTabBarInteractiveSegmentLabelText]}>Posts</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setActiveTab('saved')} 
            style={[styles.tabBarInteractiveSegmentLink, activeTab === 'saved' && styles.activeTabBarInteractiveSegmentLinkBorder]}
          >
            <Bookmark size={18} color={activeTab === 'saved' ? '#0057bd' : '#64748b'} />
            <Text style={[styles.tabBarInteractiveSegmentLabel, activeTab === 'saved' && styles.activeTabBarInteractiveSegmentLabelText]}>Saved</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setActiveTab('collections')} 
            style={[styles.tabBarInteractiveSegmentLink, activeTab === 'collections' && styles.activeTabBarInteractiveSegmentLinkBorder]}
          >
            <Folder size={18} color={activeTab === 'collections' ? '#0057bd' : '#64748b'} />
            <Text style={[styles.tabBarInteractiveSegmentLabel, activeTab === 'collections' && styles.activeTabBarInteractiveSegmentLabelText]}>Collections</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Context Viewport Render Switchboard Grid */}
        <View style={styles.tabContentBlockViewGridContainer}>
          {activeTab === 'posts' && (
            <View style={styles.masonryThreeColumnWrapGrid}>
              <TouchableOpacity 
                onPress={() => setIsPostCreatorOpen(true)}
                style={styles.dashedSquareGridPostAdderCardTrigger}
              >
                <Plus size={24} color="#64748b" />
                <Text style={styles.dashedSquareGridPostAdderCapsLabel}>New Post</Text>
              </TouchableOpacity>

              {myPosts.map((post: Post) => (
                <TouchableOpacity 
                  key={post.id} 
                  onPress={() => setSelectedPost(post)}
                  style={styles.gridSquarePostThumbnailContainerFrame}
                >
                  <Image 
                    source={{ uri: post.imageUrl || post.mediaUrl || `https://images.unsplash.com/photo-1558655146-d09347e92766?w=300&h=300&sig=${post.id}` }} 
                    style={styles.gridSquarePostThumbnailNativeImg} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'saved' && (
            <View style={styles.masonryThreeColumnWrapGrid}>
              {savedPosts.map((post: Post) => (
                <TouchableOpacity 
                  key={post.id} 
                  onPress={() => setSelectedPost(post)}
                  style={styles.gridSquarePostThumbnailContainerFrame}
                >
                  <Image 
                    source={{ uri: post.imageUrl || post.mediaUrl || `https://images.unsplash.com/photo-1558655146-d09347e92766?w=300&h=300&sig=${post.id}` }} 
                    style={styles.gridSquarePostThumbnailNativeImg} 
                  />
                </TouchableOpacity>
              ))}

              {savedPosts.length === 0 && (
                <View style={styles.emptyStateContainerCenteredBlock}>
                  <View style={styles.emptyStateCircularIconPlaceholderGlowBox}>
                    <Bookmark size={28} color="#64748b" />
                  </View>
                  <Text style={styles.emptyStateInfoHeadlineTypographyLabel}>No saved posts yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'collections' && (
            <View style={styles.collectionsDoubleColumnWrapGrid}>
              <TouchableOpacity 
                onPress={() => setIsNewCollectionModalOpen(true)}
                style={styles.dashedRectangleGridCollectionAdderCardTrigger}
              >
                <Plus size={24} color="#64748b" />
                <Text style={styles.dashedRectangleGridCollectionAdderLabel}>New Collection</Text>
              </TouchableOpacity>

              {currentUser.collections?.map((collection: Collection) => (
                <TouchableOpacity key={collection.id} style={styles.collectionAsymmetricalWideCardFrame}>
                  <Image 
                    source={{ uri: collection.coverImageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=225' }} 
                    style={styles.collectionCoverThumbnailNativeImg} 
                  />
                  <View style={styles.absoluteBottomFadedScrimOverlayGradient} />
                  <View style={styles.collectionCardMetadataBottomAbsoluteContainer}>
                    <Text style={styles.collectionTitleLabelTypographyText}>{collection.name}</Text>
                    <Text style={styles.collectionPostsCountCapsIndicatorLabel}>{collection.postIds.length} posts</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Primary Native Modal Layer Infrastructure Subsystem */}
      {isCreatorOpen && <StoryCreator onClose={() => setIsCreatorOpen(false)} />}
      {isPostCreatorOpen && <PostCreator isOpen={isPostCreatorOpen} onClose={() => setIsPostCreatorOpen(false)} />}
      {selectedPost && <PostViewer post={selectedPost} isOpen={!!selectedPost} onClose={() => setSelectedPost(null)} />}

      {activeStoryIndex !== null && (
        <StoryViewer
          stories={myStories}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
        />
      )}

      {/* Add New Collection Form Validation Floating Native Dialog Template */}
      <Modal visible={isNewCollectionModalOpen} transparent animationType="fade">
        <View style={styles.modalViewportCenteringOverlayContainer}>
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => setIsNewCollectionModalOpen(false)} 
            style={styles.modalViewportAbsoluteBackgroundDimDismissal} 
          />
          <Animated.View entering={FadeIn} style={styles.modalFormAlertDeckShellCard}>
            <Text style={styles.modalAlertHeaderTitleTypographyLabel}>New Collection</Text>
            <TextInput
              autoFocus
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              placeholder="Collection name"
              placeholderTextColor="rgba(15,23,42,0.3)"
              style={styles.modalPrimaryTextInputFieldNativeElement}
            />
            <View style={styles.modalActionRowButtonsFlexContainer}>
              <TouchableOpacity 
                onPress={() => setIsNewCollectionModalOpen(false)} 
                style={styles.modalFormCancelButtonInlineAction}
              >
                <Text style={styles.modalFormCancelButtonInlineActionLabel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleCreateCollection} 
                style={styles.modalFormConfirmActionButtonStadiumPill}
              >
                <Text style={styles.modalFormConfirmActionButtonStadiumPillLabel}>Create</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <UserListModal 
        isOpen={!!showList}
        onClose={() => setShowList(null)}
        title={showList || ''}
        users={listData}
        isLoading={isListLoading}
        onUserClick={(u: User) => {
          if (u.id === currentUser?.id) {
            onNavigate('profile');
          } else {
            setActiveContactId?.(u.id);
            onNavigate('contact-profile');
          }
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  viewportBaseFrame: { flex: 1, backgroundColor: '#ffffff' },
  stickyHeaderPanel: { width: '100%', backgroundColor: 'rgba(248, 250, 252, 0.85)', borderBottomWidth: 1, borderColor: 'rgba(15, 23, 42, 0.06)', justifyContent: 'flex-end', zIndex: 99 },
  headerContentWrapper: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  brandingLogoTextHeadline: { fontSize: 24, fontWeight: '900', color: '#0057bd', letterSpacing: -1 },
  headerAvatarCircularBadgeBorder: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: '#cbd5e1', overflow: 'hidden' },
  headerMiniAvatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  mainScrollStackContainer: { flexGrow: 1, paddingTop: 16 },

  // Profile Specific Identity Metadata Section Properties Layout Block
  profileMetaHeroSection: { alignItems: 'center', paddingHorizontal: 24, marginBottom: 32 },
  largeAvatarCompositeLayoutFrame: { width: 144, height: 144, position: 'relative', marginBottom: 16 },
  largeAvatarCircularBorderCard: { width: '100%', height: '100%', borderRadius: 72, borderWidth: 4, borderColor: '#ffffff', backgroundColor: '#f1f5f9', overflow: 'hidden', shadowColor: '#0057bd', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16 },
  largeProfileAvatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  floatingPenIconButtonIndicator: { position: 'absolute', bottom: 4, right: 4, width: 36, height: 36, borderRadius: 18, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 },
  
  identityMetadataBlock: { alignItems: 'center', gap: 2, marginBottom: 8 },
  displayNameTextHeadline: { fontSize: 26, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5, textAlign: 'center' },
  usernameHandleTextSubtitle: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  bioParagraphBodyText: { fontSize: 14, color: '#334155', textAlign: 'center', paddingHorizontal: 16, lineHeight: 20, marginBottom: 18, fontWeight: '500' },

  // Asymmetrical Followers Metrics Segment Box Configurations
  socialStatsHorizontalCounterRow: { flexDirection: 'row', justifyContent: 'center', gap: 32, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9', width: '100%', marginBottom: 20 },
  statSegmentCounterClickableBlock: { alignItems: 'center', gap: 2 },
  statIntegerCountLabelValue: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  statSectionLabelCapsText: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },

  profileActionCtaButtonsHorizontalRow: { flexDirection: 'row', gap: 10, width: '100%', paddingHorizontal: 8 },
  primaryActionButtonGradientShape: { flex: 1, height: 46, borderRadius: 23, backgroundColor: '#0057bd', justifyContent: 'center', alignItems: 'center', shadowColor: '#0057bd', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  primaryActionButtonGradientLabelText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  secondaryGlassOutlineActionButton: { flex: 1, height: 46, borderRadius: 23, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  secondaryGlassOutlineActionButtonLabelText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },

  // Horizontal Feed Stories Custom Slider parameters
  storiesContainerSectionGap: { marginBottom: 28 },
  sectionHeaderMetaRowBlock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 12 },
  sectionHeadingTitleText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  sectionHeadingInlineActionLink: { fontSize: 13, fontWeight: '700', color: '#0057bd' },
  storiesHorizontalListTrack: { paddingLeft: 24, paddingRight: 12, gap: 12 },
  dashedStoryCreativeAdderCardTrigger: { width: 112, height: 164, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc' },
  innerCircularPlusBadgeWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 87, 189, 0.06)', justifyContent: 'center', alignItems: 'center' },
  dashedStoryCreativeAdderLabelText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  storyThumbnailCardContainerFrame: { width: 112, height: 164, borderRadius: 24, overflow: 'hidden', position: 'relative', backgroundColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
  storyMediaThumbnailNativeImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  absoluteBottomFadedScrimOverlayGradient: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.25)' },
  storyTimestampAbsoluteMetaLabelText: { position: 'absolute', bottom: 10, left: 10, color: '#ffffff', fontSize: 11, fontWeight: '600' },

  // Horizontal Navigation Top Level Selectors Segment Controls Bars
  tabBarControlSelectionRowTrack: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#f1f5f9', width: '100%', paddingHorizontal: 12, marginBottom: 12 },
  tabBarInteractiveSegmentLink: { flex: 1, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderBottomWidth: 2, borderColor: 'transparent' },
  activeTabBarInteractiveSegmentLinkBorder: { borderColor: '#0057bd' },
  tabBarInteractiveSegmentLabel: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  activeTabBarInteractiveSegmentLabelText: { color: '#0057bd' },

  // Grid Core Displays Architect Panels Models
  tabContentBlockViewGridContainer: { paddingHorizontal: 16 },
  masonryThreeColumnWrapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, width: '100%' },
  dashedSquareGridPostAdderCardTrigger: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1', backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dashedSquareGridPostAdderCapsLabel: { fontSize: 9, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  gridSquarePostThumbnailContainerFrame: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f1f5f9' },
  gridSquarePostThumbnailNativeImg: { width: '100%', height: '100%', resizeMode: 'cover' },

  emptyStateContainerCenteredBlock: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyStateCircularIconPlaceholderGlowBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyStateInfoHeadlineTypographyLabel: { fontSize: 14, fontWeight: '600', color: '#64748b', textAlign: 'center' },

  collectionsDoubleColumnWrapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%' },
  dashedRectangleGridCollectionAdderCardTrigger: { width: (SCREEN_WIDTH - 44) / 2, aspectRatio: 16 / 10, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1', backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dashedRectangleGridCollectionAdderLabel: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  collectionAsymmetricalWideCardFrame: { width: (SCREEN_WIDTH - 44) / 2, aspectRatio: 16 / 10, borderRadius: 24, overflow: 'hidden', position: 'relative', backgroundColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  collectionCoverThumbnailNativeImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  collectionCardMetadataBottomAbsoluteContainer: { position: 'absolute', bottom: 12, left: 14, right: 14, zIndex: 5 },
  collectionTitleLabelTypographyText: { fontSize: 15, fontWeight: '800', color: '#ffffff', letterSpacing: -0.3 },
  collectionPostsCountCapsIndicatorLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },

  // Shared Floating Overlay Modals UI Components Architecture Space
  modalViewportCenteringOverlayContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalViewportAbsoluteBackgroundDimDismissal: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,23,42,0.4)' },
  modalFormAlertDeckShellCard: { width: '100%', maxWidth: 340, backgroundColor: '#ffffff', borderRadius: 32, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8, zIndex: 10 },
  modalAlertHeaderTitleTypographyLabel: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 16, letterSpacing: -0.5 },
  modalPrimaryTextInputFieldNativeElement: { width: '100%', height: 50, backgroundColor: '#f1f5f9', borderRadius: 14, paddingHorizontal: 16, fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 20 },
  modalActionRowButtonsFlexContainer: { flexDirection: 'row', gap: 12, width: '100%' },
  modalFormCancelButtonInlineAction: { flex: 1, height: 46, justifyContent: 'center', alignItems: 'center' },
  modalFormCancelButtonInlineActionLabel: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  modalFormConfirmActionButtonStadiumPill: { flex: 1, height: 46, borderRadius: 23, backgroundColor: '#0057bd', justifyContent: 'center', alignItems: 'center', shadowColor: '#0057bd', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
  modalFormConfirmActionButtonStadiumPillLabel: { color: '#ffffff', fontSize: 14, fontWeight: '700' }
});