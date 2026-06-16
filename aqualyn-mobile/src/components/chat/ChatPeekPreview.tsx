import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { CheckCheck, Lock, Pin, BellOff, Trash2, Archive, Maximize2, X } from 'lucide-react-native';

interface ChatPeekPreviewProps {
  chat: any;
  messages: any[];
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: () => void;
  onArchive: () => void;
  onPin: () => void;
  onMute: () => void;
  onDelete: () => void;
  currentUser: any;
}

export const ChatPeekPreview: React.FC<ChatPeekPreviewProps> = ({
  chat,
  messages = [],
  isOpen,
  onClose,
  onOpenChat,
  onArchive,
  onPin,
  onMute,
  onDelete,
  currentUser,
}) => {
  const recentMessages = messages.slice(-10);

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={onClose}>
      <View style={styles.peekModalBackdropViewportFrame}>
        
        {/* Semi-transparent Backdrop Dismiss Layer */}
        <Animated.View 
          entering={FadeIn.duration(200)} 
          exiting={FadeOut.duration(150)} 
          style={StyleSheet.absoluteFill}
        >
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.backdropDarkBlurLayerMask} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Dialog Card Frame */}
        <Animated.View
          entering={ZoomIn.duration(250)}
          style={styles.cardPreviewBodyShell}
        >
          {/* Header Row */}
          <View style={styles.cardHeaderFlexRowTrack}>
            <View style={styles.identityLeftClusterGroup}>
              <Image source={{ uri: chat?.avatar }} style={styles.chatAvatarSquareFormMedia} />
              <View style={styles.nameHeaderTitleGroupColumn}>
                <Text style={styles.chatNameHeadingTextLabel} numberOfLines={1}>
                  {chat?.isSecret && <Lock size={12} color="#10b981" />} {chat?.name}
                </Text>
                <Text style={styles.chatTypeIndicatorMicroText}>
                  {chat?.isGroup ? 'Group Chat' : 'Personal Chat'}
                </Text>
              </View>
            </View>

            <View style={styles.actionHeaderRightButtonTrack}>
              <TouchableOpacity onPress={onOpenChat} style={styles.headerMaximizeActiveBlueButtonNode} activeOpacity={0.7}>
                <Maximize2 size={16} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.headerDismissGreyButtonNode}>
                <X size={18} color="#0f172a" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages Stream Scroll Panel */}
          <ScrollView 
            style={styles.middleMessageScrollViewTrackContent}
            contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {recentMessages.length === 0 ? (
              <View style={styles.emptyStateNoticeColumnCenteredBox}>
                <Text style={styles.emptyStateNoticeItalicText}>No messages yet</Text>
              </View>
            ) : (
              recentMessages.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;
                return (
                  <View key={msg.id} style={[styles.messageBubbleLineWrapperTrack, isMe ? styles.alignFlexEnd : styles.alignFlexStart]}>
                    <View style={[
                      styles.messageBubbleTextCardFrame,
                      isMe ? styles.bubbleThemeSentColorBlock : styles.bubbleThemeReceivedColorBlock
                    ]}>
                      <Text style={[styles.bubbleMessageTypographyBodyText, isMe ? styles.textWhite : styles.textDarkSlated]}>
                        {msg.text}
                      </Text>
                    </View>
                    
                    <View style={styles.bubbleFooterMetaHorizontalLine}>
                      <Text style={styles.messageMicroTimestampText}>{msg.timestamp}</Text>
                      {isMe && <CheckCheck size={11} color={msg.status === 'read' ? '#38bdf8' : '#94a3b8'} />}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Action Dashboard Panel Matrix */}
          <View style={styles.bottomQuickActionMatrixGridFooter}>
            <TouchableOpacity onPress={onPin} style={styles.matrixGridOptionCellButtonColumn}>
              <Pin size={18} color={chat?.isPinned ? '#38bdf8' : '#64748b'} />
              <Text style={styles.matrixOptionCellLabelTextMicro}>Pin</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onMute} style={styles.matrixGridOptionCellButtonColumn}>
              <BellOff size={18} color={chat?.isMuted ? '#38bdf8' : '#64748b'} />
              <Text style={styles.matrixOptionCellLabelTextMicro}>Mute</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onArchive} style={styles.matrixGridOptionCellButtonColumn}>
              <Archive size={18} color="#64748b" />
              <Text style={styles.matrixOptionCellLabelTextMicro}>Archive</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onDelete} style={styles.matrixGridOptionCellButtonColumn}>
              <Trash2 size={18} color="#ef4444" />
              <Text style={[styles.matrixOptionCellLabelTextMicro, styles.textDestructiveRedColor]} >Delete</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  peekModalBackdropViewportFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdropDarkBlurLayerMask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  cardPreviewBodyShell: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '65%',
    backgroundColor: '#ffffff',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.15,
        shadowRadius: 32,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  cardHeaderFlexRowTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    backgroundColor: 'rgba(15, 23, 42, 0.02)',
  },
  identityLeftClusterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  chatAvatarSquareFormMedia: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  nameHeaderTitleGroupColumn: {
    flex: 1,
    gap: 1,
  },
  chatNameHeadingTextLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  chatTypeIndicatorMicroText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  actionHeaderRightButtonTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerMaximizeActiveBlueButtonNode: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerDismissGreyButtonNode: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleMessageScrollViewTrackContent: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
  },
  emptyStateNoticeColumnCenteredBox: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateNoticeItalicText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  messageBubbleLineWrapperTrack: {
    maxWidth: '85%',
    gap: 3,
  },
  alignFlexStart: {
    alignSelf: 'flex-start',
  },
  alignFlexEnd: {
    alignSelf: 'flex-end',
  },
  messageBubbleTextCardFrame: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleThemeSentColorBlock: {
    backgroundColor: '#0f172a',
    borderBottomRightRadius: 2,
  },
  bubbleThemeReceivedColorBlock: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
  },
  bubbleMessageTypographyBodyText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  textWhite: {
    color: '#ffffff',
  },
  textDarkSlated: {
    color: '#334155',
  },
  bubbleFooterMetaHorizontalLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    alignSelf: 'flex-end',
  },
  messageMicroTimestampText: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '500',
  },
  bottomQuickActionMatrixGridFooter: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.02)',
    borderTopWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    gap: 4,
  },
  matrixGridOptionCellButtonColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  matrixOptionCellLabelTextMicro: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  textDestructiveRedColor: {
    color: '#ef4444',
  },
});