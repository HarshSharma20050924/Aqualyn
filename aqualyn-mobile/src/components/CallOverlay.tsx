import React from 'react';
import { View, Text, TouchableOpacity, Image, Modal, StyleSheet, Platform, Dimensions } from 'react-native';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2 } from 'lucide-react-native';
import { useCall } from '../context/CallContext';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const CallOverlay: React.FC = () => {
  const {
    isCalling, incomingCall, currentCall,
    acceptCall, rejectCall, endCall,
    remoteStream, duration, isMuted, isVideoEnabled,
    toggleMute, toggleVideo,
  } = useCall();

  // Incoming Popup Banner layout context
  if (incomingCall && !isCalling) {
    const fallbackAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${incomingCall.callerName}`;
    return (
      <View style={styles.incomingBanner}>
        <View style={styles.avatarWrapper}>
          <Image 
            source={{ uri: incomingCall.callerAvatar || fallbackAvatar }} 
            style={styles.incomingAvatar} 
          />
        </View>
        
        <View style={styles.callerMeta}>
          <Text style={styles.callerNameText} numberOfLines={1}>{incomingCall.callerName}</Text>
          <Text style={styles.incomingCallTypeText}>
            Incoming {incomingCall.type === 'VIDEO' ? 'Video' : 'Voice'} Call
          </Text>
        </View>

        <View style={styles.incomingActionRow}>
          <TouchableOpacity onPress={rejectCall} style={[styles.actionBtnCircle, styles.rejectBtn]}>
            <PhoneOff size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={acceptCall} style={[styles.actionBtnCircle, styles.acceptBtn]}>
            {incomingCall.type === 'VIDEO' ? <Video size={18} color="#FFF" /> : <Phone size={18} color="#FFF" />}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Active Full-Screen Overlay Modal Interface
  if (isCalling && currentCall) {
    const isVideo = currentCall.type === 'VIDEO';
    const fallbackCurrentAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${currentCall.userName}`;

    return (
      <Modal visible transparent={false} animationType="fade">
        <View style={styles.modalContent}>
          
          {/* Stream Views & Background Layer */}
          <View style={styles.backgroundLayer}>
            {isVideo ? (
              <View style={styles.videoStreamContainer}>
                {/* Full-Screen Stream Representation */}
                <Text style={styles.remoteFeedPlaceholder}>Remote Video Feed Stream Track</Text>
                
                {/* Local Picture-in-Picture window container overlay */}
                <View style={styles.pipContainer}>
                  {isVideoEnabled ? (
                    <Text style={styles.pipText}>Local Camera</Text>
                  ) : (
                    <VideoOff size={24} color="rgba(255, 255, 255, 0.5)" />
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.voiceBackgroundContainer}>
                <Image 
                  source={{ uri: currentCall.avatar || fallbackCurrentAvatar }} 
                  style={styles.backgroundImageBlur}
                  blurRadius={20}
                />
              </View>
            )}
          </View>

          {/* User Details Header Panel */}
          <View style={styles.headerPanel}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: currentCall.avatar || fallbackCurrentAvatar }} 
                style={[
                  styles.activeAvatar, 
                  isVideo ? styles.activeAvatarVideo : styles.activeAvatarVoice
                ]} 
              />
            </View>
            <Text style={styles.activeCallerName}>{currentCall.userName}</Text>
            <Text style={styles.durationText}>
              {remoteStream ? (
                <Text style={styles.greenText}>{formatDuration(duration)}</Text>
              ) : (
                <Text style={styles.connectingText}>
                  {currentCall.isOutgoing ? 'Calling…' : 'Connecting…'}
                </Text>
              )}
            </Text>
          </View>

          {/* Dynamic Bottom Controls Matrix */}
          <View style={styles.bottomControlsWrapper}>
            <View style={styles.controlsRow}>
              <TouchableOpacity 
                onPress={toggleMute} 
                style={[styles.controlBtnCircle, isMuted ? styles.controlBtnActive : styles.controlBtnInactive]}
              >
                {isMuted ? <MicOff size={24} color="#0F172A" /> : <Mic size={24} color="#FFF" />}
              </TouchableOpacity>

              {isVideo && (
                <TouchableOpacity 
                  onPress={toggleVideo} 
                  style={[styles.controlBtnCircle, !isVideoEnabled ? styles.controlBtnActive : styles.controlBtnInactive]}
                >
                  {isVideoEnabled ? <Video size={24} color="#FFF" /> : <VideoOff size={24} color="#0F172A" />}
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.controlBtnCircle, styles.controlBtnInactive]}>
                <Volume2 size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* End Call Anchor Control Trigger */}
            <View style={styles.endCallWrapper}>
              <TouchableOpacity 
                onPress={endCall} 
                style={styles.endCallBtnCircle}
              >
                <PhoneOff size={32} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </Modal>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  incomingBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: '4%',
    right: '4%',
    zIndex: 300,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  avatarWrapper: {
    position: 'relative',
  },
  incomingAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  callerMeta: {
    flex: 1,
    minWidth: 0,
  },
  callerNameText: {
    fontWeight: '700',
    color: '#ffffff',
    fontSize: 16,
  },
  incomingCallTypeText: {
    fontSize: 12,
    color: '#4ade80',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  incomingActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  rejectBtn: {
    backgroundColor: '#ef4444',
  },
  acceptBtn: {
    backgroundColor: '#22c55e',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#020617',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingBottom: 56,
    paddingTop: 80,
  },
  backgroundLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
  },
  videoStreamContainer: {
    flex: 1,
    backgroundColor: '#18181b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteFeedPlaceholder: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  pipContainer: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: 112,
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pipText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
  },
  voiceBackgroundContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImageBlur: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.1,
  },
  headerPanel: {
    zIndex: 10,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  activeAvatar: {
    borderRadius: 999,
  },
  activeAvatarVideo: {
    width: 80,
    height: 80,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  activeAvatarVoice: {
    width: 128,
    height: 128,
    borderWidth: 4,
    borderColor: 'rgba(6,182,212,0.4)',
  },
  activeCallerName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  durationText: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  greenText: {
    color: '#4ade80',
  },
  connectingText: {
    color: 'rgba(255,255,255,0.6)',
  },
  bottomControlsWrapper: {
    zIndex: 10,
    paddingHorizontal: 32,
    gap: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  controlBtnCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnActive: {
    backgroundColor: '#ffffff',
  },
  controlBtnInactive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  endCallWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  endCallBtnCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
});