import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, Layout } from 'react-native-reanimated';
import { Droplet, AlertCircle } from 'lucide-react-native';

interface AIActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionTitle: string;
  actionDescription: string;
  actionCount?: number;
}

export default function AIActionModal({
  isOpen,
  onClose,
  onConfirm,
  actionTitle,
  actionDescription,
  actionCount,
}: AIActionModalProps) {
  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <Animated.View 
          entering={SlideInDown.springify().damping(28).stiffness(340)}
          exiting={SlideOutDown}
          layout={Layout.springify()}
          style={styles.modalCard}
        >
          {/* Icon Box */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBg} />
            <View style={styles.iconGlass}>
              <Droplet size={28} color="#0057bd" />
            </View>
          </View>

          <Text style={styles.title}>{actionTitle}</Text>
          <Text style={styles.description}>{actionDescription}</Text>

          {actionCount !== undefined && (
            <View style={styles.alertBox}>
              <AlertCircle size={16} color="#0057bd" />
              <Text style={styles.alertText}>
                This will affect {actionCount} item{actionCount !== 1 ? 's' : ''}.
              </Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmBtn} 
              onPress={() => { onConfirm(); onClose(); }}
            >
              <Text style={styles.confirmBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,87,189,0.1)',
    borderRadius: 18,
    transform: [{ rotate: '12deg' }],
  },
  iconGlass: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    marginBottom: 24,
    gap: 8,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#0057bd',
    alignItems: 'center',
    shadowColor: '#0057bd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
