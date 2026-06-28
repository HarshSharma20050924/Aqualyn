import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import BubbleLoader from '../components/ui/BubbleLoader';
import { ArrowLeft, Video, Phone, MoreVertical, Plus, Smile, Mic, CheckCheck, Users, X, Clock, Lock, Search, Download, Trash2, Edit2, Share2, UserPlus, User, Sparkles, Droplet } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useCall } from '../context/CallContext';
import { auth } from '../config/firebase';
import { Message } from '../types';
import { ENDPOINTS } from '../config/api';
import MediaAttachmentPicker from '../components/chat/MediaAttachmentPicker';
import AudioRecorderUI from '../components/chat/AudioRecorderUI';
import CameraUI from '../components/chat/CameraUI';
import MessageBubble from '../components/chat/MessageBubble';
import MediaGallery from '../components/chat/MediaGallery';
import GroupInfoScreen from './GroupInfoScreen';
import SecretChatInfoScreen from './SecretChatInfoScreen';
import ShareContactModal from '../components/chat/ShareContactModal';
import LynPanel from '../components/ai/LynPanel';
import { AIService } from '../services/ai.service';

import { apiFetch } from '../utils/fetcher';
import { uploadFile } from '../utils/uploads';
import { dataURLtoFile } from '../utils/media';

export default function ChatDetailScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate: (s: string) => void }) {
  const { messages, setMessages, sendMessage, editMessage, deleteMessage, currentUser, chats, activeChatId, addToast, setActiveChatId, setOriginChatId, setActiveContactId, contacts, globalUsers, followUser, typingUsers, setTyping, markAsRead, handleSecretChatInvitation } = useAppContext();
  const { startCall } = useCall();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [isAttachmentPickerOpen, setIsAttachmentPickerOpen] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const typingInThisChat = typingUsers[activeChatId || ''] || [];
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isShareContactOpen, setIsShareContactOpen] = useState(false);

  // New states for modals
  const [galleryMedia, setGalleryMedia] = useState<{ id: string, url: string, type: 'image' | 'video' }[]>([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isSecretInfoOpen, setIsSecretInfoOpen] = useState(false);
  const [showLynPanel, setShowLynPanel] = useState(false);
  const [isAiMentionMenuOpen, setIsAiMentionMenuOpen] = useState(false);

  // Lyn AI settings (persisted per-chat in localStorage)
  const getSavedSetting = (chatId: string | null, key: string, defaultVal: any) => {
    if (!chatId) return defaultVal;
    try {
      const saved = localStorage.getItem(`lyn_${key}_${chatId}`);
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return defaultVal;
  };

  const [aiEnabled, setAiEnabled] = useState(() => getSavedSetting(activeChatId, 'enabled', true));
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(() => getSavedSetting(activeChatId, 'suggestions', true));
  const [lynPersonality, setLynPersonality] = useState(() => getSavedSetting(activeChatId, 'personality', 'friendly'));
  const [lynCustomPersonality, setLynCustomPersonality] = useState(() => getSavedSetting(activeChatId, 'customPersonality', ''));
  const [lynFriendMode, setLynFriendMode] = useState(() => getSavedSetting(activeChatId, 'friendMode', false));
  const [lynResponseRate, setLynResponseRate] = useState(() => getSavedSetting(activeChatId, 'responseRate', 50));

  // Re-load settings when the active chat changes
  const isInitialMount = useRef(true);
  useEffect(() => {
    isInitialMount.current = true;
    setAiEnabled(getSavedSetting(activeChatId, 'enabled', true));
    setAiSuggestionsEnabled(getSavedSetting(activeChatId, 'suggestions', true));
    setLynPersonality(getSavedSetting(activeChatId, 'personality', 'friendly'));
    setLynCustomPersonality(getSavedSetting(activeChatId, 'customPersonality', ''));
    setLynFriendMode(getSavedSetting(activeChatId, 'friendMode', false));
    setLynResponseRate(getSavedSetting(activeChatId, 'responseRate', 50));
  }, [activeChatId]);

  // Only save when explicitly triggered by the LynPanel Save button
  const handleLynSave = ({ aiEnabled: en, aiSuggestionsEnabled: sug, personality: per, customPersonality: cus, friendMode: fm, responseRate: rr }: {
    aiEnabled: boolean; aiSuggestionsEnabled: boolean; personality: string; customPersonality: string; friendMode: boolean; responseRate: number;
  }) => {
    if (!activeChatId) return;
    setAiEnabled(en);
    setAiSuggestionsEnabled(sug);
    setLynPersonality(per);
    setLynCustomPersonality(cus);
    setLynFriendMode(fm);
    setLynResponseRate(rr);
    localStorage.setItem(`lyn_enabled_${activeChatId}`, JSON.stringify(en));
    localStorage.setItem(`lyn_suggestions_${activeChatId}`, JSON.stringify(sug));
    localStorage.setItem(`lyn_personality_${activeChatId}`, JSON.stringify(per));
    localStorage.setItem(`lyn_customPersonality_${activeChatId}`, JSON.stringify(cus));
    localStorage.setItem(`lyn_friendMode_${activeChatId}`, JSON.stringify(fm));
    localStorage.setItem(`lyn_responseRate_${activeChatId}`, JSON.stringify(rr));
    addToast('Lyn settings saved ✓', 'success');
  };

  // Draft flow
  const [isDraftConfirmOpen, setIsDraftConfirmOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [isDraftLoading, setIsDraftLoading] = useState(false);

  // Smart replies — fetched from AI, refreshed when chat changes or a new message arrives
  const [smartReplies, setSmartReplies] = useState<string[]>([]);

  useEffect(() => {
    if (!activeChatId || !aiEnabled || !aiSuggestionsEnabled) {
      setSmartReplies([]);
      return;
    }
    let cancelled = false;
    const fetchReplies = async () => {
      try {
        const replies = await AIService.getSmartReplies(activeChatId);
        if (!cancelled && Array.isArray(replies) && replies.length > 0) {
          setSmartReplies(replies.slice(0, 4));
        }
      } catch {
        // silently fail — smart replies are optional
      }
    };
    fetchReplies();
    return () => { cancelled = true; };
  }, [activeChatId, aiEnabled, aiSuggestionsEnabled, (messages[activeChatId || ''] || []).length]);

  const handleGenerateDraft = async () => {
    setIsDraftLoading(true);
    setDraftText('');
    try {
      const tone = lynCustomPersonality.trim() || lynPersonality;
      const res = await AIService.draftResponse(activeChatId!, tone);
      setDraftText(res.draft);
    } catch { setDraftText('Unable to generate a draft. Please try again.'); }
    finally { setIsDraftLoading(false); }
  };

  const chat = chats.find(c => c.id === activeChatId);
  const isLynChat = chat?.name === 'Lyn';
  const chatMessages = activeChatId ? (messages[activeChatId] || []) : [];
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [screenshotAlert, setScreenshotAlert] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hideSmartReplies, setHideSmartReplies] = useState(false);

  const triggerScreenshotAlert = () => {
    const settings = (chat as any)?.settings || {};
    if (settings.screenshotProtection === false) return; // don't trigger if disabled

    setScreenshotAlert(true);
    addToast('⚠️ INCOGNITO SCREENSHOT ATTEMPT DETECTED!', 'error');
    if (activeChatId) {
      sendMessage(activeChatId, '[System] Screenshot not allowed');
    }
    setTimeout(() => setScreenshotAlert(false), 2500);
  };

  if (!chat) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <BubbleLoader />
      </div>
    );
  }

  useEffect(() => {
    if (!chat || !chat.isSecret) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const settings = (chat as any)?.settings || {};
      if (settings.screenshotProtection === false) return;
      if (
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && (e.key === 's' || e.key === 'S' || e.key === '3' || e.key === '4'))
      ) {
        e.preventDefault();
        triggerScreenshotAlert();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chat?.isSecret, activeChatId, (chat as any)?.settings?.screenshotProtection]);

  if (!chat) return null;

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 50);
    }
  }, [chatMessages.length]);

  useEffect(() => {
    if (activeChatId) {
      markAsRead(activeChatId);
    }
  }, [activeChatId, chatMessages.length]);

  useEffect(() => {
    if (activeChatId && (!messages[activeChatId] || messages[activeChatId].length === 0)) {
      setIsLoadingMessages(true);
      setPage(1);
      setHasMore(true);
      const fetchHistory = async () => {
        try {
          const res = await apiFetch(`${ENDPOINTS.CHAT_MESSAGES(activeChatId)}?page=1&limit=50`);
          if (res.ok) {
            const data = await res.json();
            setMessages(prev => ({ ...prev, [activeChatId]: data }));
            if (data.length < 50) setHasMore(false);
          }
        } catch (e) {
          console.error("Failed to fetch history:", e);
        } finally {
          setIsLoadingMessages(false);
        }
      };
      fetchHistory();
    }
  }, [activeChatId]);

  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop < 100 && hasMore && !isFetchingMore && !isLoadingMessages) {
      setIsFetchingMore(true);
      try {
        const nextPage = page + 1;
        const res = await apiFetch(`${ENDPOINTS.CHAT_MESSAGES(activeChatId as string)}?page=${nextPage}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            const previousScrollHeight = target.scrollHeight;
            setMessages(prev => {
              const currentMessages = prev[activeChatId as string] || [];
              const newMessages = data.filter((d: any) => !currentMessages.some((m: any) => m.id === d.id));
              return { ...prev, [activeChatId as string]: [...newMessages, ...currentMessages] };
            });
            setPage(nextPage);
            setTimeout(() => {
              target.scrollTop = target.scrollHeight - previousScrollHeight;
            }, 0);
          }
          if (data.length < 50) setHasMore(false);
        }
      } catch (e) {
        console.error("Failed to fetch more messages:", e);
      } finally {
        setIsFetchingMore(false);
      }
    }
  };

  useEffect(() => {
    if (!activeChatId) return;
    if (text.length > 0) {
      setTyping(activeChatId, true);
    } else {
      setTyping(activeChatId, false);
    }
  }, [text, activeChatId, setTyping]);

  if (!chat) return null;

  const targetUserId = !chat.isGroup ? chat.participantIds?.find(id => id !== currentUser?.id) : null;
  const targetUser = targetUserId ? globalUsers.find(u => u.id === targetUserId) : null;
  const isPrivateRestricted = targetUser?.isPrivate && !currentUser?.following?.includes(targetUser.id);
  const isRequested = targetUser?.followRequests?.includes(currentUser?.id || '');

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || !activeChatId) return;

    if (editingMessage) {
      editMessage(activeChatId, editingMessage.id, text);
      setEditingMessage(null);
    } else {
      sendMessage(activeChatId, text, {
        replyToId: replyingTo?.id,
        aiSettings: {
          enabled: aiEnabled,
          personality: lynCustomPersonality.trim() ? lynCustomPersonality : lynPersonality,
          customPersonality: lynCustomPersonality,
          friendMode: lynFriendMode,
          responseRate: lynResponseRate
        }
      });
    }

    setText('');
    setReplyingTo(null);
    setIsAiMentionMenuOpen(false);
    if (activeChatId) setTyping(activeChatId, false);
    // Reset textarea height
    const ta = document.querySelector<HTMLTextAreaElement>('textarea[data-msg-input]');
    if (ta) ta.style.height = '48px';

    // Force scroll to bottom immediately and slightly after render
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleEdit = (msg: Message) => {
    setEditingMessage(msg);
    setText(msg.text || '');
    setReplyingTo(null);
  };

  const handleScheduleMessage = () => {
    if (!text.trim() || !activeChatId) return;
    sendMessage(activeChatId, text, {
      schedule: { title: 'Reminder: ' + text, time: 'Tomorrow at 9:00 AM' },
      replyToId: replyingTo?.id
    });
    addToast('Message scheduled', 'success');
    setText('');
    setReplyingTo(null);
    setShowSchedulePicker(false);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  const handleAttachmentSelect = (type: string) => {
    switch (type) {
      case 'camera':
        setIsCameraOpen(true);
        break;
      case 'document':
        fileInputRef.current?.click();
        break;
      case 'photo':
        imageInputRef.current?.click();
        break;
      case 'location':
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition((position) => {
            sendMessage(activeChatId as string, '', {
              location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                address: 'Current Location'
              },
              replyToId: replyingTo?.id
            });
            setReplyingTo(null);
            addToast('Location sent', 'success');
          }, (err) => {
            addToast('Could not get location', 'error');
          });
        }
        break;
      case 'wallet':
        sendMessage(activeChatId as string, '', {
          wallet: { asset: 'ETH', amount: 0.05, address: '0x71C...3a42', type: 'request' },
          replyToId: replyingTo?.id
        });
        setReplyingTo(null);
        addToast('Wallet request sent', 'success');
        break;
      case 'schedule':
        setShowSchedulePicker(true);
        break;
      case 'contact':
        setIsShareContactOpen(true);
        break;
      default:
        addToast(`Feature coming soon`, 'info');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFile(file);
      if (type === 'image') {
        sendMessage(activeChatId as string, '', { imageUrl: url, replyToId: replyingTo?.id });
        addToast('Photo sent', 'success');
      } else {
        sendMessage(activeChatId as string, '', {
          document: { url, name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + ' MB' },
          replyToId: replyingTo?.id
        });
        addToast('Document sent', 'success');
      }
      setReplyingTo(null);
    } catch (err) {
      addToast('Upload failed', 'error');
    }
  };

  const handleAudioStop = async (audioUrl?: string) => {
    setIsRecordingAudio(false);
    if (audioUrl && activeChatId) {
      try {
        // audioUrl from AudioRecorderUI is already a base64 string now
        const file = dataURLtoFile(audioUrl, `voice-${Date.now()}.webm`);
        const url = await uploadFile(file);
        sendMessage(activeChatId, '', { audioUrl: url, replyToId: replyingTo?.id });
        setReplyingTo(null);
        addToast('Voice message sent', 'success');
      } catch (err) {
        addToast('Failed to send voice message', 'error');
      }
    }
  };

  const handleCameraCapture = async (mediaUrl: string, type: 'photo' | 'video') => {
    if (activeChatId) {
      try {
        const file = dataURLtoFile(mediaUrl, `camera-${Date.now()}.${type === 'photo' ? 'jpg' : 'webm'}`);
        const url = await uploadFile(file);
        if (type === 'photo') {
          sendMessage(activeChatId, '', { imageUrl: url, replyToId: replyingTo?.id });
        } else {
          sendMessage(activeChatId, '', { videoUrl: url, replyToId: replyingTo?.id });
        }
        setReplyingTo(null);
        addToast(`${type === 'photo' ? 'Photo' : 'Video'} sent`, 'success');
      } catch (err) {
        addToast('Capture upload failed', 'error');
      }
    }
  };

  const handleMediaClick = (msg: Message) => {
    // Extract all media from current chat
    const allMedia = chatMessages
      .filter(m => m.imageUrl || m.videoUrl)
      .map(m => ({
        id: m.id,
        url: (m.imageUrl || m.videoUrl) as string,
        type: m.imageUrl ? 'image' as const : 'video' as const
      }));

    const clickedIndex = allMedia.findIndex(m => m.id === msg.id);

    if (clickedIndex !== -1) {
      setGalleryMedia(allMedia);
      setGalleryInitialIndex(clickedIndex);
      setIsGalleryOpen(true);
    }
  };


  const handleDeleteChat = () => {
    addToast('Chat deleted', 'success');
    setActiveChatId(null);
  };

  const handleExportChat = () => {
    addToast('Chat exported as PDF', 'success');
    setShowHeaderMenu(false);
  };

  const filteredMessages = useMemo(
    () => chatMessages.filter(m =>
      !searchQuery || m.text?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [chatMessages, searchQuery]
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`min-h-screen flex flex-col transition-all duration-500 relative overflow-hidden ${chat.isSecret
        ? 'bg-[#0a0f14] text-slate-300 font-sans selection:bg-blue-500/30 selection:text-white'
        : 'bg-aqua-depth'
        }`}
    >
      {/* Incognito Cyber Grid & Scanning Scanlines */}
      {chat.isSecret && (
        <>
          <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{
            backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-blue-500/0 via-blue-500/[0.02] to-blue-500/0" />
        </>
      )}

      {/* Screen Flash alert for screenshot warning */}
      <AnimatePresence>
        {screenshotAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[9999] bg-red-600/40 backdrop-blur-md pointer-events-none flex flex-col items-center justify-center border-8 border-red-500 animate-pulse"
          >
            <div className="bg-black/90 p-8 rounded-[2rem] border-2 border-red-500 flex flex-col items-center gap-4 text-center max-w-sm shadow-2xl">
              <span className="text-4xl">⚠️</span>
              <h2 className="text-xl font-extrabold text-red-500 uppercase tracking-widest">SCREENSHOT DETECTED</h2>
              <p className="text-xs text-white/80 font-medium font-sans">Incognito security protocols triggered. Warning notification sent to chat partners.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className={`fixed top-0 w-full z-50 border-b shadow-[0_8px_32px_0_rgba(0,87,189,0.06)] flex flex-col px-6 max-w-none transition-all duration-300 ${chat.isSecret
        ? 'bg-[#0a0f14]/95 border-slate-800/80 backdrop-blur-2xl text-slate-300'
        : 'bg-slate-50/70 backdrop-blur-xl border-white/15'
        }`}>
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className={`p-2 rounded-full transition-colors active:scale-95 duration-200 ${chat.isSecret ? 'text-slate-400 hover:bg-slate-800/50' : 'text-slate-500 hover:bg-white/20'}`}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="relative cursor-pointer" onClick={() => {
              if (chat.isGroup) setIsGroupInfoOpen(true);
              else if (chat.isSecret) setIsSecretInfoOpen(true);
              else {
                const effectiveTargetId = targetUserId || chat.participantIds?.find(id => id !== currentUser?.id) || chat.id;
                setOriginChatId(activeChatId);
                setActiveContactId(effectiveTargetId);
                onNavigate('contact-profile');
              }
            }}>
              {chat.isGroup ? (
                <div className={`w-10 h-10 rounded-full border-2 shadow-sm flex items-center justify-center overflow-hidden ${chat.isSecret ? 'border-slate-700 bg-[#0a0f14] text-blue-400' : 'border-white bg-surface-container-highest text-primary'}`}>
                  <Users className="w-6 h-6 fill-current" />
                </div>
              ) : (
                <img src={chat.avatar} alt={chat.name} className={`w-10 h-10 rounded-full border-2 shadow-sm ${chat.isSecret ? 'border-slate-700' : 'border-white'}`} />
              )}
              <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 rounded-full ${chat.isSecret ? 'bg-blue-500 border-[#0a0f14] shadow-[0_0_8px_#3b82f6]' : 'bg-secondary-fixed border-white shadow-[0_0_8px_#0bfbff]'}`}></div>
            </div>
            <div className="flex flex-col cursor-pointer min-w-0" onClick={() => {
              if (chat.isGroup) setIsGroupInfoOpen(true);
              else if (chat.isSecret) setIsSecretInfoOpen(true);
              else {
                const effectiveTargetId = targetUserId || chat.participantIds?.find(id => id !== currentUser?.id) || chat.id;
                setActiveContactId(effectiveTargetId);
                onNavigate('contact-profile');
              }
            }}>
              <span className={`font-headline tracking-tight font-bold text-lg leading-tight flex items-center gap-1 truncate ${chat.isSecret ? 'text-slate-200' : 'text-on-surface'}`}>
                {chat.isSecret && <Lock className="w-4 h-4 text-blue-400 shrink-0" />}
                <span className="truncate">{chat.name}</span>
              </span>
              <span className={`text-[11px] font-bold tracking-wider uppercase truncate ${chat.isSecret ? 'text-blue-400' : 'text-secondary-fixed-variant'
                }`}>
                {chat.isSecret ? '🔒 Incognito Session' : chat.isGroup ? `${chat.participantIds?.length || 0} members` : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            <button onClick={() => startCall(chat.id, chat.name, chat.avatar, 'VIDEO')} className={`p-2 rounded-full transition-colors active:scale-95 duration-200 ${chat.isSecret ? 'text-slate-400 hover:bg-slate-800/50' : 'text-cyan-600 hover:bg-white/20'}`}>
              <Video className="w-5 h-5 fill-current" />
            </button>
            <button onClick={() => startCall(chat.id, chat.name, chat.avatar, 'VOICE')} className={`p-2 rounded-full transition-colors active:scale-95 duration-200 ${chat.isSecret ? 'text-slate-400 hover:bg-slate-800/50' : 'text-cyan-600 hover:bg-white/20'}`}>
              <Phone className="w-5 h-5 fill-current" />
            </button>
            {/* Lyn AI Settings — only in the Lyn AI chat */}
            {isLynChat && (
              <button
                onClick={() => setShowLynPanel(prev => !prev)}
                className={`relative p-2 rounded-full transition-all active:scale-95 duration-200 ${showLynPanel ? 'bg-secondary/15' : ''
                  } text-secondary hover:bg-white/20`}
                title="Lyn AI Settings"
              >
                <Droplet className={`w-5 h-5 transition-all ${showLynPanel ? 'fill-secondary' : 'fill-secondary/30'}`} />
                {showLynPanel && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-secondary rounded-full shadow-md" />}
              </button>
            )}
            <button onClick={() => setShowHeaderMenu(!showHeaderMenu)} className={`p-2 rounded-full transition-colors active:scale-95 duration-200 ${chat.isSecret ? 'text-slate-400 hover:bg-slate-800/50' : 'text-cyan-600 hover:bg-white/20'}`}>
              <MoreVertical className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showHeaderMenu && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={() => setShowHeaderMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-52 glass-card rounded-2xl p-2 shadow-xl border border-white/20 z-50 flex flex-col gap-1"
                  >
                    {/* Feature 4 – View Profile / Group Info */}
                    <button
                      onClick={() => {
                        setShowHeaderMenu(false);
                        if (chat.isGroup) {
                          setIsGroupInfoOpen(true);
                        } else {
                          const tid = chat.participantIds?.find(id => id !== currentUser?.id) || chat.id;
                          setOriginChatId(activeChatId);
                          setActiveContactId(tid);
                          onNavigate('contact-profile');
                        }
                      }}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-sm font-medium text-on-surface transition-colors"
                    >
                      {chat.isGroup ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      {chat.isGroup ? 'Group Info' : 'View Profile'}
                    </button>
                    <button onClick={() => { setIsSearchOpen(!isSearchOpen); setShowHeaderMenu(false); }} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-sm font-medium text-on-surface transition-colors">
                      <Search className="w-4 h-4" /> Search
                    </button>
                    {!chat.isSecret && (
                      <button onClick={() => { setShowLynPanel(true); setShowHeaderMenu(false); }} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-sm font-medium text-secondary transition-colors">
                        <Droplet className="w-4 h-4 fill-secondary/20" /> Lyn AI Settings
                      </button>
                    )}
                    <button onClick={() => { setShowHeaderMenu(false); setIsShareContactOpen(true); }} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-sm font-medium text-on-surface transition-colors">
                      <Share2 className="w-4 h-4" /> Share Contact
                    </button>
                    <button onClick={() => { setShowHeaderMenu(false); addToast('Chat history cleared', 'success'); }} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-sm font-medium text-on-surface transition-colors">
                      <Clock className="w-4 h-4" /> Chat History
                    </button>
                    <button onClick={handleExportChat} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-sm font-medium text-on-surface transition-colors">
                      <Download className="w-4 h-4" /> Export Chat
                    </button>
                    <button onClick={handleDeleteChat} className="flex items-center gap-3 px-3 py-2 hover:bg-red-500/10 text-red-500 rounded-xl text-sm font-medium transition-colors">
                      <Trash2 className="w-4 h-4" /> Delete Chat
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pb-3 overflow-hidden"
            >
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search in chat..."
                  className="w-full h-10 pl-9 pr-10 rounded-xl bg-white/50 backdrop-blur-md border border-white/30 focus:outline-none focus:ring-2 focus:ring-secondary/30 text-sm"
                />
                <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lyn AI Settings Panel — available in any chat */}
        <AnimatePresence>
          {showLynPanel && (
            <LynPanel
              onClose={() => setShowLynPanel(false)}
              aiEnabled={aiEnabled}
              aiSuggestionsEnabled={aiSuggestionsEnabled}
              personality={lynPersonality}
              customPersonality={lynCustomPersonality}
              friendMode={lynFriendMode}
              responseRate={lynResponseRate}
              onSave={handleLynSave}
              onDiscoverChannels={() => {
                window.localStorage.setItem('exploreQuery', chat.name || '');
                onNavigate?.('explore');
              }}
            />
          )}
        </AnimatePresence>
      </header>

      <main ref={scrollRef} onScroll={handleScroll} className={`flex-1 ${showLynPanel ? 'pt-52' : isSearchOpen ? 'pt-28' : 'pt-20'} pb-28 px-4 md:px-8 max-w-4xl mx-auto w-full flex flex-col overflow-y-auto`}>
        <div className="flex-1 min-h-[20px]"></div>
        <div className="flex justify-center my-8">
          <span className="bg-surface-container-low px-4 py-1 rounded-full text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest border border-white/40">Today, Oct 24</span>
        </div>

        <div className="space-y-6 flex flex-col justify-end">
          {isLoadingMessages ? (
            <div className="flex justify-center py-8">
              <BubbleLoader />
            </div>
          ) : (
            <>
              {isFetchingMore && (
                <div className="flex justify-center py-4">
                  <BubbleLoader />
                </div>
              )}
              {(() => {
                const LYN_ID = 'lyn-ai-user-id';
                const lastLynMsgId = [...filteredMessages].reverse().find(m => m.senderId === LYN_ID)?.id;
                return filteredMessages.map((msg, i) => {
                if (msg.text?.startsWith('[System] 🔒 Secret Chat Request:::')) {
                  const secretChatId = msg.text.split(':::')[1];
                  const isSender = msg.senderId === currentUser?.id;
                  return (
                    <div key={msg.id} className="flex justify-center my-4">
                      <div className="bg-surface-container border border-blue-500/30 p-4 rounded-2xl w-full max-w-sm flex flex-col items-center shadow-[0_8px_32px_rgba(0,122,255,0.1)]">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 mb-3">
                          <Lock className="w-6 h-6" />
                        </div>
                        <h4 className="text-on-surface font-bold text-lg mb-1">Secret Chat Request</h4>
                        <p className="text-sm text-on-surface-variant text-center mb-4">
                          {isSender
                            ? 'Waiting for the other user to accept your request to start an end-to-end encrypted session.'
                            : 'Wants to start an end-to-end encrypted secret chat with you.'}
                        </p>

                        {!isSender && (
                          <div className="flex w-full gap-2 mt-2">
                            <button
                              onClick={async () => {
                                await handleSecretChatInvitation(secretChatId, 'accept');
                                setActiveChatId(secretChatId);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-xl transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleSecretChatInvitation(secretChatId, 'decline')}
                              className="flex-1 bg-surface-container-highest hover:bg-surface-container-high text-on-surface-variant font-medium py-2 rounded-xl transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                  const isLyn = msg.senderId === LYN_ID;
                  return (
                    <div key={msg.id} className={`flex w-full ${isLyn ? 'gap-2 items-end' : ''}`}>
                      {isLyn && (
                        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-secondary/20 mb-6 bg-surface-container-high">
                           <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150" alt="Lyn AI" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <MessageBubble
                          msg={msg}
                          isMe={msg.senderId === currentUser?.id}
                          onReply={setReplyingTo}
                          onEdit={handleEdit}
                          replyMessage={msg.replyToId ? chatMessages.find(m => m.id === msg.replyToId) : undefined}
                          onMediaClick={handleMediaClick}
                          isSecret={chat.isSecret}
                          animateTyping={msg.id === lastLynMsgId && isLyn}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </>
          )}

          {!isLoadingMessages && filteredMessages.length === 0 && (
            <div className="py-14 text-center text-on-surface-variant">
              <p className="text-sm font-medium">No messages yet. Start the conversation now.</p>
            </div>
          )}

          <div ref={bottomRef} className="h-4 w-full" />
        </div>
      </main>

      <div className={`fixed bottom-0 left-0 w-full p-4 md:p-6 z-50 transition-colors duration-300 ${chat.isSecret
        ? 'bg-gradient-to-t from-black via-black/95 to-transparent'
        : 'bg-gradient-to-t from-background via-background/90 to-transparent'
        }`}>
        <div className="max-w-4xl mx-auto w-full relative">
          {isPrivateRestricted ? (
            <div className={`flex flex-col items-center gap-3 py-4 border rounded-[2rem] shadow-xl ${chat.isSecret
              ? 'bg-[#0a0f14] border-slate-800 text-slate-400'
              : 'glass-card border-white/40 text-on-surface-variant'
              }`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lock className="w-4 h-4 text-blue-400" />
                <span>This account is private</span>
              </div>
              {isRequested ? (
                <button
                  className={`w-full max-w-xs py-3 rounded-2xl font-bold border flex items-center justify-center gap-2 cursor-default ${chat.isSecret
                    ? 'bg-[#121820] text-blue-400 border-slate-800'
                    : 'bg-surface-container text-on-surface-variant border-white/40'
                    }`}
                >
                  <Clock className="w-5 h-5" />
                  Follow Request Pending
                </button>
              ) : (
                <button
                  onClick={() => followUser(targetUser!.id)}
                  className={`w-full max-w-xs py-3 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${chat.isSecret
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/10'
                    : 'liquid-gradient text-white shadow-primary/20'
                    }`}
                >
                  <UserPlus className="w-5 h-5" />
                  Follow to Message
                </button>
              )}
              <p className="text-[10px] text-center px-4 opacity-75">
                You need to be a follower to send messages to this private account.
              </p>
            </div>
          ) : chat.isSecret && !(chat as any)?.settings?.isVerified ? (
            <div className="flex flex-col items-center gap-3 py-6 px-4 border rounded-[2rem] shadow-xl bg-[#0a0f14] border-blue-500/20 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-200 mb-1">Chat Locked — Verification Required</p>
                <p className="text-xs text-slate-500">Both participants must verify each other before chatting. Tap the header to open Security Settings.</p>
              </div>
            </div>
          ) : chat.isChannel && !['OWNER', 'ADMIN'].includes(chat.myRole || '') ? (
            <div className="flex flex-col items-center justify-center py-6 px-4 border-t border-outline-variant/10 bg-surface-container/30">
              <p className="text-sm font-medium text-on-surface-variant">Only admins can send messages</p>
            </div>
          ) : (
            <>
              <AnimatePresence>
                {editingMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                    className={`absolute bottom-full left-0 right-0 mb-4 mx-4 p-3 border rounded-2xl shadow-lg flex items-center justify-between ${chat.isSecret
                      ? 'bg-[#0a0f14]/95 border-slate-800 text-slate-300'
                      : 'bg-surface/90 backdrop-blur-xl border-white/20 text-on-surface'
                      }`}
                  >
                    <div className={`flex-1 min-w-0 border-l-4 pl-3 ${chat.isSecret ? 'border-slate-700' : 'border-primary'}`}>
                      <p className={`text-xs font-bold mb-1 flex items-center gap-1 ${chat.isSecret ? 'text-blue-400' : 'text-primary'}`}><Edit2 className="w-3 h-3" /> Edit Message</p>
                      <p className="text-sm truncate">{editingMessage.text}</p>
                    </div>
                    <button onClick={() => { setEditingMessage(null); setText(''); }} className="p-2 hover:bg-white/10 rounded-full transition-colors text-on-surface-variant">
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}
                {replyingTo && !editingMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                    className={`absolute bottom-full left-0 right-0 mb-4 mx-4 p-3 border rounded-2xl shadow-lg flex items-center justify-between ${chat.isSecret
                      ? 'bg-[#0a0f14]/95 border-slate-800 text-slate-300'
                      : 'bg-surface/90 backdrop-blur-xl border-white/20 text-on-surface'
                      }`}
                  >
                    <div className={`flex-1 min-w-0 border-l-4 pl-3 ${chat.isSecret ? 'border-slate-700' : 'border-secondary'}`}>
                      <p className="text-xs font-bold mb-1">Replying to {replyingTo.senderId === currentUser?.id ? 'yourself' : 'message'}</p>
                      <p className="text-sm truncate">{replyingTo.text || 'Attachment'}</p>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-on-surface-variant">
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AudioRecorderUI
                isRecording={isRecordingAudio}
                onStop={handleAudioStop}
                onCancel={() => setIsRecordingAudio(false)}
              />

              {!isRecordingAudio && (
                <div className="w-full flex flex-col gap-2">

                  {/* @lyn mention popup */}
                  <AnimatePresence>
                    {isAiMentionMenuOpen && aiEnabled && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="w-full bg-surface-container-lowest border border-outline-variant/20 shadow-xl rounded-2xl overflow-hidden z-50 p-2"
                      >
                        <div className="px-3 py-2 border-b border-outline-variant/10 text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Droplet className="w-3.5 h-3.5 text-secondary fill-secondary" /> AI Actions
                          </div>
                          <button onClick={() => setIsAiMentionMenuOpen(false)} className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          <button
                            onClick={() => {
                              setText(t => t.replace(/@lyn/i, '').trim());
                              setIsAiMentionMenuOpen(false);
                              setIsDraftConfirmOpen(true);
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-surface-container rounded-xl flex flex-col gap-0.5 transition-colors"
                          >
                            <span className="font-bold text-sm text-on-surface font-headline">Draft Message</span>
                            <span className="text-[11px] text-on-surface-variant">Write a context-aware reply in your tone</span>
                          </button>
                          <button
                            onClick={() => {
                              setText(t => t.replace(/@lyn/i, '').trim());
                              setIsAiMentionMenuOpen(false);
                              window.localStorage.setItem('exploreQuery', 'AI_RECOMMENDED_PEOPLE');
                              onNavigate?.('explore');
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-surface-container rounded-xl flex flex-col gap-0.5 transition-colors"
                          >
                            <span className="font-bold text-sm text-on-surface font-headline">Discover People Like You</span>
                            <span className="text-[11px] text-on-surface-variant">Find others discussing similar topics</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Draft confirm + textarea */}
                  <AnimatePresence>
                    {isDraftConfirmOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="w-full glass-card rounded-2xl border border-outline-variant/20 shadow-xl p-4 space-y-3"
                      >
                        {/* Tone row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="relative w-6 h-6 shrink-0">
                              <div className="absolute inset-0 bg-gradient-to-br from-secondary-fixed to-primary-container rounded-md rotate-12 opacity-30" />
                              <div className="relative w-full h-full glass-card rounded-md flex items-center justify-center">
                                <Droplet className="w-3.5 h-3.5 text-secondary fill-secondary" />
                              </div>
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Draft Message</span>
                          </div>
                          <button onClick={() => { setIsDraftConfirmOpen(false); setDraftText(''); }} className="p-1 rounded-full text-on-surface-variant hover:bg-white/20">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Tone indicator */}
                        <div className="flex items-center gap-2 bg-surface-container rounded-xl px-3 py-2 border border-outline-variant/10">
                          <span className="text-[11px] text-on-surface-variant">Tone:</span>
                          <span className="text-[11px] font-bold text-secondary capitalize">
                            {lynCustomPersonality.trim() || lynPersonality}
                          </span>
                          {isLynChat && (
                            <button
                              onClick={() => { setIsDraftConfirmOpen(false); setDraftText(''); setShowLynPanel(true); }}
                              className="ml-auto text-[10px] text-secondary underline underline-offset-2"
                            >
                              Change in Lyn Settings
                            </button>
                          )}
                        </div>

                        {/* Draft textarea */}
                        {draftText ? (
                          <textarea
                            value={draftText}
                            onChange={e => setDraftText(e.target.value)}
                            rows={4}
                            className="w-full rounded-xl bg-surface-container border border-outline-variant/20 px-3 py-2.5 text-sm text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                          />
                        ) : (
                          <div className="w-full h-24 rounded-xl bg-surface-container border border-outline-variant/10 flex items-center justify-center">
                            {isDraftLoading ? (
                              <div className="flex gap-1">
                                {[0, 150, 300].map(d => (
                                  <span key={d} className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-on-surface-variant italic">Draft will appear here</span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={handleGenerateDraft}
                            disabled={isDraftLoading}
                            className="flex-1 py-2.5 rounded-xl liquid-gradient text-white text-xs font-bold active:scale-95 transition-all aqua-glow disabled:opacity-60"
                          >
                            {isDraftLoading ? 'Generating...' : draftText ? 'Retry' : 'Generate'}
                          </button>
                          {draftText && (
                            <button
                              onClick={() => { setText(draftText); setIsDraftConfirmOpen(false); setDraftText(''); }}
                              className="flex-1 py-2.5 rounded-xl bg-secondary/10 text-secondary text-xs font-bold active:scale-95 transition-all border border-secondary/20"
                            >
                              Use Draft
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Typing indicator — shown near the input */}
                  {typingInThisChat.length > 0 && (
                    <div className="flex items-center gap-2 mb-1 pl-1">
                      <div className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[11px] font-semibold text-on-surface-variant">
                        {typingInThisChat.length === 1 ? `${typingInThisChat[0]} is typing...` : `${typingInThisChat.length} people are typing...`}
                      </span>
                    </div>
                  )}

                  {/* Smart reply bar — reference style */}
                  {smartReplies.length > 0 && chatMessages.length > 0 && !text && !hideSmartReplies && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-secondary bg-secondary/10 px-2 py-1.5 rounded-lg border border-secondary/20 shrink-0">
                        <Droplet className="w-3.5 h-3.5 fill-secondary" /> Lyn
                        <button onClick={() => setHideSmartReplies(true)} className="ml-1 hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      {smartReplies.map((reply, i) => (
                        <button
                          key={i}
                          onClick={() => setText(reply)}
                          className="shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full bg-surface-container backdrop-blur-md border border-outline-variant/30 text-on-surface font-semibold text-[13px] hover:bg-surface-container-high transition-colors active:scale-95"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                  <form onSubmit={handleSend} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAttachmentPickerOpen(!isAttachmentPickerOpen)}
                      className={`w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-md border transition-all active:scale-90 duration-200 ${isAttachmentPickerOpen
                        ? (chat.isSecret ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/10' : 'bg-secondary text-white border-secondary shadow-lg shadow-secondary/20')
                        : (chat.isSecret ? 'bg-black/60 border-slate-700/30 text-slate-400 hover:bg-slate-800/50 shadow-sm' : 'bg-white/60 border-white/40 text-on-surface-variant hover:bg-white shadow-sm')
                        }`}
                    >
                      <Plus className={`w-6 h-6 transition-transform duration-300 ${isAttachmentPickerOpen ? 'rotate-45' : ''}`} />
                    </button>

                    <div className="flex-1 relative flex items-center">
                      <textarea
                        value={text}
                        rows={1}
                        onChange={e => {
                          e.target.style.height = '48px';
                          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                          const val = e.target.value;
                          setText(val);
                          if (val.toLowerCase().includes('@lyn')) {
                            setIsAiMentionMenuOpen(true);
                          } else {
                            setIsAiMentionMenuOpen(false);
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                            e.currentTarget.style.height = '48px';
                          }
                        }}
                        placeholder={`Message ${chat.name}...`}
                        data-msg-input
                        className={`w-full min-h-[48px] py-3 pl-4 pr-10 rounded-2xl border outline-none transition-all resize-none ${chat.isSecret
                          ? 'bg-black border-slate-700/30 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 text-slate-200 placeholder:text-slate-600 font-sans custom-scrollbar'
                          : 'bg-white/70 backdrop-blur-2xl border-white/40 focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-on-surface placeholder:text-on-surface-variant/50 custom-scrollbar'
                          }`}
                      />
                      <div className="absolute right-2 flex items-center">
                        <button type="button" className={`p-1.5 transition-colors ${chat.isSecret ? 'text-slate-500 hover:text-slate-300' : 'text-on-surface-variant hover:text-secondary'}`}>
                          <Smile className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {text.trim() ? (
                      <button type="submit" className={`w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-90 duration-200 ${chat.isSecret
                        ? 'bg-blue-600 text-white shadow-[0_4px_16px_rgba(59,130,246,0.2)] hover:bg-blue-500'
                        : 'glass-sent text-white shadow-[0_4px_16px_rgba(0,87,189,0.2)]'
                        }`}>
                        <CheckCheck className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onMouseDown={() => setIsRecordingAudio(true)}
                        onTouchStart={() => setIsRecordingAudio(true)}
                        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-90 duration-200 ${chat.isSecret
                          ? 'bg-blue-600 text-white shadow-[0_4px_16px_rgba(59,130,246,0.2)] hover:bg-blue-500'
                          : 'glass-sent text-white shadow-[0_4px_16px_rgba(0,87,189,0.2)]'
                          }`}
                      >
                        <Mic className="w-5 h-5 fill-current" />
                      </button>
                    )}
                  </form>
                </div>
              )}

              <MediaAttachmentPicker
                isOpen={isAttachmentPickerOpen}
                onClose={() => setIsAttachmentPickerOpen(false)}
                onSelect={handleAttachmentSelect}
              />

              {/* Schedule Picker Mock */}
              <AnimatePresence>
                {showSchedulePicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-full right-0 mb-4 mr-4 p-4 bg-surface/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl z-50 w-64"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-on-surface">Schedule Message</h3>
                      <button onClick={() => setShowSchedulePicker(false)} className="text-on-surface-variant hover:bg-white/10 rounded-full p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <button onClick={handleScheduleMessage} className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-sm font-medium">Tomorrow at 9:00 AM</button>
                      <button onClick={handleScheduleMessage} className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-sm font-medium">This weekend</button>
                      <button onClick={handleScheduleMessage} className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-sm font-medium text-primary">Custom date & time...</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      <CameraUI
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {isGalleryOpen && (
        <MediaGallery
          items={galleryMedia}
          initialIndex={galleryInitialIndex}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}


      {isGroupInfoOpen && chat.isGroup && (
        <GroupInfoScreen
          chat={chat}
          onBack={() => setIsGroupInfoOpen(false)}
          onNavigate={onNavigate}
        />
      )}

      {isSecretInfoOpen && chat.isSecret && (
        <SecretChatInfoScreen
          chat={chat}
          onBack={() => setIsSecretInfoOpen(false)}
        />
      )}

      <ShareContactModal
        isOpen={isShareContactOpen}
        onClose={() => setIsShareContactOpen(false)}
        onShare={(contactId) => {
          const contact = contacts.find(c => c.id === contactId);
          if (contact && activeChatId) {
            sendMessage(activeChatId, '', {
              contact: { name: contact.name, phone: contact.phone || '+1 234 567 8900', avatar: contact.avatar }
            });
            addToast('Contact shared', 'success');
          }
        }}
      />

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e, 'file')}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
      />
      <input
        type="file"
        ref={imageInputRef}
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e, 'image')}
        accept="image/*"
      />

      <div className="fixed top-20 right-[-10%] w-[40%] h-[40%] bg-primary-container/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>
      <div className="fixed bottom-20 left-[-5%] w-[30%] h-[30%] bg-secondary-container/20 blur-[80px] rounded-full pointer-events-none -z-10"></div>

    </motion.div>
  );
}
