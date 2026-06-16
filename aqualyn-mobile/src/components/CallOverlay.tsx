import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2 } from 'lucide-react-native';
import { useCall } from '../context/CallContext';
import { Theme } from '../config/theme';

const { width, height } = Dimensions.get('window');

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const CallOverlay: React.FC = () => {
  const {
    isCalling, incomingCall, currentCall,
    acceptCall, rejectCall, endCall,
    localStream, remoteStream,
    duration, isMuted, isVideoEnabled,
    toggleMute, toggleVideo,
  } = useCall();

  if (incomingCall && !isCalling) {
    return (
      <View style={styles.bannerContainer}>
        <View style={styles.banner}>
          <Image 
            source={{ uri: incomingCall.callerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${incomingCall.callerName}` }} 
            style={styles.bannerAvatar} 
          />
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerName}>{incomingCall.callerName}</Text>
            <Text style={styles.bannerType}>
              Incoming {incomingCall.type === 'VIDEO' ? 'Video' : 'Voice'} Call
            </Text>
          </View>
          <View style={styles.bannerActions}>
            <TouchableOpacity onPress={rejectCall} style={[styles.miniButton, styles.declineBg]}>
              <PhoneOff size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={acceptCall} style={[styles.miniButton, styles.acceptBg]}>
              {incomingCall.type === 'VIDEO' ? <Video size={18} color="white" /> : <Phone size={18} color="white" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (isCalling && currentCall) {
    const isVideo = currentCall.type === 'VIDEO';

    return (
      <Modal animationType="slide" transparent={false} visible={true}>
        <View style={styles.fullscreenContainer}>
          {/* Avatar Voice Call Display */}
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: currentCall.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentCall.userName}` }} 
              style={[styles.fullscreenAvatar, isVideo ? styles.avatarVideoSize : styles.avatarVoiceSize]} 
            />
            <Text style={styles.callerNameText}>{currentCall.userName}</Text>
            <Text style={styles.durationText}>
              {remoteStream ? (
                <Text style={{ color: '#4ade80' }}>{formatDuration(duration)}</Text>
              ) : (
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  {currentCall.isOutgoing ? 'Calling…' : 'Connecting…'}
                </Text>
              )}
            </Text>
          </View>

          {/* Controls Bar */}
          <View style={styles.controlsContainer}>
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={toggleMute} style={[styles.controlButton, isMuted && styles.controlButtonActive]}>
                {isMuted ? <MicOff size={24} color={isMuted ? 'black' : 'white'} /> : <Mic size={24} color="white" />}
              </TouchableOpacity>

              {isVideo && (
                <TouchableOpacity onPress={toggleVideo} style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}>
                  {isVideoEnabled ? <Video size={24} color="white" /> : <VideoOff size={24} color="black" />}
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.controlButton}>
                <Volume2 size={24} color="white" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={endCall} style={styles.endCallButton}>
              <PhoneOff size={32} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 15, 18, 0.95)',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bannerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  bannerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bannerName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  bannerType: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  miniButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBg: {
    backgroundColor: '#ef4444',
  },
  acceptBg: {
    backgroundColor: '#22c55e',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  fullscreenAvatar: {
    borderRadius: 9999,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarVoiceSize: {
    width: 140,
    height: 140,
  },
  avatarVideoSize: {
    width: 90,
    height: 90,
  },
  callerNameText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 20,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  controlsContainer: {
    alignItems: 'center',
    gap: 30,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'white',
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
});
