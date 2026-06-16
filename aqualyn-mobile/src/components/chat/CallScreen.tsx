import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
} from 'react-native';
import Animated, { 
  SlideInUp, 
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from 'lucide-react-native';

interface CallScreenProps {
  callerName: string;
  callerAvatar: string;
  isVideo: boolean;
  isIncoming: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onEnd: () => void;
}

export default function CallScreen({
  callerName,
  callerAvatar,
  isVideo,
  isIncoming,
  onAccept,
  onDecline,
  onEnd,
}: CallScreenProps) {
  const insets = useSafeAreaInsets();
  const [callState, setCallState] = useState<'incoming' | 'outgoing' | 'active'>(
    isIncoming ? 'incoming' : 'outgoing'
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideo);
  const [duration, setDuration] = useState(0);

  const avatarScale = useSharedValue(1);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callState === 'active') {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else if (callState === 'incoming') {
      avatarScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAccept = () => {
    avatarScale.value = 1;
    setCallState('active');
    onAccept();
  };

  const animatedAvatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  return (
    <Modal transparent animationType="slide" visible={true}>
      <View style={styles.fullscreenCallViewportContainer}>
        {/* Layered Backdrop Blur Alternative */}
        <View style={StyleSheet.absoluteFill}>
          <Image source={{ uri: callerAvatar }} style={styles.blurFallbackBackgroundFill} blurRadius={40} />
          <View style={styles.vignetteOverlayGradientWash} />
        </View>

        {/* Identity Headframe Area */}
        <View style={[styles.headerMetaClusterBlock, { paddingTop: insets.top + 40 }]}>
          <Animated.View style={[styles.avatarWrapperContainerCircle, animatedAvatarStyle]}>
            <Image source={{ uri: callerAvatar }} style={styles.avatarNativeImageFrame} />
            {callState === 'active' && isVideoEnabled && <View style={styles.activeVideoPulseBorderShield} />}
          </Animated.View>
          
          <View style={styles.textCenterIdentityGroup}>
            <Text style={styles.callerPrimaryHeadingText}>{callerName}</Text>
            <Text style={styles.callStateSubtitleStatusText}>
              {callState === 'incoming' && `${isVideo ? 'Incoming Video Call' : 'Incoming Audio Call'}...`}
              {callState === 'outgoing' && 'Calling...'}
              {callState === 'active' && formatDuration(duration)}
            </Text>
          </View>
        </View>

        {/* Bottom Operations Grid Dashboard */}
        <View style={[styles.controlsDynamicHostDock, { paddingBottom: insets.bottom + 32 }]}>
          {callState === 'active' ? (
            <View style={styles.columnFillButtonGrid}>
              <View style={styles.horizontalRowButtonControlTrack}>
                <TouchableOpacity
                  onPress={() => setIsMuted(!isMuted)}
                  style={[styles.utilityControlCircleNode, isMuted && styles.utilityControlActiveToggleWhite]}
                >
                  {isMuted ? <MicOff size={24} color="#0f172a" /> : <Mic size={24} color="#ffffff" />}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsVideoEnabled(!isVideoEnabled)}
                  style={[styles.utilityControlCircleNode, !isVideoEnabled && styles.utilityControlActiveToggleWhite]}
                >
                  {!isVideoEnabled ? <VideoOff size={24} color="#0f172a" /> : <Video size={24} color="#ffffff" />}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsSpeaker(!isSpeaker)}
                  style={[styles.utilityControlCircleNode, isSpeaker && styles.utilityControlActiveToggleWhite]}
                >
                  {isSpeaker ? <Volume2 size={24} color="#0f172a" /> : <VolumeX size={24} color="#ffffff" />}
                </TouchableOpacity>
              </View>

              <View style={styles.centeredAnchorDismissRow}>
                <TouchableOpacity onPress={onEnd} style={styles.actionTerminateCallRedButtonNode} activeOpacity={0.8}>
                  <PhoneOff size={28} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          ) : callState === 'incoming' ? (
            <View style={styles.incomingDualOptionActionFlexTrack}>
              <TouchableOpacity onPress={onDecline} style={styles.incomingLabelButtonColBlock}>
                <View style={styles.actionTerminateCallRedButtonNode}>
                  <PhoneOff size={28} color="#ffffff" />
                </View>
                <Text style={styles.buttonActionLabelTextSub}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleAccept} style={styles.incomingLabelButtonColBlock}>
                <View style={styles.actionAcceptCallGreenButtonNode}>
                  {isVideo ? <Video size={28} color="#ffffff" /> : <Phone size={28} color="#ffffff" />}
                </View>
                <Text style={styles.buttonActionLabelTextSub}>Accept</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.centeredAnchorDismissRow}>
              <TouchableOpacity onPress={onEnd} style={styles.actionTerminateCallRedButtonNode} activeOpacity={0.8}>
                <PhoneOff size={28} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullscreenCallViewportContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blurFallbackBackgroundFill: {
    width: '100%',
    height: '100%',
    opacity: 0.25,
  },
  vignetteOverlayGradientWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  headerMetaClusterBlock: {
    alignItems: 'center',
    gap: 24,
    width: '100%',
  },
  avatarWrapperContainerCircle: {
    position: 'relative',
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  avatarNativeImageFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeVideoPulseBorderShield: {
    ...StyleSheet.absoluteFill,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  textCenterIdentityGroup: {
    alignItems: 'center',
    gap: 6,
  },
  callerPrimaryHeadingText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  callStateSubtitleStatusText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  controlsDynamicHostDock: {
    width: '100%',
    paddingHorizontal: 32,
  },
  columnFillButtonGrid: {
    gap: 32,
    width: '100%',
  },
  horizontalRowButtonControlTrack: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  utilityControlCircleNode: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  utilityControlActiveToggleWhite: {
    backgroundColor: '#ffffff',
  },
  centeredAnchorDismissRow: {
    alignItems: 'center',
    width: '100%',
  },
  actionTerminateCallRedButtonNode: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionAcceptCallGreenButtonNode: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomingDualOptionActionFlexTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    width: '100%',
  },
  incomingLabelButtonColBlock: {
    alignItems: 'center',
    gap: 10,
  },
  buttonActionLabelTextSub: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
});