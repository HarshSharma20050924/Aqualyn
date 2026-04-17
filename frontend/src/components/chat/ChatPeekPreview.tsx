import React from 'react';
import { motion } from 'motion/react';
import { Message, Chat } from '../../types';
import { CheckCheck, Lock, Pin, BellOff, Trash2, Archive, Maximize2, X } from 'lucide-react';

interface ChatPeekPreviewProps {
  chat: Chat;
  messages: Message[];
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
  messages,
  onClose,
  onOpenChat,
  onArchive,
  onPin,
  onMute,
  onDelete,
  currentUser,
}) => {
  const recentMessages = messages.slice(-10); // Show more for scrollability

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/40 backdrop-blur-md"
      onClick={onClose} // Clicking backdrop closes without seen
    >
      <motion.div
        layoutId={`chat-${chat.id}`}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-sm glass-card rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 flex flex-col"
        style={{ maxHeight: '70vh' }}
        onClick={(e) => e.stopPropagation()} // Prevent content clicks from closing
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md">
              <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface flex items-center gap-1">
                {chat.isSecret && <Lock className="w-3 h-3 text-green-500" />}
                {chat.name}
              </h3>
              <p className="text-[10px] text-on-surface-variant font-medium">
                {chat.isGroup ? 'Group Chat' : 'Personal Chat'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onOpenChat}
              className="p-2.5 bg-secondary text-white rounded-xl shadow-lg shadow-secondary/20 hover:brightness-110 transition-all active:scale-95"
            >
              <Maximize2 className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={onClose}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors active:scale-90"
            >
              <X className="w-5 h-5 text-on-surface" />
            </button>
          </div>
        </div>

        {/* Messages Preview */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide bg-aqua-depth/30 pb-6">
          {recentMessages.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-on-surface-variant text-sm italic gap-2 opacity-50">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center">?</div>
              No messages yet
            </div>
          ) : (
            recentMessages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs font-medium ${
                    isMe 
                      ? 'glass-sent text-white rounded-tr-none' 
                      : 'glass-received text-on-surface rounded-tl-none border border-white/5'
                  }`}>
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-1">
                    <span className="text-[9px] text-on-surface-variant">{msg.timestamp}</span>
                    {isMe && (
                      <div className="flex items-center">
                        {msg.status === 'sent' ? (
                          <CheckCheck className="w-[10px] h-[10px] text-on-surface-variant/40" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                        ) : msg.status === 'delivered' ? (
                          <CheckCheck className="w-[10px] h-[10px] text-on-surface-variant/40" />
                        ) : (
                          <CheckCheck className="w-[10px] h-[10px] text-secondary" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-3 bg-white/5 border-t border-white/10 grid grid-cols-4 gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onPin(); }}
            className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-2xl transition-colors"
          >
            <Pin className={`w-4.5 h-4.5 ${chat.isPinned ? 'text-secondary fill-secondary' : 'text-on-surface-variant'}`} />
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-tighter">Pin</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onMute(); }}
            className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-2xl transition-colors"
          >
            <BellOff className={`w-4.5 h-4.5 ${chat.isMuted ? 'text-secondary fill-secondary' : 'text-on-surface-variant'}`} />
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-tighter">Mute</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onArchive(); }}
            className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-2xl transition-colors"
          >
            <Archive className="w-4.5 h-4.5 text-on-surface-variant" />
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-tighter">Archive</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-2xl transition-colors"
          >
            <Trash2 className="w-4.5 h-4.5 text-red-500" />
            <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">Delete</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
