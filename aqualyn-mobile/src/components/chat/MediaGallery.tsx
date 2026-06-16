import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react-native';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
}

interface MediaGalleryProps {
  items: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MediaGallery({ items, initialIndex, onClose }: MediaGalleryProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      const nextIdx = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
      setCurrentIndex(nextIdx);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      flatListRef.current?.scrollToIndex({ index: prevIdx, animated: true });
      setCurrentIndex(prevIdx);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const renderItem = ({ item }: { item: MediaItem }) => {
    return (
      <View style={styles.viewerItemPageFrame}>
        {item.type === 'image' ? (
          <Image
            source={{ uri: item.url }}
            style={styles.fullScreenTargetImageContent}
            resizeMode="contain"
          />
        ) : (
          /* Link local native platforms video engine placeholders here directly */
          <View style={styles.nativeVideoPlaceholderCanvasFrame}>
            <Text style={styles.videoCanvasMessagePlaceholderLabel}>
              Native Video Engine Playback Layer
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal transparent visible={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewportBlackoutWrapperFrame}>
        
        {/* Dynamic Global Top Header Navigation Overlay */}
        <View style={[styles.headerFloatingNavbarTrack, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.paginationLabelCountText}>
            {currentIndex + 1} / {items.length}
          </Text>
          <View style={styles.headerRightActionGroupCluster}>
            <TouchableOpacity style={styles.actionIconButtonCircularCircle}>
              <Download size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.actionIconButtonCircularCircle}>
              <X size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Paged Content Slider Container Frame */}
        <FlatList
          ref={flatListRef}
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Directional Overlay Side Controls (Optimized primarily for Tablet Form Factors) */}
        {Platform.OS === 'ios' && (Platform as any).isPad && currentIndex > 0 && (
          <TouchableOpacity 
            style={[styles.floatingSideDirectionalArrowAnchor, styles.leftArrowFixedPosition]}
            onPress={handlePrev}
          >
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
        )}

        {Platform.OS === 'ios' && (Platform as any).isPad && currentIndex < items.length - 1 && (
          <TouchableOpacity 
            style={[styles.floatingSideDirectionalArrowAnchor, styles.rightArrowFixedPosition]}
            onPress={handleNext}
          >
            <ChevronRight size={24} color="#ffffff" />
          </TouchableOpacity>
        )}

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  viewportBlackoutWrapperFrame: {
    flex: 1,
    backgroundColor: '#050505',
  },
  headerFloatingNavbarTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  paginationLabelCountText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  headerRightActionGroupCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconButtonCircularCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerItemPageFrame: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fullScreenTargetImageContent: {
    width: '100%',
    height: '100%',
  },
  nativeVideoPlaceholderCanvasFrame: {
    width: '100%',
    height: 240,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoCanvasMessagePlaceholderLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontWeight: '500',
  },
  floatingSideDirectionalArrowAnchor: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  leftArrowFixedPosition: {
    left: 16,
  },
  rightArrowFixedPosition: {
    right: 16,
  },
});