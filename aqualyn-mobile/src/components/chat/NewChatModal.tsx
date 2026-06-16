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
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { X, Search, Users, ArrowRight, Camera, Check, ArrowLeft, Shield, Clock, UserPlus } from 'lucide-react-native';

// --- Native Custom Toggle Component ---
const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() => onChange(!checked)}
    style={[styles.toggleTrackShape, checked ? styles.toggleTrackActive : styles.toggleTrackInactive]}
  >
    <View style={[styles.toggleThumbCircle, checked ? styles.toggleThumbActive : styles.toggleThumbInactive]} />
  </TouchableOpacity>
);

const ToggleRow = ({ icon, title, subtitle, state, setState }: any) => (
  <View style={styles.toggleRowFlexContainer}>
    <View style={styles.toggleRowContentLeftPart}>
      <View style={styles.toggleIconCircularFrame}>
        {icon}
      </View>
      <View>
        <Text style={styles.toggleRowTitleTypography}>{title}</Text>
        {subtitle && <Text style={styles.toggleRowSubtitleTypography}>{subtitle}</Text>}
      </View>
    </View>
    <Toggle checked={state} onChange={setState} />
  </View>
);

// --- Main Component ---
interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (s: string) => void;
  appContext: any; // Context mapping passed as a prop injection or hook alias
}

export default function NewChatModal({ isOpen, onClose, onNavigate, appContext }: NewChatModalProps) {
  const { contacts, currentUser, startChatWithContact, createGroupChat, globalUsers } = appContext;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [mode, setMode] = useState<'default' | 'group-select' | 'group-info'>('default');
  
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [disappearing, setDisappearing] = useState(false);
  const [adminOnly, setAdminOnly] = useState(false);

  if (!isOpen) return null;

  const allAvailableUsers = [
    ...contacts.map((c: any) => ({ id: c.id, name: c.name, avatar: c.avatar, role: c.role || 'Contact', isContact: true })),
    ...globalUsers
      .filter((u: any) => !contacts.some((c: any) => c.id === u.id) && u.id !== currentUser?.id)
      .map((u: any) => ({
        id: u.id,
        name: u.displayName || u.username || 'Aqualyn User',
        avatar: u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username || 'U'}`,
        role: u.bio || 'Aqualyn User',
        isContact: false
      }))
  ];

  const filteredContacts = allAvailableUsers.filter((u: any) => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleContact = (id: string) => {
    setSelectedContacts(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleContactClick = (id: string) => {
    if (mode === 'group-select') {
      toggleContact(id);
    } else {
      startChatWithContact(id);
      handleClose();
      onNavigate('chat-detail');
    }
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedContacts.length === 0) return;
    createGroupChat(groupName, selectedContacts, {
      description: groupDesc,
      adminOnly,
      disappearingMessages: disappearing
    });
    handleClose();
    onNavigate('chat-detail');
  };

  const handleClose = () => {
    setMode('default');
    setSelectedContacts([]);
    setGroupName('');
    setGroupDesc('');
    setSearchQuery('');
    setDisappearing(false);
    setAdminOnly(false);
    onClose();
  };

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={handleClose}>
      <View style={styles.modalViewportContainerAnchor}>
        
        {/* Backdrop Dismiss Layer */}
        <Animated.View entering={FadeIn} exiting={FadeOut} style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.fullScreenMaskBackdropClick} activeOpacity={1} onPress={handleClose} />
        </Animated.View>

        {/* Dynamic Slidable Bottom Sheet Canvas Frame */}
        <Animated.View 
          entering={SlideInDown.springify().damping(25).stiffness(200)}
          exiting={SlideOutDown}
          style={styles.bottomSheetWrapperBodyCard}
        >
          {/* Header Action Bar */}
          <View style={styles.headerFlexToolbarFrame}>
            {mode !== 'default' && (
              <TouchableOpacity 
                onPress={() => setMode(mode === 'group-info' ? 'group-select' : 'default')}
                style={styles.backActionButtonCircularCircle}
              >
                <ArrowLeft size={24} color="#0f172a" />
              </TouchableOpacity>
            )}
            <View style={styles.titleStackedTextLabelsColumn}>
              <Text style={styles.toolbarPrimaryTitleText}>
                {mode === 'default' ? 'New Chat' : 'New Group'}
              </Text>
              {mode === 'group-select' && <Text style={styles.toolbarSubtitleMicroLabel}>Add members</Text>}
              {mode === 'group-info' && <Text style={styles.toolbarSubtitleMicroLabel}>Add subject</Text>}
            </View>
            {mode === 'default' && (
              <TouchableOpacity onPress={handleClose} style={styles.backActionButtonCircularCircle}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          {/* Dynamic Content Views Switcher */}
          <ScrollView style={styles.scrollableContentAreaContainerCanvas} keyboardShouldPersistTaps="handled">
            
            {/* Selected Members Horizontal Dynamic Ribbon Row */}
            {mode === 'group-select' && selectedContacts.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedContactsHorizontalScrollRibbon}
              >
                {selectedContacts.map(id => {
                  const c = allAvailableUsers.find((user: any) => user.id === id);
                  if (!c) return null;
                  return (
                    <View key={id} style={styles.selectedAvatarWrapperBubbleItemNode}>
                      <View style={styles.avatarCircularShellFrameSquare}>
                        <Image source={{ uri: c.avatar }} style={styles.targetImageAvatarSquareNodeFill} />
                        <TouchableOpacity 
                          onPress={() => toggleContact(id)}
                          style={styles.avatarItemMicroAbsoluteDismissBadgeCircle}
                        >
                          <X size={10} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.avatarMicroTextLabelTruncated} numberOfLines={1}>
                        {c.name.split(' ')[0]}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* DEFAULT & SELECT MEMBER LIST SCREENS */}
            {(mode === 'default' || mode === 'group-select') && (
              <View>
                <View style={styles.inputSearchOuterWrapperContainerField}>
                  <Search size={20} color="#94a3b8" style={styles.searchInnerInputFieldIconAbsolutePosition} />
                  <TextInput
                    placeholder="Search contacts..."
                    placeholderTextColor="rgba(15, 23, 42, 0.4)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.textInputSearchFieldFormEngine}
                  />
                </View>

                {mode === 'default' && !searchQuery && (
                  <View style={styles.quickActionNavigationRowStackGroup}>
                    <TouchableOpacity onPress={() => setMode('group-select')} style={styles.actionRowFlexSelectionNode}>
                      <View style={styles.actionIconContainerCircularWrapperCircle}>
                        <Users size={22} color="#ffffff" />
                      </View>
                      <Text style={styles.actionRowLabelPrimaryTypographyHeading}>New Group</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Text style={styles.sectionDividerHeaderLabelCaps}>
                  Contacts on Aqualyn
                </Text>

                {filteredContacts.length === 0 ? (
                  <View style={styles.emptySearchPlaceholderCenteredCanvasBox}>
                    <Text style={styles.emptyPlaceholderTextParagraphTypography}>No contacts found</Text>
                  </View>
                ) : (
                  filteredContacts.map((contact: any) => (
                    <TouchableOpacity
                      key={contact.id}
                      onPress={() => handleContactClick(contact.id)}
                      style={styles.contactItemFlexRowCellContainerNode}
                    >
                      <View style={styles.avatarShellWrapperFrameAnchorSquare}>
                        <Image source={{ uri: contact.avatar }} style={styles.contactAvatarImageNodeContentElement} />
                        {mode === 'group-select' && selectedContacts.includes(contact.id) && (
                          <View style={styles.contactSelectionAbsoluteCheckmarkPillIndicator}>
                            <Check size={10} color="#ffffff" strokeWidth={3} />
                          </View>
                        )}
                      </View>
                      <View style={styles.contactMetadataDetailsFlexColumnBox}>
                        <Text style={styles.contactProfileNameHeadingTypography}>{contact.name}</Text>
                        <Text style={styles.contactProfileSubtitleRoleLabelTypography} numberOfLines={1}>
                          {contact.role}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* SETUP GROUP INFORMATION PROFILE META SCREEN */}
            {mode === 'group-info' && (
              <View style={styles.groupMetaSetupFormLayoutStructureContainer}>
                <View style={styles.groupAvatarImagePickerFlexibleRowContainer}>
                  <TouchableOpacity style={styles.groupAvatarCameraPlaceholderCircleFrame}>
                    <Camera size={24} color="#6366f1" />
                  </TouchableOpacity>
                  <View style={styles.groupNameInputWrapperBottomBorderFieldCell}>
                    <TextInput
                      placeholder="Group Name"
                      placeholderTextColor="rgba(15, 23, 42, 0.4)"
                      value={groupName}
                      onChangeText={setGroupName}
                      style={styles.groupInputFieldFormTypographyFontElementText}
                      autoFocus
                    />
                  </View>
                </View>

                <View style={styles.descriptionInputFieldWrapperFullWidthContainer}>
                  <TextInput
                    placeholder="Group Description (optional)"
                    placeholderTextColor="rgba(15, 23, 42, 0.4)"
                    value={groupDesc}
                    onChangeText={setGroupDesc}
                    style={styles.descriptionInputFieldFormTextTypography}
                  />
                </View>

                <View style={styles.toggleSettingsOuterBlockPartitionList}>
                  <Text style={styles.toggleSectionHeadingCapsLabelText}>Settings</Text>
                  <ToggleRow 
                    icon={<Clock size={20} color="#475569" />} 
                    title="Disappearing Messages" 
                    subtitle={disappearing ? "On" : "Off"} 
                    state={disappearing} 
                    setState={setDisappearing} 
                  />
                  <ToggleRow 
                    icon={<Shield size={20} color="#475569" />} 
                    title="Only Admins can send messages" 
                    state={adminOnly} 
                    setState={setAdminOnly} 
                  />
                </View>
              </View>
            )}

          </ScrollView>

          {/* Floating Action Confirmation Buttons Array */}
          {mode === 'group-select' && selectedContacts.length > 0 && (
            <TouchableOpacity 
              onPress={() => setMode('group-info')} 
              style={styles.floatingActionCircleStickyActionButtonElement}
            >
              <ArrowRight size={24} color="#ffffff" />
            </TouchableOpacity>
          )}

          {mode === 'group-info' && groupName.trim().length > 0 && (
            <TouchableOpacity 
              onPress={handleCreateGroup} 
              style={styles.floatingActionCircleStickyActionButtonElement}
            >
              <Check size={24} color="#ffffff" strokeWidth={2.5} />
            </TouchableOpacity>
          )}

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
  fullScreenMaskBackdropClick: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bottomSheetWrapperBodyCard: {
    height: '92%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  headerFlexToolbarFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  backActionButtonCircularCircle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.03)',
  },
  titleStackedTextLabelsColumn: {
    flex: 1,
    marginLeft: 12,
  },
  toolbarPrimaryTitleText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  toolbarSubtitleMicroLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  scrollableContentAreaContainerCanvas: {
    flex: 1,
  },
  selectedContactsHorizontalScrollRibbon: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  selectedAvatarWrapperBubbleItemNode: {
    width: 60,
    alignItems: 'center',
    gap: 6,
  },
  avatarCircularShellFrameSquare: {
    width: 56,
    height: 56,
    borderRadius: 28,
    position: 'relative',
  },
  targetImageAvatarSquareNodeFill: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  avatarItemMicroAbsoluteDismissBadgeCircle: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarMicroTextLabelTruncated: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  inputSearchOuterWrapperContainerField: {
    padding: 16,
    position: 'relative',
    justifyContent: 'center',
  },
  searchInnerInputFieldIconAbsolutePosition: {
    position: 'absolute',
    left: 32,
    zIndex: 10,
  },
  textInputSearchFieldFormEngine: {
    height: 52,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    borderRadius: 16,
    paddingLeft: 52,
    paddingRight: 20,
    fontSize: 15,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.02)',
  },
  quickActionNavigationRowStackGroup: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionRowFlexSelectionNode: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 16,
    gap: 16,
  },
  actionIconContainerCircularWrapperCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRowLabelPrimaryTypographyHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionDividerHeaderLabelCaps: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94a3b8',
    paddingHorizontal: 20,
    marginVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptySearchPlaceholderCenteredCanvasBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyPlaceholderTextParagraphTypography: {
    color: '#94a3b8',
    fontSize: 14,
  },
  contactItemFlexRowCellContainerNode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  },
  avatarShellWrapperFrameAnchorSquare: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  contactAvatarImageNodeContentElement: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
  },
  contactSelectionAbsoluteCheckmarkPillIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6366f1',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactMetadataDetailsFlexColumnBox: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    paddingBottom: 12,
  },
  contactProfileNameHeadingTypography: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  contactProfileSubtitleRoleLabelTypography: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  groupMetaSetupFormLayoutStructureContainer: {
    padding: 20,
  },
  groupAvatarImagePickerFlexibleRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
  },
  groupAvatarCameraPlaceholderCircleFrame: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  groupNameInputWrapperBottomBorderFieldCell: {
    flex: 1,
    borderBottomWidth: 2,
    borderColor: '#6366f1',
    paddingBottom: 4,
  },
  groupInputFieldFormTypographyFontElementText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  descriptionInputFieldWrapperFullWidthContainer: {
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    paddingBottom: 6,
    marginBottom: 32,
  },
  descriptionInputFieldFormTextTypography: {
    fontSize: 14,
    color: '#0f172a',
  },
  toggleSettingsOuterBlockPartitionList: {
    gap: 16,
  },
  toggleSectionHeadingCapsLabelText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  toggleRowFlexContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleRowContentLeftPart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleIconCircularFrame: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleRowTitleTypography: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  toggleRowSubtitleTypography: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  toggleTrackShape: {
    width: 48,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: '#6366f1',
  },
  toggleTrackInactive: {
    backgroundColor: 'rgba(15, 23, 42, 0.1)',
  },
  toggleThumbCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleThumbInactive: {
    alignSelf: 'flex-start',
  },
  floatingActionCircleStickyActionButtonElement: {
    position: 'absolute',
    bottom: 24,
    right: 24,
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