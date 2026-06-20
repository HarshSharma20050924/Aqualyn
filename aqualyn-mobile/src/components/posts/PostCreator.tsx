import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { X, Image as ImageIcon, Video, Check, MapPin, Tag, Music } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppContext } from '../../context/AppContext';
import { uploadFile } from '../../utils/uploads';

interface PostCreatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PostCreator({ isOpen, onClose }: PostCreatorProps) {
  const { addPost, addToast, currentUser } = useAppContext();
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [location, setLocation] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = async (type: 'image' | 'video') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setMediaUrl(result.assets[0].uri);
        setMediaType(type);
      }
    } catch (error) {
      console.error('ImagePicker Error:', error);
      addToast('Failed to select media', 'error');
    }
  };

  const handlePost = async () => {
    if (!mediaUrl && !caption.trim()) {
      addToast('Please add a photo, video, or caption', 'error');
      return;
    }

    setIsUploading(true);
    try {
      let finalMediaUrl = mediaUrl;
      if (mediaUrl && !mediaUrl.startsWith('http')) {
        finalMediaUrl = await uploadFile({ uri: mediaUrl, type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg' });
      }

      await addPost({
        caption,
        mediaUrl: finalMediaUrl || undefined,
        mediaType: mediaType || undefined,
        userId: currentUser?.id,
        userName: currentUser?.name,
        userAvatar: currentUser?.avatar,
        timestamp: 'Just now',
        likes: [],
        comments: []
      });
      handleClose();
    } catch (e) {
      addToast('Failed to prepare media', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setCaption('');
    setMediaUrl(null);
    setMediaType(null);
    setLocation('');
    setIsUploading(false);
    onClose();
  };

  const isFormInvalid = (!mediaUrl && !caption.trim()) || isUploading;

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalViewportContainerCanvas}
      >
        <Animated.View 
           
           
          style={styles.creatorScreenWrapperFrame}
        >
          {/* Top Form Navigation Action Bar */}
          <View style={styles.topHeaderNavigationToolbar}>
            <TouchableOpacity onPress={handleClose} style={styles.headerDismissCircularButtonBox}>
              <X size={22} color="#0f172a" />
            </TouchableOpacity>
            <Text style={styles.headerToolbarPrimaryTitleText}>New Post</Text>
            <TouchableOpacity 
              onPress={handlePost}
              disabled={isFormInvalid}
              style={[styles.headerActionShareButtonCapsule, isFormInvalid && styles.shareActionDisabledStateOpacity]}
            >
              <Text style={styles.shareActionButtonTextLabelText}>
                {isUploading ? 'Posting' : 'Share'}
              </Text>
              {!isUploading && <Check size={14} color="#ffffff" strokeWidth={3} />}
            </TouchableOpacity>
          </View>

          {/* Form Content Scrolling Dock */}
          <ScrollView 
            style={styles.formBodyScrollableSurfaceBox}
            contentContainerStyle={styles.scrollableContentInnerOffsetPadding}
            keyboardShouldPersistTaps="handled"
          >
            {/* Context User Author Row Layout */}
            <View style={styles.authorSectionFlexHorizontalRow}>
              <Image source={{ uri: currentUser?.avatar }} style={styles.authorAvatarProfileGraphicFrame} />
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Write a caption..."
                placeholderTextColor="rgba(15, 23, 42, 0.35)"
                multiline
                style={styles.captionMultiLineTextInputFieldEngine}
              />
            </View>

            {/* Media Asset Preview Box / Media Picker Dynamic Triggers Block */}
            {mediaUrl ? (
              <View style={styles.mediaAssetPreviewContainerCard}>
                <Image source={{ uri: mediaUrl }} style={styles.mediaPreviewAssetTargetSourceImage} />
                {mediaType === 'video' && (
                  <View style={styles.videoBadgeIndicatorAbsoluteCornerBox}>
                    <Text style={styles.videoBadgeTextLabelTypography}>Video Attached</Text>
                  </View>
                )}
                <TouchableOpacity 
                  onPress={() => { setMediaUrl(null); setMediaType(null); }}
                  style={styles.mediaClearFloatingAbsoluteCircularButton}
                >
                  <X size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pickerGridTwinCellsHorizontalRow}>
                <TouchableOpacity 
                  onPress={() => handleFileSelect('image')}
                  style={[styles.pickerSquareInteractiveCellCard, styles.photoPickerCellCustomBorderSpec]}
                >
                  <View style={styles.pickerGraphicCircularBackdropFrame}>
                    <ImageIcon size={24} color="#6366f1" />
                  </View>
                  <Text style={styles.pickerSquareCellPrimaryLabelTypography}>Add Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleFileSelect('video')}
                  style={[styles.pickerSquareInteractiveCellCard, styles.videoPickerCellCustomBorderSpec]}
                >
                  <View style={styles.pickerGraphicCircularBackdropFrame}>
                    <Video size={24} color="#06b6d4" />
                  </View>
                  <Text style={styles.pickerSquareCellPrimaryLabelTypography}>Add Video</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Metadata Injection List Rows Strip */}
            <View style={styles.metaActionRowsListingStackContainer}>
              <TouchableOpacity style={styles.metaRowCellInteractiveLayoutContainer}>
                <View style={styles.metaRowLeftBlockContentGroup}>
                  <Tag size={20} color="#6366f1" />
                  <Text style={styles.metaRowPrimaryLabelTypographyText}>Tag People</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.metaRowCellInputFieldIntegrationWrapper}>
                <MapPin size={20} color="#06b6d4" style={styles.metaInputLeftIconAbsolutePositioning} />
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Add Location"
                  placeholderTextColor="rgba(15, 23, 42, 0.35)"
                  style={styles.metaRowInlineTextInputFieldEngine}
                />
              </View>

              <TouchableOpacity style={styles.metaRowCellInteractiveLayoutContainer}>
                <View style={styles.metaRowLeftBlockContentGroup}>
                  <Music size={20} color="#ec4899" />
                  <Text style={styles.metaRowPrimaryLabelTypographyText}>Add Music</Text>
                </View>
                <Text style={styles.metaRowRightActionPlaceholderMicroLabel}>Select track</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalViewportContainerCanvas: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  creatorScreenWrapperFrame: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 48 : 12,
  },
  topHeaderNavigationToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  headerDismissCircularButtonBox: {
    padding: 8,
    borderRadius: 20,
  },
  headerToolbarPrimaryTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerActionShareButtonCapsule: {
    height: 38,
    paddingHorizontal: 16,
    backgroundColor: '#6366f1',
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareActionDisabledStateOpacity: {
    opacity: 0.4,
  },
  shareActionButtonTextLabelText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  formBodyScrollableSurfaceBox: {
    flex: 1,
  },
  scrollableContentInnerOffsetPadding: {
    padding: 20,
    gap: 28,
  },
  authorSectionFlexHorizontalRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  authorAvatarProfileGraphicFrame: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#e2e8f0',
  },
  captionMultiLineTextInputFieldEngine: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
    minHeight: 100,
    paddingTop: 4,
    textAlignVertical: 'top',
  },
  mediaAssetPreviewContainerCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  mediaPreviewAssetTargetSourceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoBadgeIndicatorAbsoluteCornerBox: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  videoBadgeTextLabelTypography: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  mediaClearFloatingAbsoluteCircularButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerGridTwinCellsHorizontalRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pickerSquareInteractiveCellCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  photoPickerCellCustomBorderSpec: {
    borderColor: 'rgba(99, 102, 241, 0.25)',
    backgroundColor: 'rgba(99, 102, 241, 0.02)',
  },
  videoPickerCellCustomBorderSpec: {
    borderColor: 'rgba(6, 182, 212, 0.25)',
    backgroundColor: 'rgba(6, 182, 212, 0.02)',
  },
  pickerGraphicCircularBackdropFrame: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  pickerSquareCellPrimaryLabelTypography: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  metaActionRowsListingStackContainer: {
    gap: 12,
  },
  metaRowCellInteractiveLayoutContainer: {
    height: 54,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  metaRowLeftBlockContentGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaRowPrimaryLabelTypographyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  metaRowRightActionPlaceholderMicroLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  metaRowCellInputFieldIntegrationWrapper: {
    height: 54,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    position: 'relative',
    justifyContent: 'center',
  },
  metaInputLeftIconAbsolutePositioning: {
    position: 'absolute',
    left: 16,
    zIndex: 5,
  },
  metaRowInlineTextInputFieldEngine: {
    flex: 1,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
});