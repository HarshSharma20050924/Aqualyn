import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Check } from 'lucide-react-native';

interface DeleteChatDialogProps {
  isOpen: boolean;
  chatName: string;
  onConfirm: (forEveryone: boolean) => void;
  onCancel: () => void;
}

export default function DeleteChatDialog({
  isOpen,
  chatName,
  onConfirm,
  onCancel,
}: DeleteChatDialogProps) {
  const [forEveryone, setForEveryone] = useState(false);

  if (!isOpen) return null;

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={onCancel}>
      <View style={styles.modalCenteredViewportAnchor}>
        
        {/* Backdrop Tint */}
        <Animated.View 
          
          
          style={StyleSheet.absoluteFill}
        >
          <TouchableOpacity 
            style={styles.backdropClickDismissMask} 
            activeOpacity={1} 
            onPress={onCancel} 
          />
        </Animated.View>

        {/* Modal Dialog Card Container */}
        <Animated.View
          
          
          style={styles.dialogGlassCardFrame}
        >
          <h2 style={styles.modalPrimaryHeadingText}>Delete Chat</h2>
          <Text style={styles.dialogWarningParagraphLabel}>
            Permanently delete your conversation with{' '}
            <Text style={styles.boldTextHighlight}>{chatName}</Text>?
          </Text>
          
          {/* Custom Checkbox Node Link */}
          <TouchableOpacity 
            onPress={() => setForEveryone(!forEveryone)}
            style={styles.checkboxButtonActionContainerTrack}
            activeOpacity={0.8}
          >
            <View style={[
              styles.checkboxCustomSquareBox, 
              forEveryone && styles.checkboxSquareBoxActiveStateBg
            ]}>
              {forEveryone && <Check size={14} color="#ffffff" strokeWidth={3} />}
            </View>
            <Text style={styles.checkboxActionTextTypographyLabel}>
              Also delete for {chatName}
            </Text>
          </TouchableOpacity>

          {/* Action Footer Button Group Row */}
          <View style={styles.dialogActionFooterButtonFlexRow}>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.actionButtonDismissBase}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissButtonTextLabel}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onConfirm(forEveryone)}
              style={styles.actionButtonDestructiveRedBase}
              activeOpacity={0.8}
            >
              <Text style={styles.destructiveButtonTextLabel}>Delete</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  dialogGlassCardFrame: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalPrimaryHeadingText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },
  dialogWarningParagraphLabel: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  boldTextHighlight: {
    fontWeight: '700',
    color: '#0f172a',
  },
  checkboxButtonActionContainerTrack: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    marginBottom: 32,
  },
  checkboxCustomSquareBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSquareBoxActiveStateBg: {
    backgroundColor: '#ef4444',
  },
  checkboxActionTextTypographyLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#dc2626',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  dialogActionFooterButtonFlexRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButtonDismissBase: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  dismissButtonTextLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
  actionButtonDestructiveRedBase: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    ...Platform.select({
      ios: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  destructiveButtonTextLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});