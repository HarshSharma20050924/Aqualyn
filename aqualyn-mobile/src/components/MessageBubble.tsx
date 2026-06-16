import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Share, Clipboard, Pressable, Modal } from 'react-native';
import { Play, Pause, FileText, Download, MapPin, CheckCheck, Reply, Copy, Trash2, Smile, Timer, Edit2, Wallet, ArrowRight, ShieldAlert } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { Theme } from '../config/theme';

interface MessageBubbleProps {
  msg: any;
  isMe: boolean;
  onReply: (msg: any) => void;
  onEdit?: (msg: any) => void;
  replyMessage?: any;
  onMediaClick?: (msg: any) => void;
  isSecret?: boolean;
}

const ScrambledText = ({ text, isSecret }: { text: string; isSecret?: boolean }) => {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (!isSecret) {
      setDisplayText(text);
      return;
    }
    
    let frame = 0;
    const scrambleChars = '01#$@&%*+=-_?~X';
    const totalFrames = 15;
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
    }, 45);

    return () => clearInterval(interval);
  }, [text, isSecret]);

  return (
    <Text style={[styles.text, isSecret && styles.secretText]}>
      {displayText}
    </Text>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  msg, isMe, onReply, onEdit, replyMessage, onMediaClick, isSecret 
}) => {
  const { deleteMessage, addReaction, currentUser, addToast, chats } = useAppContext();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration] = useState(12); 
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const activeChat = chats.find((c: any) => c.id === msg.chatId);

  useEffect(() => {
    if (!isSecret) return;
    const timerDuration = activeChat?.selfDestructTimer || 30; 
    const createdAtTime = msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now();
    const elapsed = Math.floor((Date.now() - createdAtTime) / 1000);
    const remaining = Math.max(0, timerDuration - elapsed);
    
    setTimeLeft(remaining);

    if (remaining <= 0) {
      deleteMessage(msg.chatId, msg.id);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          deleteMessage(msg.chatId, msg.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSecret, msg.id, msg.chatId, activeChat?.selfDestructTimer]);

  const isSystemNotice = msg.text?.startsWith('[System]') || msg.text?.startsWith('[Security Notice]');
  if (isSystemNotice) {
    return (
      <View style={styles.systemNoticeContainer}>
        <View style={styles.systemNotice}>
          <ShieldAlert size={14} color="#ef4444" />
          <Text style={styles.systemNoticeText}>
            {msg.text.replace(/\[(System|Security Notice)\] /g, '')}
          </Text>
        </View>
      </View>
    );
  }

  const handleCopy = () => {
    if (msg.text) {
      Clipboard.setString(msg.text);
      addToast('Copied to clipboard', 'success');
    }
    setShowContextMenu(false);
  };

  const handleReact = (emoji: string) => {
    addReaction(msg.chatId, msg.id, emoji);
    setShowContextMenu(false);
  };

  const toggleAudio = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      let interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsPlaying(false);
            return 0;
          }
          return prev + 10;
        });
      }, 500);
    }
  };

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <View style={[styles.bubbleContainer, isMe ? styles.alignRight : styles.alignLeft]}>
      
      {/* Context Menu Bottom Sheet/Modal Simulation */}
      <Modal visible={showContextMenu} transparent animationType="fade" onRequestClose={() => setShowContextMenu(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowContextMenu(false)}>
          <View style={[styles.contextMenu, isMe ? styles.contextMenuRight : styles.contextMenuLeft]}>
            <View style={styles.emojiRow}>
              {emojis.map(emoji => (
                <TouchableOpacity key={emoji} onPress={() => handleReact(emoji)}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.menuItem} onPress={() => { onReply(msg); setShowContextMenu(false); }}>
              <Reply size={16} color="white" />
              <Text style={styles.menuItemText}>Reply</Text>
            </TouchableOpacity>
            {msg.text && (
              <TouchableOpacity style={styles.menuItem} onPress={handleCopy}>
                <Copy size={16} color="white" />
                <Text style={styles.menuItemText}>Copy</Text>
              </TouchableOpacity>
            )}
            {isMe && msg.text && onEdit && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { onEdit(msg); setShowContextMenu(false); }}>
                <Edit2 size={16} color="white" />
                <Text style={styles.menuItemText}>Edit</Text>
              </TouchableOpacity>
            )}
            <View style={styles.menuDivider} />
            <TouchableOpacity 
              style={[styles.menuItem, styles.deleteItem]} 
              onPress={() => { deleteMessage(msg.chatId, msg.id); setShowContextMenu(false); }}
            >
              <Trash2 size={16} color="#ef4444" />
              <Text style={styles.menuItemTextDelete}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Reply Header Metadata Display block */}
      {replyMessage && (
        <View style={[styles.replyHeader, isMe ? styles.replyHeaderMe : styles.replyHeaderOther]}>
          <Text style={styles.replySender}>
            {replyMessage.senderId === currentUser?.id ? 'You' : 'Someone'}
          </Text>
          <Text style={styles.replyText} numberOfLines={1}>
            {replyMessage.text || 'Attachment'}
          </Text>
        </View>
      )}

      {/* Main bubble click zone wrapper */}
      <TouchableOpacity 
        activeOpacity={0.9}
        onLongPress={() => setShowContextMenu(true)}
        style={[
          styles.bubble, 
          isMe ? styles.bubbleMe : styles.bubbleOther,
          replyMessage && styles.bubbleWithReply
        ]}
      >
        {msg.imageUrl && (
          <TouchableOpacity onPress={() => onMediaClick?.(msg)}>
            <Image source={{ uri: msg.imageUrl }} style={styles.attachmentImage} resizeMode="cover" />
          </TouchableOpacity>
        )}

        {msg.videoUrl && (
          <TouchableOpacity onPress={() => onMediaClick?.(msg)} style={styles.videoPreview}>
            <Image source={{ uri: msg.videoUrl }} style={styles.attachmentImage} resizeMode="cover" />
            <View style={styles.videoPlayOverlay}>
              <Play size={28} color="white" fill="white" />
            </View>
          </TouchableOpacity>
        )}

        {msg.audioUrl && (
          <View style={styles.audioRow}>
            <TouchableOpacity onPress={toggleAudio} style={[styles.audioPlayButton, isMe ? styles.audioPlayButtonMe : styles.audioPlayButtonOther]}>
              {isPlaying ? <Pause size={16} color="white" fill="white" /> : <Play size={16} color={isMe ? Theme.colors.primary : 'white'} fill={isMe ? Theme.colors.primary : 'white'} />}
            </TouchableOpacity>
            <View style={styles.audioProgressBarBg}>
              <View style={[styles.audioProgressBar, { width: `${audioProgress}%` }, isMe ? styles.progressBarMe : styles.progressBarOther]} />
            </View>
            <Text style={styles.audioDurationText}>{audioDuration}s</Text>
          </View>
        )}

        {msg.location && (
          <View style={styles.locationContainer}>
            <View style={styles.locationMapMock}>
              <MapPin size={24} color="#ef4444" />
            </View>
            <Text style={styles.locationAddress}>{msg.location.address}</Text>
          </View>
        )}

        {(msg.payment || msg.wallet) && (
          <View style={[styles.paymentContainer, isMe ? styles.paymentMe : styles.paymentOther]}>
            <View style={styles.paymentRow}>
              <View style={[styles.paymentIconContainer, msg.payment ? styles.paymentIconPay : styles.paymentIconRequest]}>
                <Wallet size={20} color="white" />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>
                  {msg.payment ? 'Payment' : (msg.wallet?.type === 'request' ? 'Requesting' : 'Sending')}
                </Text>
                <Text style={styles.paymentAmount}>
                  {msg.payment?.currency || '$'}{msg.payment?.amount || msg.wallet?.amount} {msg.wallet?.asset}
                </Text>
              </View>
            </View>
          </View>
        )}

        {msg.text && <ScrambledText text={msg.text} isSecret={isSecret} />}

        {/* Reaction Pill Container Layer */}
        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
          <View style={[styles.reactionsRow, isMe ? styles.reactionsRight : styles.reactionsLeft]}>
            {Object.entries(msg.reactions).map(([emoji, users]: [string, any]) => (
              <View key={emoji} style={styles.reactionPill}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {users.length > 1 && <Text style={styles.reactionCount}>{users.length}</Text>}
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Metadata Metrics Row */}
      <View style={styles.footerRow}>
        {isSecret && timeLeft !== null && (
          <View style={styles.timerContainer}>
            <Timer size={10} color="#4ade80" />
            <Text style={styles.timerText}>{timeLeft}s</Text>
          </View>
        )}
        {msg.isEdited && <Text style={styles.editedText}>edited</Text>}
        <Text style={styles.timeText}>{msg.timestamp || 'Just now'}</Text>
        {isMe && (
          <CheckCheck 
            size={14} 
            color={msg.status === 'read' ? '#38bdf8' : 'rgba(255, 255, 255, 0.4)'} 
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: { marginVertical: 4, maxWidth: '85%' },
  alignRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  alignLeft: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 18, padding: 10, backgroundColor: 'rgba(255,255,255,0.06)' },
  bubbleMe: { backgroundColor: '#1e293b', borderTopRightRadius: 2, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  bubbleOther: { backgroundColor: '#0f172a', borderTopLeftRadius: 2, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  bubbleWithReply: { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  replyHeader: { paddingHorizontal: 10, paddingVertical: 6, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderLeftWidth: 3, minWidth: 150 },
  replyHeaderMe: { backgroundColor: 'rgba(255,255,255,0.08)', borderLeftColor: 'rgba(255,255,255,0.5)' },
  replyHeaderOther: { backgroundColor: 'rgba(0,0,0,0.15)', borderLeftColor: '#0ea5e9' },
  replySender: { color: '#0ea5e9', fontWeight: 'bold', fontSize: 11, marginBottom: 2 },
  replyText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 },
  text: { color: 'white', fontSize: 15, lineHeight: 20 },
  secretText: { color: '#4ade80', fontFamily: 'monospace' },
  systemNoticeContainer: { alignSelf: 'center', marginVertical: 12 },
  systemNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#121820', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  systemNoticeText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  attachmentImage: { width: 240, height: 150, borderRadius: 12, marginBottom: 6 },
  videoPreview: { position: 'relative' },
  videoPlayOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.3)', justifyContent: 'center', alignItems: 'center' },
  audioRow: { flexDirection: 'row', alignItems: 'center', width: 220, gap: 8, marginBottom: 4 },
  audioPlayButton: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  audioPlayButtonMe: { backgroundColor: 'white' },
  audioPlayButtonOther: { backgroundColor: '#0ea5e9' },
  audioProgressBarBg: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  audioProgressBar: { height: '100%', borderRadius: 2 },
  progressBarMe: { backgroundColor: 'white' },
  progressBarOther: { backgroundColor: '#0ea5e9' },
  audioDurationText: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 11, fontWeight: '500' },
  locationContainer: { width: 220, marginBottom: 4 },
  locationMapMock: { height: 100, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  locationAddress: { color: 'white', fontSize: 12, fontWeight: '500' },
  paymentContainer: { width: 220, padding: 10, borderRadius: 12, marginBottom: 4 },
  paymentMe: { backgroundColor: 'rgba(0,0,0,0.15)' },
  paymentOther: { backgroundColor: 'rgba(255,255,255,0.05)' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  paymentIconContainer: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  paymentIconPay: { backgroundColor: '#22c55e' },
  paymentIconRequest: { backgroundColor: '#0ea5e9' },
  paymentInfo: { flex: 1 },
  paymentTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
  paymentAmount: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  timeText: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 10 },
  editedText: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 10, fontStyle: 'italic' },
  timerContainer: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(34, 197, 94, 0.15)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
  timerText: { color: '#4ade80', fontSize: 9, fontWeight: '800' },
  reactionsRow: { position: 'absolute', bottom: -14, flexDirection: 'row', gap: 3 },
  reactionsLeft: { left: 8 },
  reactionsRight: { right: 8 },
  reactionPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2 },
  reactionEmoji: { fontSize: 11 },
  reactionCount: { color: 'white', fontSize: 9, fontWeight: 'bold', marginLeft: 2 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  contextMenu: { backgroundColor: 'rgb(24, 30, 36)', borderRadius: 14, padding: 6, minWidth: 200, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', shadowColor: 'black', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  contextMenuRight: { alignSelf: 'center' },
  contextMenuLeft: { alignSelf: 'center' },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', marginBottom: 4 },
  emojiText: { fontSize: 18 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  menuItemText: { color: 'white', fontSize: 13, fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 4 },
  deleteItem: { paddingVertical: 6 },
  menuItemTextDelete: { color: '#ef4444', fontSize: 13, fontWeight: '600' }
});