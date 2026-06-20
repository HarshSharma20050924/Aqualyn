import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  ZoomInEasyUp,
  ZoomOutEasyDown
} from 'react-native-reanimated';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.modalViewportContainer}>
        {/* Animated Backdrop Dismiss Layer */}
        <Animated.View 
           
           
          style={StyleSheet.absoluteFill}
        >
          <TouchableWithoutFeedback onPress={onCancel}>
            <View style={styles.modalBackdropBlurMask} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Dialog Frame Container */}
        <Animated.View
          
          
          style={styles.dialogGlassCardBody}
        >
          <Text style={styles.dialogTitleTypographyText}>{title}</Text>
          <Text style={styles.dialogDescriptionSubtitleText}>{message}</Text>
          
          <View style={styles.actionButtonGroupHorizontalFlexTrack}>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.actionButtonBaseFormCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonCancelLabelTypography}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              style={[
                styles.actionButtonBaseFormConfirm,
                isDestructive ? styles.bgDestructiveRed : styles.bgPrimaryActionColor,
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonConfirmLabelTypography}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalViewportContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBackdropBlurMask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  dialogGlassCardBody: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
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
  dialogTitleTypographyText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  dialogDescriptionSubtitleText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 24,
  },
  actionButtonGroupHorizontalFlexTrack: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButtonBaseFormCancel: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonCancelLabelTypography: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  actionButtonBaseFormConfirm: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  bgDestructiveRed: {
    backgroundColor: '#ef4444',
  },
  bgPrimaryActionColor: {
    backgroundColor: '#0f172a', 
  },
  actionButtonConfirmLabelTypography: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});