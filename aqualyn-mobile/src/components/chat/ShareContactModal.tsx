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
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { X, Search, Check } from 'lucide-react-native';

interface ShareContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (contactId: string) => void;
  appContext: any; // Mapped context framework passed explicitly
}

export default function ShareContactModal({ isOpen, onClose, onShare, appContext }: ShareContactModalProps) {
  const { chats, currentUser } = appContext;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  if (!isOpen) return null;

  const contacts = chats.filter((c: any) => !c.isGroup && !c.isSecret && c.id !== currentUser.id);
  const filteredContacts = contacts.filter((c: any) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleShare = () => {
    if (selectedContact) {
      onShare(selectedContact);
      onClose();
    }
  };

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={onClose}>
      <View style={styles.modalCenteredViewportAnchor}>
        
        {/* Backdrop Mask Tint Layer */}
        <Animated.View entering={FadeIn} exiting={FadeOut} style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.backdropClickDismissMask} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        {/* Modal Dialog Body Card */}
        <Animated.View 
          entering={ZoomIn.duration(200)}
          exiting={ZoomOut.duration(150)}
          style={styles.dialogGlassCardFrame}
        >
          {/* Header Action Row */}
          <View style={styles.dialogHeaderToolbarFlexRow}>
            <Text style={styles.dialogTitleHeaderTypographyText}>Share Contact</Text>
            <TouchableOpacity onPress={onClose} style={styles.headerDismissCircularActionButton}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Search Action Bar Field Input Box */}
          <View style={styles.searchBarWrapperRelativeBlock}>
            <Search size={18} color="#94a3b8" style={styles.searchBarInnerIconAbsoluteAnchor} />
            <TextInput
              placeholder="Search contacts..."
              placeholderTextColor="rgba(15, 23, 42, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchTextInputEngineFieldElement}
            />
          </View>

          {/* Scrollable Bound List Target Contact Stack */}
          <ScrollView style={styles.scrollableVerticalListStackMaxHeightContainer}>
            {filteredContacts.map((contact: any) => {
              const isCurrentSelected = selectedContact === contact.id;
              return (
                <TouchableOpacity
                  key={contact.id}
                  onPress={() => setSelectedContact(contact.id)}
                  style={[
                    styles.contactSelectionCellContainerRow,
                    isCurrentSelected && styles.contactCellStateActiveHighlightBg
                  ]}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: contact.avatar }} style={styles.contactCellProfileAvatarGraphic} />
                  <View style={styles.contactLabelStackFlexColumn}>
                    <Text style={styles.contactLabelItemTextPrimaryName}>{contact.name}</Text>
                    <Text style={styles.contactLabelItemTextMicroSubtextMessage} numberOfLines={1}>
                      {contact.lastMessage}
                    </Text>
                  </View>
                  {isCurrentSelected && (
                    <View style={styles.selectedStatusCheckmarkCircularIndicator}>
                      <Check size={12} color="#ffffff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {filteredContacts.length === 0 && (
              <Text style={styles.emptyResultsWarningTextLabelCentered}>No contacts found</Text>
            )}
          </ScrollView>

          {/* Core Footer CTA Share Trigger Action Button */}
          <TouchableOpacity
            onPress={handleShare}
            disabled={!selectedContact}
            style={[styles.footerShareActionCtaButtonNode, !selectedContact && styles.ctaStateDisabledOpacity]}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaButtonTypographyTextLabel}>Share</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalCenteredViewportAnchor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdropClickDismissMask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialogGlassCardFrame: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  dialogHeaderToolbarFlexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dialogTitleHeaderTypographyText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerDismissCircularActionButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
  },
  searchBarWrapperRelativeBlock: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 16,
  },
  searchBarInnerIconAbsoluteAnchor: {
    position: 'absolute',
    left: 14,
    zIndex: 5,
  },
  searchTextInputEngineFieldElement: {
    height: 48,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    borderRadius: 14,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 14,
    color: '#0f172a',
  },
  scrollableVerticalListStackMaxHeightContainer: {
    maxHeight: 240,
    marginBottom: 20,
  },
  contactSelectionCellContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  contactCellStateActiveHighlightBg: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  contactCellProfileAvatarGraphic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
  },
  contactLabelStackFlexColumn: {
    flex: 1,
  },
  contactLabelItemTextPrimaryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  contactLabelItemTextMicroSubtextMessage: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  selectedStatusCheckmarkCircularIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyResultsWarningTextLabelCentered: {
    textAlign: 'center',
    color: '#94a3b8',
    paddingVertical: 20,
    fontSize: 13,
  },
  footerShareActionCtaButtonNode: {
    width: '100%',
    height: 52,
    backgroundColor: '#6366f1',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  ctaStateDisabledOpacity: {
    opacity: 0.4,
  },
  ctaButtonTypographyTextLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});