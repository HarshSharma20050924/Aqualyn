import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { X, Heart, MessageCircle, Share2, MoreHorizontal, Send, Bookmark, Pin, Archive, FolderPlus, Link as LinkIcon } from 'lucide-react-native';
import { Post } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface PostViewerProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export default function PostViewer({ post, isOpen, onClose }: PostViewerProps) {
  const { currentUser, likePost, commentPost, addToast, archivePost, pinPost, savePost, chats } = useAppContext();
  const [isLiked, setIsLiked] = useState(post.likes.includes(currentUser?.id || ''));
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showChatPicker, setShowChatPicker] = useState(false);

  if (!isOpen) return null;

  const handleLike = () => {
    likePost(post.id);
    setIsLiked(!isLiked);
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentPost(post.id, commentText);
    setCommentText('');
    addToast('Comment added', 'success');
  };

  const handleShareToChat = (chatId: string) => {
    addToast('Post shared to chat', 'success');
    setShowChatPicker(false);
    setShowMenu(false);
  };

  const isSaved = currentUser?.savedPostIds?.includes(post.id);

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={onClose}>
      <View style={styles.viewerContainerBlackoutViewport}>
        
        {/* Post Dynamic Context Bar Header */}
        <View style={styles.viewerToolbarHeaderRow}>
          <View style={styles.headerLeftActionGroup}>
            <TouchableOpacity onPress={onClose} style={styles.toolbarTransparentUtilityButton}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerUserMetaDetailsBadge}>
              <Image 
                source={{ uri: post.userAvatar || `https://ui-avatars.com/api/?name=${post.userName}&background=random` }} 
                style={styles.headerAvatarProfileImageGraphic} 
              />
              <Text style={styles.headerProfileUsernameTypographyText}>{post.userName}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.toolbarTransparentUtilityButton}>
            <MoreHorizontal size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Scaled Media Viewer Presentation Node Container */}
        <View style={styles.mediaAspectDockStretchBox}>
          <Image source={{ uri: post.imageUrl || post.mediaUrl }} style={styles.targetMediaAssetSourceImageFit} />
        </View>

        {/* Bottom Static Information & Dashboard Panel */}
        <View style={styles.dashboardAbsoluteControlMetadataPanel}>
          <View style={styles.dashboardQuickActionsToolbarStrip}>
            <View style={styles.dashboardLeftControlGroup}>
              <TouchableOpacity onPress={handleLike} style={styles.dashboardActionIconTriggerButton}>
                <Heart size={26} color={isLiked ? '#ef4444' : '#ffffff'} fill={isLiked ? '#ef4444' : 'transparent'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowComments(true)} style={styles.dashboardActionIconTriggerButton}>
                <MessageCircle size={26} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowChatPicker(true)} style={styles.dashboardActionIconTriggerButton}>
                <Share2 size={26} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => savePost(post.id)} style={styles.dashboardActionIconTriggerButton}>
              <Bookmark size={26} color={isSaved ? '#f59e0b' : '#ffffff'} fill={isSaved ? '#f59e0b' : 'transparent'} />
            </TouchableOpacity>
          </View>

          <Text style={styles.dashboardLikesCounterMetricsLabelText}>{post.likes.length} likes</Text>
          
          <View style={styles.captionBlockLayoutTextContainer}>
            <Text style={styles.captionBodyParagraphTypographyText}>
              <Text style={styles.captionUsernameStrongBoldPrefix}>{post.userName} </Text>
              {post.caption}
            </Text>
          </View>

          {post.comments.length > 0 && (
            <TouchableOpacity onPress={() => setShowComments(true)}>
              <Text style={styles.commentsOverlayTriggerActionLinkSubtext}>View all {post.comments.length} comments</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.timestampBottomStaticLabelMicroText}>{post.timestamp}</Text>
        </View>

        {/* CONTEXT ACTIONS POPUP MENU MENU DIALOG */}
        {showMenu && (
          <View style={styles.menuOverlayModalCenteringViewport}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowMenu(false)} />
            <Animated.View  style={styles.menuCardStructureWrapperCanvas}>
              {post.userId === currentUser?.id && (
                <>
                  <TouchableOpacity onPress={() => { pinPost(post.id); setShowMenu(false); }} style={styles.menuInteractiveRowItemCellButton}>
                    <Pin size={18} color="#0f172a" />
                    <Text style={styles.menuItemRowLabelTypographyText}>Pin to profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { archivePost(post.id); setShowMenu(false); }} style={styles.menuInteractiveRowItemCellButton}>
                    <Archive size={18} color="#0f172a" />
                    <Text style={styles.menuItemRowLabelTypographyText}>Archive</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={styles.menuInteractiveRowItemCellButton}>
                <FolderPlus size={18} color="#0f172a" />
                <Text style={styles.menuItemRowLabelTypographyText}>Add to collection</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuInteractiveRowItemCellButton}>
                <LinkIcon size={18} color="#0f172a" />
                <Text style={styles.menuItemRowLabelTypographyText}>Copy link</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowMenu(false)} style={styles.menuItemCancelActionCtaRowButton}>
                <Text style={styles.menuItemCancelActionCtaLabelTextText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* CHAT SELECTION WORKFLOW SLIDEOVER MODAL */}
        {showChatPicker && (
          <View style={styles.menuOverlayModalCenteringViewport}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowChatPicker(false)} />
            <Animated.View  style={styles.chatPickerPanelContainerSheetCard}>
              <View style={styles.chatPickerHeaderToolbarRow}>
                <Text style={styles.chatPickerHeaderPrimaryHeadingText}>Share to Chat</Text>
                <TouchableOpacity onPress={() => setShowChatPicker(false)}>
                  <X size={20} color="#0f172a" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.chatPickerItemsVerticalScrollSurface}>
                {chats.map((c: any) => (
                  <TouchableOpacity key={c.id} onPress={() => handleShareToChat(c.id)} style={styles.chatPickerItemInteractiveRowCellField}>
                    <Image source={{ uri: c.avatar || `https://ui-avatars.com/api/?name=${c.name}` }} style={styles.chatPickerRowItemAvatarImage} />
                    <Text style={styles.chatPickerRowItemClientNameTypographyText} numberOfLines={1}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          </View>
        )}

        {/* SLIDABLE DETACHED BOTTOM COMMENTS COMPONENT DRAWER PANEL */}
        {showComments && (
          <View style={styles.commentsAbsoluteDrawerBackdropLayerMask}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowComments(false)} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.commentsKeyboardAvoidingSheetContainer}>
              <Animated.View   style={styles.commentsDrawerPanelCanvasBody}>
                <View style={styles.commentsHeaderToolbarFixedRow}>
                  <Text style={styles.commentsHeaderPrimaryTitleLabelText}>Comments</Text>
                  <TouchableOpacity onPress={() => setShowComments(false)} style={styles.commentsHeaderDismissIconCirclePill}>
                    <X size={18} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.commentsScrollableListingBodyStackContainer}>
                  {post.comments.map((comment) => (
                    <View key={comment.id} style={styles.commentRowItemLayoutFlexibleCellBlock}>
                      <Image source={{ uri: comment.userAvatar }} style={styles.commentRowItemAvatarImageCircle} />
                      <View style={styles.commentRowItemTextContentFlexibleColumn}>
                        <View style={styles.commentRowItemAuthorMetadataLineGroup}>
                          <Text style={styles.commentRowAuthorUsernameLabelText}>{comment.userName}</Text>
                          <Text style={styles.commentRowTimeMetaLabelText}>{comment.timestamp}</Text>
                        </View>
                        <Text style={styles.commentRowBodyMessageParagraphTypography}>{comment.text}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.commentsFooterInputFixedIntegrationBarBox}>
                  <View style={styles.commentsInputInlineRowLayoutFieldWrapper}>
                    <TextInput
                      value={commentText}
                      onChangeText={setCommentText}
                      placeholder="Add a comment..."
                      placeholderTextColor="rgba(15, 23, 42, 0.35)"
                      style={styles.commentsInlineTextInputEngineFieldElement}
                    />
                    <TouchableOpacity onPress={handleComment} disabled={!commentText.trim()} style={styles.commentsInputInlineRowSubmitActionButton}>
                      <Send size={18} color="#6366f1" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </View>
        )}

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  viewerContainerBlackoutViewport: {
    flex: 1,
    backgroundColor: '#000000',
  },
  viewerToolbarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 20,
  },
  headerLeftActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolbarTransparentUtilityButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  headerUserMetaDetailsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAvatarProfileImageGraphic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerProfileUsernameTypographyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  mediaAspectDockStretchBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetMediaAssetSourceImageFit: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  dashboardAbsoluteControlMetadataPanel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    gap: 10,
  },
  dashboardQuickActionsToolbarStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dashboardLeftControlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dashboardActionIconTriggerButton: {
    padding: 4,
  },
  dashboardLikesCounterMetricsLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  captionBlockLayoutTextContainer: {
    flexDirection: 'row',
  },
  captionBodyParagraphTypographyText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  captionUsernameStrongBoldPrefix: {
    fontWeight: '700',
  },
  commentsOverlayTriggerActionLinkSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    marginTop: 2,
  },
  timestampBottomStaticLabelMicroText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  menuOverlayModalCenteringViewport: {
    position: 'absolute',
    inset: 0,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuCardStructureWrapperCanvas: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    padding: 8,
  },
  menuInteractiveRowItemCellButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  menuItemRowLabelTypographyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  menuItemCancelActionCtaRowButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    marginTop: 4,
  },
  menuItemCancelActionCtaLabelTextText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
  chatPickerPanelContainerSheetCard: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '50%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
  },
  chatPickerHeaderToolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  chatPickerHeaderPrimaryHeadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  chatPickerItemsVerticalScrollSurface: {
    padding: 12,
  },
  chatPickerItemInteractiveRowCellField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.03)',
    borderRadius: 14,
    marginBottom: 8,
  },
  chatPickerRowItemAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  chatPickerRowItemClientNameTypographyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  commentsAbsoluteDrawerBackdropLayerMask: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    zIndex: 50,
  },
  commentsKeyboardAvoidingSheetContainer: {
    width: '100%',
    height: '70%',
  },
  commentsDrawerPanelCanvasBody: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  commentsHeaderToolbarFixedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  commentsHeaderPrimaryTitleLabelText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  commentsHeaderDismissIconCirclePill: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
  },
  commentsScrollableListingBodyStackContainer: {
    flex: 1,
    padding: 16,
  },
  commentRowItemLayoutFlexibleCellBlock: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  commentRowItemAvatarImageCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  commentRowItemTextContentFlexibleColumn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
  },
  commentRowItemAuthorMetadataLineGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 2,
  },
  commentRowAuthorUsernameLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  commentRowTimeMetaLabelText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  commentRowBodyMessageParagraphTypography: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  commentsFooterInputFixedIntegrationBarBox: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    backgroundColor: '#ffffff',
  },
  commentsInputInlineRowLayoutFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    height: 46,
  },
  commentsInlineTextInputEngineFieldElement: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  commentsInputInlineRowSubmitActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
});