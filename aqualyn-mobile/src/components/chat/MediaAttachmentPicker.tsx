import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Image as ImageIcon, FileText, MapPin, Camera, Wallet, Clock } from 'lucide-react-native';

interface MediaAttachmentPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
}

export default function MediaAttachmentPicker({ isOpen, onClose, onSelect }: MediaAttachmentPickerProps) {
  const options = [
    { id: 'camera', icon: Camera, label: 'Camera', color: '#3b82f6' },
    { id: 'photo', icon: ImageIcon, label: 'Photo & Video', color: '#a855f7' },
    { id: 'document', icon: FileText, label: 'Document', color: '#6366f1' },
    { id: 'location', icon: MapPin, label: 'Location', color: '#10b981' },
    { id: 'wallet', icon: Wallet, label: 'Send Money', color: '#22c55e' },
    { id: 'schedule', icon: Clock, label: 'Schedule', color: '#f97316' },
  ];

  if (!isOpen) return null;

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={onClose}>
      <View style={styles.sheetLayoutViewportAnchor}>
        
        {/* Pure Overlay Dismissal Catch */}
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onClose} 
        />

        {/* Attachment Card Panel Popover */}
        <Animated.View
          
          
          style={styles.popoverMenuSheetBodyFrame}
        >
          <View style={styles.threeColumnGridMatrixTrack}>
            {options.map((option) => {
              const IconComponent = option.icon;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => {
                    onSelect(option.id);
                    onClose();
                  }}
                  style={styles.gridCellActionColumnNode}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainerCircleBase, { backgroundColor: option.color }]}>
                    <IconComponent size={20} color="#ffffff" />
                  </View>
                  <Text style={styles.cellItemTypographyTextLabel} numberOfLines={2}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetLayoutViewportAnchor: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  popoverMenuSheetBodyFrame: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    width: 288,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  threeColumnGridMatrixTrack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCellActionColumnNode: {
    width: '30%',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  iconContainerCircleBase: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  cellItemTypographyTextLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 12,
  },
});