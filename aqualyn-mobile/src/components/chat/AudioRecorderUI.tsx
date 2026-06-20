import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import { Trash2, Send } from 'lucide-react-native';

interface AudioRecorderUIProps {
  isRecording: boolean;
  onStop: (audioUrl?: string) => void;
  onCancel: () => void;
}

export default function AudioRecorderUI({ isRecording, onStop, onCancel }: AudioRecorderUIProps) {
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Shared animation value for horizontal hint slide animation[cite: 15]
  const slideTranslation = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      setDuration(0);
      
      // Infinite bounce animation path mimicking standard layout variants[cite: 15]
      slideTranslation.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 750 }),
          withTiming(6, { duration: 750 })
        ),
        -1,
        true
      );

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      slideTranslation.value = 0;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const animatedSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideTranslation.value }],
  }));

  if (!isRecording) return null;

  return (
    <Animated.View
      
      
      style={styles.recorderDockFloatingBar}
    >
      {/* Pulse Anchor & Counter */}
      <View style={styles.counterRowClusterLayout}>
        <View style={styles.pulseIndicatorRedDotNode} />
        <Text style={styles.durationMonospaceLabelText}>{formatTime(duration)}</Text>
      </View>

      {/* Swipe Hint Track */}
      <View style={styles.centerFlexHintContainerTrack}>
        <Animated.View style={[styles.inlineFlexTextHintGroup, animatedSlideStyle]}>
          <Text style={styles.actionHintLabelTypographyText}>
            {"< SLIDE TO CANCEL"}
          </Text>
        </Animated.View>
      </View>

      {/* Control Triggers */}
      <View style={styles.actionButtonGroupRightCluster}>
        <TouchableOpacity
          onPress={onCancel}
          style={styles.iconButtonActionCircularBase}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color="#64748b" />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => onStop()}
          style={styles.iconButtonActionSubmitCircle}
          activeOpacity={0.8}
        >
          <Send size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  recorderDockFloatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    zIndex: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  counterRowClusterLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 64,
  },
  pulseIndicatorRedDotNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  durationMonospaceLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  centerFlexHintContainerTrack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineFlexTextHintGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.6,
  },
  actionHintLabelTypographyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1.2,
  },
  actionButtonGroupRightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButtonActionCircularBase: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
  },
  iconButtonActionSubmitCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});