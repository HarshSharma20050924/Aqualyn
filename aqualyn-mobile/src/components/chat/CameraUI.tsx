import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, RefreshCcw, Zap, ZapOff, Check, ArrowLeft } from 'lucide-react-native';

interface CameraUIProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (mediaUrl: string, type: 'photo' | 'video') => void;
}

export default function CameraUI({ isOpen, onClose, onCapture }: CameraUIProps) {
  const insets = useSafeAreaInsets();
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flash, setFlash] = useState(false);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<{ url: string; type: 'photo' | 'video' } | null>(null);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleCaptureActionMock = () => {
    if (mode === 'photo') {
      // Plug your native camera component base64 or file uri response hook here[cite: 17]
      setCapturedMedia({ url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7', type: 'photo' });
    } else {
      if (isRecording) {
        setIsRecording(false);
        setCapturedMedia({ url: 'mock_video_uri.mp4', type: 'video' });
      } else {
        setIsRecording(true);
      }
    }
  };

  const handleSend = () => {
    if (capturedMedia) {
      onCapture(capturedMedia.url, capturedMedia.type);
      setCapturedMedia(null);
      onClose();
    }
  };

  return (
    <Modal transparent visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <View style={styles.cameraPrimaryViewportContainer}>
        
        {/* Core Camera Viewfinder Workspace[cite: 17] */}
        <View style={styles.viewfinderRenderTrackFrame}>
          {capturedMedia ? (
            capturedMedia.type === 'photo' ? (
              <Image source={{ uri: capturedMedia.url }} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.videoPreviewMockOverlay]}>
                <Text style={styles.videoPlaybackMockLabelText}>Video Preview Track Playback</Text>
              </View>
            )
          ) : (
            /* Integrate native engine viewfinders like <Camera device={device} isActive={true} /> inside this canvas segment */
            <View style={styles.nativeCameraEnginePlaceholderFrame}>
              <Text style={styles.nativeCameraEnginePlaceholderText}>
                {`Camera Active (${facingMode === 'user' ? 'Front' : 'Back'})`}
              </Text>
            </View>
          )}
        </View>

        {/* Top Control Bar Overlays */}
        <View style={[styles.topControlOverlayRowTrack, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={onClose} style={styles.blurActionButtonCircularNode}>
            <X size={22} color="#ffffff" />
          </TouchableOpacity>
          
          {!capturedMedia && (
            <TouchableOpacity onPress={() => setFlash(!flash)} style={styles.blurActionButtonCircularNode}>
              {flash ? <Zap size={22} color="#eab308" /> : <ZapOff size={22} color="#ffffff" />}
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Control Dashboard Matrix */}
        <View style={[styles.bottomControlOverlayPanelBox, { paddingBottom: insets.bottom + 24 }]}>
          {!capturedMedia && (
            <View style={styles.cameraModeToggleRowSelector}>
              <TouchableOpacity onPress={() => setMode('photo')}>
                <Text style={[styles.modeSelectorTabTextText, mode === 'photo' && styles.modeSelectorActiveColor]}>
                  PHOTO
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('video')}>
                <Text style={[styles.modeSelectorTabTextText, mode === 'video' && styles.modeSelectorActiveColor]}>
                  VIDEO
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.triggerButtonRowDistributionBar}>
            {capturedMedia ? (
              <>
                <TouchableOpacity onPress={() => setCapturedMedia(null)} style={styles.blurActionButtonCircularNode}>
                  <ArrowLeft size={22} color="#ffffff" />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={handleSend} style={styles.mediaConfirmSubmitCircleNode}>
                  <Check size={28} color="#ffffff" />
                </TouchableOpacity>
                <View style={{ width: 44 }} />
              </>
            ) : (
              <>
                <View style={{ width: 44 }} />
                
                <TouchableOpacity 
                  onPress={handleCaptureActionMock}
                  style={[styles.cameraCaptureShutterOuterRing, mode === 'video' && styles.shutterRingBorderRed]}
                >
                  <View style={[
                    styles.shutterButtonCoreCircleSolid,
                    mode === 'video' ? styles.bgRedSolidColor : styles.bgWhiteSolidColor,
                    isRecording && styles.shutterRecordingActiveSquareState
                  ]} />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleCamera} style={styles.blurActionButtonCircularNode}>
                  <RefreshCcw size={22} color="#ffffff" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cameraPrimaryViewportContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  viewfinderRenderTrackFrame: {
    ...StyleSheet.absoluteFill,
  },
  nativeCameraEnginePlaceholderFrame: {
    flex: 1,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nativeCameraEnginePlaceholderText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontWeight: '600',
  },
  videoPreviewMockOverlay: {
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaybackMockLabelText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  topControlOverlayRowTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  blurActionButtonCircularNode: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControlOverlayPanelBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 32,
    zIndex: 10,
  },
  cameraModeToggleRowSelector: {
    flexDirection: 'row',
    gap: 28,
    marginBottom: 8,
  },
  modeSelectorTabTextText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
  },
  modeSelectorActiveColor: {
    color: '#38bdf8',
  },
  triggerButtonRowDistributionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  cameraCaptureShutterOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterRingBorderRed: {
    borderColor: '#ef4444',
  },
  shutterButtonCoreCircleSolid: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  bgWhiteSolidColor: {
    backgroundColor: '#ffffff',
  },
  bgRedSolidColor: {
    backgroundColor: '#ef4444',
  },
  shutterRecordingActiveSquareState: {
    width: 26,
    height: 26,
    borderRadius: 6,
  },
  mediaConfirmSubmitCircleNode: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
  },
});