import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Video, Phone, MoreVertical, Plus, Smile, Mic, CheckCheck, Users, X, Clock, Lock, Search, Download, Trash2, Edit2, Share2, UserPlus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { auth } from '../config/firebase';
import { Message } from '../types';
import MediaAttachmentPicker from '../components/chat/MediaAttachmentPicker';
import AudioRecorderUI from '../components/chat/AudioRecorderUI';
import CameraUI from '../components/chat/CameraUI';
import MessageBubble from '../components/chat/MessageBubble';
import MediaGallery from '../components/chat/MediaGallery';
import CallScreen from '../components/chat/CallScreen';
import GroupInfoScreen from './GroupInfoScreen';
import SecretChatInfoScreen from './SecretChatInfoScreen';
import ShareContactModal from '../components/chat/ShareContactModal';

export default function ChatDetailScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate: (s: string) => void }) {
  const { messages, setMessages, sendMessage, editMessage, deleteMessage, currentUser, chats, activeChatId, addToast, setActiveChatId, setActiveContactId, contacts, globalUsers, followUser, typingUsers, setTyping, markAsRead } = useAppContext();
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
  
  const [callState, setCallState] = useState<{ isOpen: boolean, isVideo: boolean, isIncoming: boolean }>({ isOpen: false, isVideo: false, isIncoming: false });
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isSecretInfoOpen, setIsSecretInfoOpen] = useState(false);

  const chat = chats.find(c => c.id === activeChatId);
  const chatMessages = activeChatId ? (messages[activeChatId] || []) : [];

  if (!chat) return null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatMessages]);

  useEffect(() => {
    if (activeChatId) {
      markAsRead(activeChatId);
    }
  }, [activeChatId, chatMessages.length]);

  // Fetch messages if they don't exist for this chat
  useEffect(() => {
    if (activeChatId && (!messages[activeChatId] || messages[activeChatId].length === 0)) {
        const fetchHistory = async () => {
            try {
                const idToken = await (auth.currentUser ? auth.currentUser.getIdToken() : localStorage.getItem('mock_auth_token'));
                const res = await fetch(`http://localhost:5000/api/chats/${activeChatId}/messages`, {
                    headers: { 'Authorization': `Bearer ${idToken}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMessages(prev => ({ ...prev, [activeChatId]: data }));
                }
            } catch (e) {
                console.error("Failed to fetch history:", e);
            }
        };
        fetchHistory();
    }
  }, [activeChatId, messages, setMessages]);

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
      sendMessage(activeChatId, text, { replyToId: replyingTo?.id });
    }
    
    setText('');
    setReplyingTo(null);
    if (activeChatId) setTyping(activeChatId, false);

    // Force scroll to bottom
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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
    switch(type) {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === 'image') {
        sendMessage(activeChatId as string, '', { imageUrl: dataUrl, replyToId: replyingTo?.id });
        addToast('Photo sent', 'success');
      } else {
        sendMessage(activeChatId as string, '', { 
          document: { url: dataUrl, name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + ' MB' },
          replyToId: replyingTo?.id 
        });
        addToast('Document sent', 'success');
      }
      setReplyingTo(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAudioStop = (audioUrl?: string) => {
    setIsRecordingAudio(false);
    if (audioUrl && activeChatId) {
      sendMessage(activeChatId, '', { audioUrl, replyToId: replyingTo?.id });
      setReplyingTo(null);
      addToast('Voice message sent', 'success');
    }
  };

  const handleCameraCapture = (mediaUrl: string, type: 'photo' | 'video') => {
    if (activeChatId) {
      if (type === 'photo') {
        sendMessage(activeChatId, '', { imageUrl: mediaUrl, replyToId: replyingTo?.id });
      } else {
        sendMessage(activeChatId, '', { videoUrl: mediaUrl, replyToId: replyingTo?.id });
      }
      setReplyingTo(null);
      addToast(`${type === 'photo' ? 'Photo' : 'Video'} sent`, 'success');
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

  const startCall = (isVideo: boolean) => {
    setCallState({ isOpen: true, isVideo, isIncoming: false });
  };

  const handleDeleteChat = () => {
    addToast('Chat deleted', 'success');
    setActiveChatId(null);
  };

  const handleExportChat = () => {
    addToast('Chat exported as PDF', 'success');
    setShowHeaderMenu(false);
  };

  const filteredMessages = chatMessages.filter(m => 
    !searchQuery || m.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-aqua-depth min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-slate-50/70 backdrop-blur-xl border-b border-white/15 shadow-[0_8px_32px_0_rgba(0,87,189,0.06)] flex flex-col px-6 max-w-none">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-slate-500 hover:bg-white/20 p-2 rounded-full transition-colors active:scale-95 duration-200">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="relative cursor-pointer" onClick={() => {
              if (chat.isGroup) setIsGroupInfoOpen(true);
              else if (chat.isSecret) setIsSecretInfoOpen(true);
              else {
                setActiveContactId(chat.id);
                onNavigate('contact-profile');
              }
            }}>
              {chat.isGroup ? (
                 <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-surface-container-highest flex items-center justify-center text-primary overflow-hidden">
                   <Users className="w-6 h-6 fill-primary/20" />
                 </div>
              ) : (
                <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-secondary-fixed border-2 border-white rounded-full shadow-[0_0_8px_#0bfbff]"></div>
            </div>
            <div className="flex flex-col cursor-pointer" onClick={() => {
              if (chat.isGroup) setIsGroupInfoOpen(true);
              else if (chat.isSecret) setIsSecretInfoOpen(true);
              else {
                const targetId = chat.participantIds?.find(id => id !== currentUser?.id) || chat.id;
                setActiveContactId(targetId);
                onNavigate('contact-profile');
              }
            }}>
              <span className="font-headline tracking-tight font-bold text-lg text-on-surface leading-tight flex items-center gap-1">
                {chat.isSecret && <Lock className="w-4 h-4 text-green-500" />}
                {chat.name}
              </span>
              <span className="text-[11px] font-medium text-secondary-fixed-variant tracking-wide">
                {chat.isSecret ? 'secret chat' : 'online now'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            <button onClick={() => startCall(true)} className="text-cyan-600 hover:bg-white/20 p-2 rounded-full transition-colors active:scale-95 duration-200">
              <Video className="w-5 h-5 fill-cyan-600" />
            </button>
            <button onClick={() => startCall(false)} className="text-cyan-600 hover:bg-white/20 p-2 rounded-full transition-colors active:scale-95 duration-200">
              <Phone className="w-5 h-5 fill-cyan-600" />
            </button>
            <button onClick={() => setShowHeaderMenu(!showHeaderMenu)} className="text-cyan-600 hover:bg-white/20 p-2 rounded-full transition-colors active:scale-95 duration-200">
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
                    className="absolute right-0 top-full mt-2 w-48 glass-card rounded-2xl p-2 shadow-xl border border-white/20 z-50 flex flex-col gap-1"
                  >
                    <button onClick={() => { setIsSearchOpen(!isSearchOpen); setShowHeaderMenu(false); }} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-sm font-medium text-on-surface transition-colors">
                      <Search className="w-4 h-4" /> Search
                    </button>
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
      </header>

      <main ref={scrollRef} className={`flex-1 ${isSearchOpen ? 'pt-28' : 'pt-20'} pb-28 px-4 md:px-8 max-w-4xl mx-auto w-full flex flex-col overflow-y-auto`}>
        <div className="flex-1 min-h-[20px]"></div>
        <div className="flex justify-center my-8">
          <span className="bg-surface-container-low px-4 py-1 rounded-full text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest border border-white/40">Today, Oct 24</span>
        </div>
        
        <div className="space-y-6 flex flex-col justify-end">
          {filteredMessages.map((msg, i) => (
            <MessageBubble 
              key={msg.id} 
              msg={msg} 
              isMe={msg.senderId === currentUser?.id} 
              onReply={setReplyingTo}
              onEdit={handleEdit}
              replyMessage={msg.replyToId ? chatMessages.find(m => m.id === msg.replyToId) : undefined}
              onMediaClick={handleMediaClick}
              isSecret={chat.isSecret}
            />
          ))}
          <div ref={bottomRef} className="h-4 w-full" />

          {typingInThisChat.length > 0 && (
            <div className="flex items-center gap-2 text-on-surface-variant text-sm p-4 animate-pulse">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="font-medium">
                {typingInThisChat.length === 1 
                  ? `${typingInThisChat[0]} is typing...` 
                  : `${typingInThisChat.length} people are typing...`}
              </span>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-background via-background/90 to-transparent z-50">
        <div className="max-w-4xl mx-auto w-full relative">
          {isPrivateRestricted ? (
            <div className="flex flex-col items-center gap-3 py-4 glass-card border border-white/40 rounded-[2rem] shadow-xl">
              <div className="flex items-center gap-2 text-on-surface-variant text-sm font-medium">
                <Lock className="w-4 h-4" />
                <span>This account is private</span>
              </div>
              {isRequested ? (
                <button 
                  className="w-full max-w-xs py-3 rounded-2xl bg-surface-container text-on-surface-variant font-bold border border-white/40 flex items-center justify-center gap-2 cursor-default"
                >
                  <Clock className="w-5 h-5" />
                  Follow Request Pending
                </button>
              ) : (
                <button 
                  onClick={() => followUser(targetUser!.id)}
                  className="w-full max-w-xs py-3 rounded-2xl liquid-gradient text-white font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  Follow to Message
                </button>
              )}
              <p className="text-[10px] text-on-surface-variant/60 text-center px-4">
                You need to be a follower to send messages to this private account.
              </p>
            </div>
          ) : (
            <>
              <AnimatePresence>
            {editingMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-full left-0 right-0 mb-4 mx-4 p-3 bg-surface/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg flex items-center justify-between"
              >
                <div className="flex-1 min-w-0 border-l-4 border-primary pl-3">
                  <p className="text-xs font-bold text-primary mb-1 flex items-center gap-1"><Edit2 className="w-3 h-3" /> Edit Message</p>
                  <p className="text-sm text-on-surface truncate">{editingMessage.text}</p>
                </div>
                <button onClick={() => { setEditingMessage(null); setText(''); }} className="p-2 hover:bg-white/10 rounded-full transition-colors text-on-surface-variant">
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}
            {replyingTo && !editingMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-full left-0 right-0 mb-4 mx-4 p-3 bg-surface/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg flex items-center justify-between"
              >
                <div className="flex-1 min-w-0 border-l-4 border-secondary pl-3">
                  <p className="text-xs font-bold text-secondary mb-1">Replying to {replyingTo.senderId === currentUser?.id ? 'yourself' : 'message'}</p>
                  <p className="text-sm text-on-surface truncate">{replyingTo.text || 'Attachment'}</p>
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
            <form onSubmit={handleSend} className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => setIsAttachmentPickerOpen(!isAttachmentPickerOpen)}
                className={`w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-md border transition-all active:scale-90 duration-200 ${
                  isAttachmentPickerOpen 
                    ? 'bg-secondary text-white border-secondary shadow-lg shadow-secondary/20' 
                    : 'bg-white/60 border-white/40 text-on-surface-variant hover:bg-white shadow-sm'
                }`}
              >
                <Plus className={`w-6 h-6 transition-transform duration-300 ${isAttachmentPickerOpen ? 'rotate-45' : ''}`} />
              </button>
              
              <div className="flex-1 relative flex items-center">
                <input 
                  type="text" 
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={`Message ${chat.name}...`} 
                  className="w-full h-12 pl-4 pr-20 rounded-full bg-white/70 backdrop-blur-2xl border border-white/40 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none text-on-surface transition-all placeholder:text-on-surface-variant/50" 
                />
                <div className="absolute right-2 flex items-center">
                  <button type="button" className="text-on-surface-variant hover:text-secondary p-1.5 transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {text.trim() ? (
                <button type="submit" className="w-12 h-12 flex items-center justify-center rounded-full glass-sent text-white shadow-[0_4px_16px_rgba(0,87,189,0.2)] transition-all active:scale-90 duration-200">
                  <CheckCheck className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  type="button"
                  onMouseDown={() => setIsRecordingAudio(true)}
                  onTouchStart={() => setIsRecordingAudio(true)}
                  className="w-12 h-12 flex items-center justify-center rounded-full glass-sent text-white shadow-[0_4px_16px_rgba(0,87,189,0.2)] transition-all active:scale-90 duration-200"
                >
                  <Mic className="w-5 h-5 fill-white" />
                </button>
              )}
            </form>
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

      {callState.isOpen && (
        <CallScreen
          callerName={chat.name}
          callerAvatar={chat.avatar}
          isVideo={callState.isVideo}
          isIncoming={callState.isIncoming}
          onAccept={() => {}}
          onDecline={() => setCallState({ ...callState, isOpen: false })}
          onEnd={() => setCallState({ ...callState, isOpen: false })}
        />
      )}

      {isGroupInfoOpen && chat.isGroup && (
        <GroupInfoScreen
          chat={chat}
          onBack={() => setIsGroupInfoOpen(false)}
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
