import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Send, Copy, Share2, Globe, Lock, Check,
  Smile, MoreVertical, LogIn, X, Trash2
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { RoomRequest, GuestUser } from '../types';
import { API_BASE_URL } from '../config/api';
import WaitingRoomPanel from '../components/chat/WaitingRoomPanel';

interface AnonMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

interface AnonymousChatroomScreenProps {
  roomToken: string;
  isPrivate: boolean;
  roomName?: string;
  guestUser: GuestUser;
  isHost: boolean;
  onBack: () => void;
  onSignIn: () => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function AnonymousChatroomScreen({
  roomToken, isPrivate, roomName, guestUser, isHost, onBack, onSignIn
}: AnonymousChatroomScreenProps) {
  const [messages, setMessages] = useState<AnonMessage[]>([]);
  const [text, setText] = useState('');
  const [participants, setParticipants] = useState<Array<{guestId: string; guestName: string}>>([
    { guestId: guestUser.guestId, guestName: guestUser.displayName }
  ]);
  const [requests, setRequests] = useState<RoomRequest[]>([]);
  // null = can chat, 'waiting' = pending approval, 'denied' = rejected
  const [joinState, setJoinState] = useState<null | 'waiting' | 'denied'>(() => {
    if (isHost) return null;
    try {
      const stored = localStorage.getItem('anon_rooms');
      if (stored) {
        const existing = JSON.parse(stored);
        if (existing.some((r: any) => r.token === roomToken)) return null;
      }
    } catch (e) {}
    return isPrivate ? 'waiting' : null;
  });
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSignInBanner, setShowSignInBanner] = useState(true);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  
  // New features state
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [contextMenuMsgId, setContextMenuMsgId] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef(false);

  // Load messages from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(`anon_msgs_${roomToken}`);
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch (e) {}
    }
  }, [roomToken]);

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(`anon_msgs_${roomToken}`, JSON.stringify(messages));
    }
  }, [messages, roomToken]);

  const displayName = roomName || (isPrivate ? 'Private Room' : 'Public Room');

  // Save to anon_rooms in localStorage for the Chat List
  useEffect(() => {
    if (joinState === null) {
      try {
        const existingRaw = localStorage.getItem('anon_rooms');
        const existing: any[] = existingRaw ? JSON.parse(existingRaw) : [];
        const index = existing.findIndex((r: any) => r.token === roomToken);
        const roomData = {
          token: roomToken,
          isPrivate,
          roomName: displayName,
          joinedAt: new Date().toISOString(),
          lastMessage: messages.length > 0 ? messages[messages.length - 1].text : 'Joined room',
          isHost
        };
        if (index >= 0) {
          existing[index] = { ...existing[index], ...roomData };
        } else {
          existing.unshift(roomData);
        }
        localStorage.setItem('anon_rooms', JSON.stringify(existing));
      } catch (e) {}
    }
  }, [joinState, messages, roomToken, isPrivate, displayName]);
  const urlToken = isPrivate ? `prv-${roomToken}` : roomToken;
  const roomUrl = `${window.location.origin}${window.location.pathname}#/room/${urlToken}`;

  const addSystemMsg = (msgText: string) => {
    setMessages(prev => [...prev, {
      id: `sys-${Date.now()}-${Math.random()}`,
      senderId: 'system',
      senderName: 'System',
      text: msgText,
      timestamp: new Date().toISOString(),
      isSystem: true,
    }]);
  };

  // Connect Socket.io and join anonymous room
  useEffect(() => {
    const socket = io(API_BASE_URL, {
      withCredentials: false,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (joinedRef.current) return;
      joinedRef.current = true;
      socket.emit('join_anon_room', {
        token: roomToken,
        guestId: guestUser.guestId,
        guestName: guestUser.displayName,
        isHost,
      });
      if (isHost) {
        socket.emit('anon_room_set_private', { token: roomToken, isPrivate });
        addSystemMsg(
          isPrivate
            ? 'Welcome! You created a private room. Copy the link to invite — joiners must be approved by you.'
            : 'Welcome! You created a public room. Copy the link to invite — anyone can join instantly.'
        );
      }
    });

    // Public room join confirmed OR accepted into private
    socket.on('anon_room_joined', () => {
      setJoinState(null);
      if (!isHost) addSystemMsg(`You joined ${displayName}. Say hello!`);
    });

    // Waiting for host approval
    socket.on('anon_room_waiting', () => {
      setJoinState('waiting');
    });

    // Host denied
    socket.on('anon_room_denied', () => {
      setJoinState('denied');
    });

    // Host receives a join request
    socket.on('anon_room_request', (req: any) => {
      setRequests(prev => {
        if (prev.find(r => r.id === req.id)) return prev;
        return [...prev, { ...req, status: 'pending' } as RoomRequest];
      });
    });

    // Someone joined (for all room members)
    socket.on('anon_room_participant_joined', (p: { guestId: string; guestName: string }) => {
      setParticipants(prev => {
        if (prev.find(x => x.guestId === p.guestId)) return prev;
        return [...prev, p];
      });
      addSystemMsg(`${p.guestName} joined the room.`);
    });

    // Incoming message from others
    socket.on('anon_room_message', (msg: AnonMessage) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Typing indicators
    socket.on('anon_room_user_typing', (data: { guestName: string, isTyping: boolean }) => {
      setTypingUsers(prev => {
        if (data.isTyping && !prev.includes(data.guestName)) return [...prev, data.guestName];
        if (!data.isTyping) return prev.filter(n => n !== data.guestName);
        return prev;
      });
    });

    // Message deletion
    socket.on('anon_room_message_deleted', (data: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
    });

    socket.on('disconnect', () => { joinedRef.current = false; });

    return () => { socket.disconnect(); };
  }, [roomToken, isHost, isPrivate]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAccept = (requestId: string, reqGuestId: string) => {
    socketRef.current?.emit('anon_room_respond', { token: roomToken, requestId, action: 'accept' });
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'accepted' } : r));
  };

  const handleDeny = (requestId: string) => {
    socketRef.current?.emit('anon_room_respond', { token: roomToken, requestId, action: 'deny' });
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'denied' } : r));
  };

  const sendMsg = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || joinState !== null) return;
    const msg: AnonMessage = {
      id: `msg-${guestUser.guestId}-${Date.now()}`,
      senderId: guestUser.guestId,
      senderName: guestUser.displayName,
      text: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
    setText('');
    inputRef.current?.focus();
    socketRef.current?.emit('anon_room_message', { token: roomToken, message: msg });
    
    // Stop typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit('anon_room_stop_typing', { token: roomToken, guestName: guestUser.displayName });
  }, [text, guestUser, roomToken, joinState]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (joinState !== null) return;
    
    // Emit typing
    socketRef.current?.emit('anon_room_typing', { token: roomToken, guestName: guestUser.displayName });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('anon_room_stop_typing', { token: roomToken, guestName: guestUser.displayName });
    }, 2000);
  };

  const handleDeleteForMe = (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setContextMenuMsgId(null);
  };

  const handleDeleteForEveryone = (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    socketRef.current?.emit('anon_room_delete_message', { token: roomToken, messageId: msgId });
    setContextMenuMsgId(null);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (navigator.share) await navigator.share({ title: `Join ${displayName} on Aqualyn`, url: roomUrl }).catch(() => {});
    else handleCopy();
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col h-screen w-full bg-surface overflow-hidden relative"
    >
      <div className="absolute top-0 left-0 w-full h-[28%] bg-gradient-to-b from-secondary/8 to-transparent pointer-events-none z-0" />

      {/* HEADER */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-3 glass-card border-b border-white/20 shadow-sm">
        <button onClick={onBack} className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isPrivate ? 'bg-violet-100' : 'bg-emerald-100'}`}>
          {isPrivate ? <Lock className="w-5 h-5 text-violet-600" /> : <Globe className="w-5 h-5 text-emerald-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-headline font-bold text-on-surface text-sm truncate">{displayName}</p>
          <p className="text-[11px] text-on-surface-variant">{participants.length} {participants.length === 1 ? 'person' : 'people'}</p>
        </div>

        {/* Copy Link */}
        <motion.button
          onClick={handleCopy}
          whileTap={{ scale: 0.9 }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            copied ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary/10 hover:bg-secondary/20 text-secondary'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </motion.button>

        <button onClick={() => setShowMenu(!showMenu)}
          className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors relative">
          <MoreVertical className="w-4 h-4 text-on-surface-variant" />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-14 right-4 z-50 glass-card border border-white/30 rounded-2xl shadow-xl p-2 min-w-[150px]"
            >
              {[
                { icon: Share2, label: 'Share Link', action: handleShare },
                { icon: Copy, label: 'Copy Link', action: handleCopy },
                { icon: LogIn, label: 'Sign In', action: onSignIn },
              ].map(({ icon: Icon, label, action }) => (
                <button key={label} onClick={() => { action(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/30 transition-colors text-sm text-on-surface font-medium">
                  <Icon className="w-4 h-4 text-on-surface-variant" /> {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Host waiting room panel */}
      <AnimatePresence>
        {isHost && isPrivate && (
          <WaitingRoomPanel requests={requests} onAccept={handleAccept} onDeny={handleDeny} />
        )}
      </AnimatePresence>

      {/* Joiner overlays */}
      <AnimatePresence>
        {joinState === 'waiting' && (
          <motion.div key="waiting-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-surface/85 backdrop-blur-sm px-6"
          >
            <div className="glass-card border border-violet-300/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="relative mx-auto mb-5 w-16 h-16">
                <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-violet-500" />
                </div>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-violet-400/50" />
              </div>
              <h3 className="font-headline font-bold text-on-surface text-lg mb-2">Waiting for approval</h3>
              <p className="text-sm text-on-surface-variant mb-5">The host needs to accept your request to join this private room.</p>
              <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant">
                <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-amber-400" />
                Waiting…
              </div>
            </div>
          </motion.div>
        )}

        {joinState === 'denied' && (
          <motion.div key="denied-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-surface/85 backdrop-blur-sm px-6"
          >
            <div className="glass-card border border-red-300/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-headline font-bold text-on-surface text-lg mb-2">Request Declined</h3>
              <p className="text-sm text-on-surface-variant mb-5">The host declined your request to join.</p>
              <button onClick={onBack} className="w-full h-12 bg-gradient-to-br from-secondary to-primary text-white font-bold rounded-2xl">Go Back</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative z-0">
        {messages.length === 0 && joinState === null && (
          <div className="flex justify-center pt-8">
            <p className="text-xs text-on-surface-variant/60 text-center">
              {isHost ? 'Share the link to invite people.' : 'Be the first to say hello!'}
            </p>
          </div>
        )}
        {messages.map((msg) => {
          if (msg.isSystem) return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
              <div className="px-4 py-1.5 bg-black/5 dark:bg-white/10 rounded-full text-xs text-on-surface-variant max-w-xs text-center">{msg.text}</div>
            </motion.div>
          );
          const isOwn = msg.senderId === guestUser.guestId;
          return (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 10, x: isOwn ? 20 : -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-2`}
            >
              {!isOwn && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-secondary/60 to-primary/60 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mb-1">
                  {msg.senderName.slice(-1)}
                </div>
              )}
              <div 
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%] cursor-pointer relative`}
                onClick={() => setContextMenuMsgId(contextMenuMsgId === msg.id ? null : msg.id)}
              >
                {!isOwn && <span className="text-[10px] text-on-surface-variant mb-1 ml-1">{msg.senderName}</span>}
                <div className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-transform ${contextMenuMsgId === msg.id ? 'scale-95' : ''} ${
                  isOwn
                    ? 'bg-gradient-to-br from-secondary to-primary text-white rounded-br-md'
                    : 'glass-card bg-white/60 border border-white/40 text-on-surface rounded-bl-md'
                }`}>
                  {isOwn && <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50 pointer-events-none" />}
                  {msg.text}
                </div>
                <span className="text-[9px] text-on-surface-variant mt-1 mx-1">{formatTime(msg.timestamp)}</span>

                {/* Context Menu for Delete */}
                <AnimatePresence>
                  {contextMenuMsgId === msg.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className={`absolute top-10 z-20 glass-card border border-white/30 rounded-2xl shadow-xl p-1.5 w-48 ${isOwn ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`}
                    >
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteForMe(msg.id); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/30 transition-colors text-sm text-on-surface">
                        <Trash2 className="w-4 h-4 text-on-surface-variant" /> Delete for me
                      </button>
                      {isOwn && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteForEveryone(msg.id); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors text-sm mt-1">
                          <Trash2 className="w-4 h-4" /> Delete for everyone
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
        
        {/* Typing indicator bubbles */}
        {typingUsers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mb-1" />
            <div className="flex flex-col items-start max-w-[75%]">
              <span className="text-[10px] text-on-surface-variant mb-1 ml-1">
                {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.length} people are typing...`}
              </span>
              <div className="px-4 py-3 rounded-2xl glass-card bg-white/40 border border-white/30 rounded-bl-md flex items-center gap-1">
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/60" />
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/60" />
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/60" />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={bottomRef} />
      </div>

      {/* Sign-in banner */}
      <AnimatePresence>
        {showSignInBanner && (
          <motion.div key="signin-banner" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-4 mb-2 px-4 py-2.5 bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20 rounded-2xl flex items-center gap-3">
              <span className="text-xs text-on-surface flex-1">Sign in to keep your chats & identity</span>
              <button onClick={onSignIn} className="text-xs font-bold text-secondary flex-shrink-0">Sign In →</button>
              <button onClick={() => setShowSignInBanner(false)}><X className="w-3.5 h-3.5 text-on-surface-variant" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="px-4 pb-4 pt-2 relative z-10">
        <div className={`flex items-end gap-2 p-2 glass-card border rounded-3xl shadow-sm transition-all ${
          joinState !== null ? 'opacity-40 pointer-events-none border-white/20' : 'border-white/30'
        }`}>
          <button onClick={() => setShowEmojiBar(!showEmojiBar)}
            className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0">
            <Smile className="w-[18px] h-[18px] text-on-surface-variant" />
          </button>
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
            placeholder={joinState === null ? 'Message…' : 'Waiting for approval…'}
            rows={1}
            disabled={joinState !== null}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50 max-h-24 py-2 font-body leading-relaxed"
          />
          <motion.button
            onClick={sendMsg}
            disabled={!text.trim() || joinState !== null}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-md disabled:opacity-40 flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>

        <AnimatePresence>
          {showEmojiBar && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 mt-2 px-2">
              {QUICK_EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => { setText(prev => prev + emoji); setShowEmojiBar(false); inputRef.current?.focus(); }}
                  className="text-xl hover:scale-125 transition-transform">{emoji}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-1.5 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          <span className="text-[10px] text-on-surface-variant">
            Chatting as <span className="font-semibold text-secondary">{guestUser.displayName}</span> (anonymous)
          </span>
        </div>
      </div>
    </motion.div>
  );
}
