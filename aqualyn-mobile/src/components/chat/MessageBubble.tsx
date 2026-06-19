import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { 
  Play, Pause, FileText, Download, MapPin, CheckCheck, Check,
  Reply, Copy, Trash2, Timer, Edit2, Wallet, ArrowRight, ShieldAlert 
} from 'lucide-react-native';

// --- Monospace Text Node for Secret Chats ---
const ScrambledText = ({ text, isSecret, isMe }: { text: string; isSecret?: boolean; isMe?: boolean }) => {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (!isSecret) {
      setDisplayText(text);
      return;
    }
    
    let frame = 0;
    const scrambleChars = '01#$@&%*+=-_?~X';
    const totalFrames = 12;
    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const scrambled = text.split('').map((char, index) => {
        if (char === ' ') return ' ';
        if (index / text.length < progress) return char;
        return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
      }).join('');
      
      setDisplayText(scrambled);
      if (frame >= totalFrames) {
        clearInterval(interval);
        setDisplayText(text);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [text, isSecret]);

  const textStyle = isSecret
    ? styles.secretScrambledMonospaceTypographyText
    : isMe
    ? styles.bubbleBodyLabelSentText
    : styles.bubbleBodyLabelStandardText;

  return (
    <Text style={textStyle}>
      {displayText}
    </Text>
  );
};

// --- Core Message Bubble Component Conversion ---
interface MessageBubbleProps {
  msg: any;
  isMe: boolean;
  onReply: (msg: any) => void;
  onEdit?: (msg: any) => void;
  replyMessage?: any;
  onMediaClick?: (msg: any) => void;
  isSecret?: boolean;
}

function MessageBubbleComponent({
  msg,
  isMe,
  onReply,
  onEdit,
  replyMessage,
  onMediaClick,
  isSecret,
}: MessageBubbleProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Self-Destruct Counter Logic Mock
  useEffect(() => {
    if (!isSecret) return;
    setTimeLeft(30);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSecret]);

  // System Security Alerts Layout Guard Filter
  if (msg.text?.startsWith('[System]') || msg.text?.startsWith('[Security Notice]')) {
    return (
      <View style={styles.systemAlertCenteredBadgeContainerTrack}>
        <View style={styles.systemBadgeLabelPillBackgroundShape}>
          <ShieldAlert size={14} color="#f87171" />
          <Text style={styles.systemBadgeLabelTypographyText}>
            {msg.text.replace(/\[(System|Security Notice)\] /g, '')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View 
      entering={FadeInUp.duration(200)}
      style={[styles.messageRowGroupAlignmentTrack, isMe ? styles.alignToRight : styles.alignToLeft]}
    >
      <TouchableOpacity
        onLongPress={() => setShowContextMenu(true)}
        onPress={() => msg.imageUrl && onMediaClick?.(msg)}
        style={[
          styles.bubbleWrapperShapeBaseFrame,
          isMe ? styles.bubbleGlassThemeSentColorBlock : styles.bubbleGlassThemeReceivedColorBlock
        ]}
        activeOpacity={0.9}
      >
        {/* Quote Block / Reply Segment Node */}
        {replyMessage && (
          <View style={[styles.quotedReplyHeaderBlockBox, isMe ? styles.quotedBorderWhite : styles.quotedBorderDark]}>
            <Text style={styles.quotedAuthorMicroHeadingLabel}>
              {replyMessage.senderId === msg.senderId ? 'You' : 'Someone'}
            </Text>
            <Text style={styles.quotedMessageTruncatedPreviewText} numberOfLines={1}>
              {replyMessage.text || 'Attachment'}
            </Text>
          </View>
        )}

        {/* Dynamic Rich Media Blocks Rendering Wrapper */}
        <View style={styles.richMediaLayoutHostFrame}>
          {msg.imageUrl && (
            <Image source={{ uri: msg.imageUrl }} style={styles.messageEmbeddedAttachmentImageCanvas} />
          )}

          {msg.audioUrl && (
            <View style={styles.audioPlayerTimelineHostFlexRow}>
              <TouchableOpacity 
                onPress={() => setIsPlaying(!isPlaying)}
                style={[styles.audioPlaybackActionTriggerCircle, isMe ? styles.bgWhite : styles.bgSlateDark]}
              >
                {isPlaying ? <Pause size={16} color={isMe ? '#0f172a' : '#ffffff'} /> : <Play size={16} color={isMe ? '#0f172a' : '#ffffff'} style={{ marginLeft: 2 }} />}
              </TouchableOpacity>
              <View style={styles.audioTimelineTrackRailFiller} />
              <Text style={styles.audioDurationMonospaceValueText}>0:18</Text>
            </View>
          )}

          {msg.document && (
            <View style={styles.documentDownloadFlexRowLayoutBox}>
              <View style={styles.documentIconSquareBadgeNode}>
                <FileText size={20} color="#0f172a" />
              </View>
              <View style={styles.documentMetaLabelsStackColumn}>
                <Text style={styles.documentTitleHeadingLabelText} numberOfLines={1}>{msg.document.name}</Text>
                <Text style={styles.documentSizeMicroSubtextValue}>{msg.document.size}</Text>
              </View>
              <TouchableOpacity style={styles.documentDownloadCircleNodeAction}>
                <Download size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
          )}

          {msg.location && (
            <View style={styles.locationContainerCardFrameNode}>
              <View style={styles.locationMapMockGraphicCanvas}>
                <MapPin size={24} color="#ef4444" />
              </View>
              <Text style={styles.locationAddressTextLabelTypography}>{msg.location.address}</Text>
            </View>
          )}

          {/* Primary Message Typography Segment */}
          {msg.text && <ScrambledText text={msg.text} isSecret={isSecret} isMe={isMe} />}
        </View>
      </TouchableOpacity>

      {/* Footer Timestamp Track with Checkmark Layout Guards */}
      <View style={styles.bubbleFooterMetaInformationFlexRow}>
        {isSecret && timeLeft !== null && (
          <View style={styles.secretTimerPillBadgeBackground}>
            <Timer size={10} color="#4ade80" />
            <Text style={styles.secretTimerValueLabelText}>{timeLeft}s</Text>
          </View>
        )}
        {msg.isEdited && <Text style={styles.editedIndicatorItalicMicroText}>edited</Text>}
        <Text style={styles.bubbleMessageTimestampLabelTypography}>{msg.timestamp}</Text>
        
        {isMe && (
          <View style={styles.checkmarkStatusDynamicFlexCluster}>
            {msg.status === 'sent' ? (
              <Check size={13} color="rgba(255, 255, 255, 0.6)" />
            ) : msg.status === 'read' || msg.status === 'seen' ? (
              <CheckCheck size={13} color="#38bdf8" />
            ) : (
              <CheckCheck size={13} color="rgba(255, 255, 255, 0.8)" />
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default React.memo(MessageBubbleComponent);

const styles = StyleSheet.create({
  messageRowGroupAlignmentTrack: {
    marginVertical: 4,
    maxWidth: '80%',
    gap: 3,
  },
  alignToLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  alignToRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    marginLeft: 'auto',
  },
  bubbleWrapperShapeBaseFrame: {
    borderRadius: 20,
    padding: 4,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  bubbleGlassThemeSentColorBlock: {
    backgroundColor: '#0057bd',
    borderTopRightRadius: 4,
  },
  bubbleGlassThemeReceivedColorBlock: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  quotedReplyHeaderBlockBox: {
    padding: 8,
    borderRadius: 12,
    borderLeftWidth: 3,
    marginBottom: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  quotedBorderWhite: {
    borderLeftColor: 'rgba(255,255,255,0.4)',
  },
  quotedBorderDark: {
    borderLeftColor: '#0f172a',
  },
  quotedAuthorMicroHeadingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
  },
  quotedMessageTruncatedPreviewText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  richMediaLayoutHostFrame: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  messageEmbeddedAttachmentImageCanvas: {
    width: 240,
    height: 135,
    borderRadius: 14,
    marginBottom: 4,
  },
  audioPlayerTimelineHostFlexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 210,
    gap: 10,
    paddingVertical: 4,
  },
  audioPlaybackActionTriggerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgWhite: { backgroundColor: '#ffffff' },
  bgSlateDark: { backgroundColor: '#0f172a' },
  audioTimelineTrackRailFiller: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
  },
  audioDurationMonospaceValueText: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  documentDownloadFlexRowLayoutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    padding: 10,
    borderRadius: 12,
    width: 230,
    gap: 10,
  },
  documentIconSquareBadgeNode: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentMetaLabelsStackColumn: {
    flex: 1,
  },
  documentTitleHeadingLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  documentSizeMicroSubtextValue: {
    fontSize: 11,
    color: '#64748b',
  },
  documentDownloadCircleNodeAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationContainerCardFrameNode: {
    width: 230,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  locationMapMockGraphicCanvas: {
    height: 100,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationAddressTextLabelTypography: {
    padding: 8,
    fontSize: 12,
    color: '#334155',
    lineHeight: 15,
  },
  bubbleBodyLabelStandardText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#0057bd',
  },
  bubbleBodyLabelSentText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#ffffff',
  },
  secretScrambledMonospaceTypographyText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '600',
    color: '#4ade80',
  },
  bubbleFooterMetaInformationFlexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  secretTimerPillBadgeBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(20, 83, 45, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  secretTimerValueLabelText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#4ade80',
  },
  editedIndicatorItalicMicroText: {
    fontSize: 10,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  bubbleMessageTimestampLabelTypography: {
    fontSize: 10,
    color: '#94a3b8',
  },
  checkmarkStatusDynamicFlexCluster: {
    marginLeft: 2,
  },
  systemAlertCenteredBadgeContainerTrack: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  systemBadgeLabelPillBackgroundShape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  systemBadgeLabelTypographyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cbd5e1',
  },
});