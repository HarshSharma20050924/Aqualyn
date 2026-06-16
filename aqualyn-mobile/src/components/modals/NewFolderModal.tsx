import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Modal,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { X, FolderPlus, Check, ArrowLeft, Search, Plus } from 'lucide-react-native';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  appContext: any; // Mapped context parameter injection framework
}

export default function NewFolderModal({ isOpen, onClose, appContext }: NewFolderModalProps) {
  const { chats, createFolder, folders, addToast } = appContext;
  
  const [folderName, setFolderName] = useState('');
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState<'name' | 'chats'>('name');

  if (!isOpen) return null;

  const filteredChats = chats.filter((c: any) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleChat = (id: string) => {
    setSelectedChats(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleNextStep = () => {
    if (!folderName.trim()) return;
    const folderExists = folders.some((f: any) => f.name.toLowerCase() === folderName.trim().toLowerCase());
    if (folderExists) {
      addToast('A folder with this name already exists', 'error');
      return;
    }
    setStep('chats');
  };

  const handleCreate = () => {
    if (!folderName.trim()) return;
    createFolder(folderName, selectedChats);
    handleClose();
  };

  const handleClose = () => {
    setFolderName('');
    setSelectedChats([]);
    setStep('name');
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={handleClose}>
      <View style={styles.modalViewportContainerAnchor}>
        
        {/* Backdrop Dismiss Layer Mask Overlay */}
        <Animated.View entering={FadeIn} exiting={FadeOut} style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.fullScreenBackdropDismissClickMask} activeOpacity={1} onPress={handleClose} />
        </Animated.View>

        {/* Dynamic Slidable Bottom Sheet Content Wrapper */}
        <Animated.View 
          entering={SlideInDown.springify().damping(25).stiffness(200)}
          exiting={SlideOutDown}
          style={styles.bottomSheetWrapperBodyCard}
        >
          {/* Header Action Toolbar Row */}
          <View style={styles.headerFlexToolbarFrameBar}>
            <View style={styles.headerLayoutContentLeftPart}>
              <TouchableOpacity 
                onPress={() => step === 'chats' ? setStep('name') : handleClose()}
                style={styles.headerCircularActionButtonCellCircle}
              >
                {step === 'chats' ? <ArrowLeft size={24} color="#0f172a" /> : <X size={24} color="#0f172a" />}
              </TouchableOpacity>
              <Text style={styles.toolbarPrimaryTitleLabelText}>
                {step === 'name' ? 'New Folder' : 'Add Chats'}
              </Text>
            </View>
            {step === 'chats' && (
              <Text style={styles.headerCounterBadgeLabelMicroTypography}>
                {selectedChats.length} selected
              </Text>
            )}
          </View>

          {/* Dynamic Switch View Form Sections Content Core */}
          {step === 'name' ? (
            <View style={styles.formMetaConfigurationStructureBoxView}>
              <View style={styles.folderGraphicIconCircularBackgroundShell}>
                <FolderPlus size={36} color="#6366f1" />
              </View>

              <View style={styles.folderInputWrapperLineFieldCell}>
                <TextInput
                  placeholder="Folder name"
                  placeholderTextColor="rgba(15, 23, 42, 0.35)"
                  value={folderName}
                  onChangeText={setFolderName}
                  style={styles.folderTextInputEngineElementTypography}
                  textAlign="center"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                onPress={handleNextStep}
                disabled={!folderName.trim()}
                style={[styles.navigationForwardNextStepCtaButtonRow, !folderName.trim() && styles.ctaStateDisabledOpacityScale]}
              >
                <Plus size={20} color="#6366f1" />
                <Text style={styles.navigationForwardNextStepButtonTextTypography}>Add Chats</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.chatSelectionListStructuralStructureContainer}>
              <View style={styles.searchBarInputWrapperBlockCell}>
                <Search size={18} color="#94a3b8" style={styles.searchInnerIconAbsoluteAnchorPosition} />
                <TextInput
                  placeholder="Search chats..."
                  placeholderTextColor="rgba(15, 23, 42, 0.35)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.textInputSearchFieldEngineElementField}
                />
              </View>

              <ScrollView 
                style={styles.scrollableVerticalListStackCanvasContainer} 
                contentContainerStyle={styles.scrollableInnerListPaddingOffsetFix}
              >
                {filteredChats.map((chat: any) => {
                  const isSelected = selectedChats.includes(chat.id);
                  return (
                    <TouchableOpacity
                      key={chat.id}
                      onPress={() => toggleChat(chat.id)}
                      style={styles.chatSelectionRowItemFlexCellContainer}
                      activeOpacity={0.7}
                    >
                      <View style={styles.avatarShellWrapperFrameAnchorSquare}>
                        <Image source={{ uri: chat.avatar }} style={styles.targetImageAvatarProfileGraphicContent} />
                        {isSelected && (
                          <View style={styles.selectionAbsoluteCheckmarkIndicatorBadgeCircle}>
                            <Check size={10} color="#ffffff" strokeWidth={3} />
                          </View>
                        )}
                      </View>
                      <View style={styles.chatMetadataDetailsLayoutColumnCellBox}>
                        <Text style={styles.chatProfileHeadingTitleNameTypography}>{chat.name}</Text>
                        <Text style={styles.chatProfileParagraphMicroSubtextTypography} numberOfLines={1}>
                          {chat.lastMessage}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Core Floating Action Execution Button Anchor Frame Layer */}
          <View style={styles.bottomStickyFabAnchorFrameBoundaryBox}>
            {folderName.trim().length > 0 && (
              <Animated.View entering={ZoomIn} exiting={ZoomOut}>
                <TouchableOpacity 
                  onPress={handleCreate} 
                  style={styles.floatingActionCircleStickyActionButtonCircleElement}
                >
                  <Check size={26} color="#ffffff" strokeWidth={2.5} />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalViewportContainerAnchor: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  fullScreenBackdropDismissClickMask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bottomSheetWrapperBodyCard: {
    width: '100%',
    height: '85%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  headerFlexToolbarFrameBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  headerLayoutContentLeftPart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerCircularActionButtonCellCircle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
  },
  toolbarPrimaryTitleLabelText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerCounterBadgeLabelMicroTypography: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  formMetaConfigurationStructureBoxView: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  folderGraphicIconCircularBackgroundShell: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    marginBottom: 36,
  },
  folderInputWrapperLineFieldCell: {
    width: '100%',
    borderBottomWidth: 2,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    paddingBottom: 4,
    marginBottom: 32,
  },
  folderTextInputEngineElementTypography: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    height: 48,
  },
  navigationForwardNextStepCtaButtonRow: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  navigationForwardNextStepButtonTextTypography: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6366f1',
  },
  ctaStateDisabledOpacityScale: {
    opacity: 0.4,
  },
  chatSelectionListStructuralStructureContainer: {
    flex: 1,
  },
  searchBarInputWrapperBlockCell: {
    padding: 16,
    position: 'relative',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
  },
  searchInnerIconAbsoluteAnchorPosition: {
    position: 'absolute',
    left: 30,
    zIndex: 5,
  },
  textInputSearchFieldEngineElementField: {
    height: 48,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    borderRadius: 14,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 15,
    color: '#0f172a',
  },
  scrollableVerticalListStackCanvasContainer: {
    flex: 1,
  },
  scrollableInnerListPaddingOffsetFix: {
    padding: 12,
    paddingBottom: 96,
  },
  chatSelectionRowItemFlexCellContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 16,
  },
  avatarShellWrapperFrameAnchorSquare: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  targetImageAvatarProfileGraphicContent: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
  },
  selectionAbsoluteCheckmarkIndicatorBadgeCircle: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatMetadataDetailsLayoutColumnCellBox: {
    flex: 1,
  },
  chatProfileHeadingTitleNameTypography: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  chatProfileParagraphMicroSubtextTypography: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  bottomStickyFabAnchorFrameBoundaryBox: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    height: 56,
    width: 56,
  },
  floatingActionCircleStickyActionButtonCircleElement: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});