import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Heart, Share2, MoreHorizontal, MessageCircle, Star, Trash2, VolumeX } from 'lucide-react';
import { useAppContext, Story } from '../context/AppContext';

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export default function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const { addStoryComment, currentUser, addToast, setStories, chats, startChatWithContact, sendMessage } = useAppContext();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSendMenuOpen, setIsSendMenuOpen] = useState(false);

  const currentStory = stories[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  const handleSendReply = () => {
    if (currentStory && replyText.trim()) {
      addStoryComment(currentStory.id, replyText);
      
      if (currentStory.userId !== currentUser?.id) {
        const existingChat = chats.find(c => !c.isGroup && c.participantIds?.includes(currentStory.userId));
        if (existingChat) {
          sendMessage(existingChat.id, replyText, {
            imageUrl: currentStory.mediaType === 'image' ? currentStory.mediaUrl : undefined,
            videoUrl: currentStory.mediaType === 'video' ? currentStory.mediaUrl : undefined
          });
        }
      }
      
      setReplyText('');
      addToast('Reply sent', 'success');
    }
  };

  const handleSendReaction = (emoji: string) => {
    if (currentStory) {
      addStoryComment(currentStory.id, emoji);
      
      if (currentStory.userId !== currentUser?.id) {
        const existingChat = chats.find(c => !c.isGroup && c.participantIds?.includes(currentStory.userId));
        if (existingChat) {
          sendMessage(existingChat.id, emoji, {
            imageUrl: currentStory.mediaType === 'image' ? currentStory.mediaUrl : undefined,
            videoUrl: currentStory.mediaType === 'video' ? currentStory.mediaUrl : undefined
          });
        }
      }
      addToast(`Sent ${emoji}`, 'success');
    }
  };

  const handleDeleteStory = () => {
    if (!currentStory) return;
    setStories(prev => prev.filter(s => s.id !== currentStory.id));
    addToast('Story deleted', 'info');
    setIsMenuOpen(false);
    if (stories.length <= 1) {
      onClose();
    } else {
      handleNext();
    }
  };

  const handleAddToHighlights = () => {
    addToast('Added to highlights', 'success');
    setIsMenuOpen(false);
  };

  const handleShare = () => {
    addToast('Link copied to clipboard', 'success');
    setIsMenuOpen(false);
  };

  const handleSendToChat = (chatId: string) => {
    if (currentStory) {
      const options: any = {};
      if (currentStory.mediaType === 'image') {
        options.imageUrl = currentStory.mediaUrl;
      } else if (currentStory.mediaType === 'video') {
        options.videoUrl = currentStory.mediaUrl;
      }
      sendMessage(chatId, `Shared a story from ${currentStory.userName}`, options);
      addToast('Story sent to chat', 'success');
    }
    setIsSendMenuOpen(false);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (isPaused || isMenuOpen || isSendMenuOpen) return;

    const duration = 5000; // 5 seconds per story
    const interval = 50; 
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev + step >= 100) {
          clearInterval(timer);
          handleNext();
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, isMenuOpen, isSendMenuOpen, handleNext]);

  if (!currentStory) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-[1000] bg-black text-white flex flex-col items-center justify-center"
      >
        <div className="relative w-full max-w-lg h-full md:h-[90vh] md:rounded-[3rem] overflow-hidden bg-neutral-900 shadow-2xl flex flex-col">
          {/* Progress Bars */}
          <div className="absolute top-4 left-4 right-4 z-20 flex gap-1.5">
            {stories.map((story, index) => (
              <div key={story.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-50 ease-linear"
                  style={{
                    width: `${index < currentIndex ? 100 : index === currentIndex ? progress : 0}%`
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-6 right-6 z-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-white p-0.5">
                <img src={currentStory.userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-white drop-shadow-md">{currentStory.userName}</span>
                <span className="text-[10px] font-bold text-white/60">{currentStory.timestamp}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white drop-shadow-md"><MoreHorizontal /></button>
                <AnimatePresence>
                  {isMenuOpen && (
                    <>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-2xl p-2 shadow-xl border border-white/10 z-50 flex flex-col gap-1"
                      >
                        {currentStory.userId === currentUser?.id && (
                          <button onClick={handleAddToHighlights} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl text-sm font-medium text-on-surface transition-colors">
                            <Star className="w-4 h-4" /> Add to Highlights
                          </button>
                        )}
                        <button onClick={handleShare} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl text-sm font-medium text-on-surface transition-colors">
                          <Share2 className="w-4 h-4" /> Share
                        </button>
                        <button onClick={() => { setIsMenuOpen(false); setIsSendMenuOpen(true); }} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl text-sm font-medium text-on-surface transition-colors">
                          <Send className="w-4 h-4" /> Send to Chat
                        </button>
                        {currentStory.userId === currentUser?.id ? (
                          <button onClick={handleDeleteStory} className="flex items-center gap-3 px-3 py-2 hover:bg-red-500/10 text-red-500 rounded-xl text-sm font-medium transition-colors">
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        ) : (
                          <button onClick={() => { addToast('Story muted', 'info'); setIsMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 hover:bg-red-500/10 text-red-500 rounded-xl text-sm font-medium transition-colors">
                            <VolumeX className="w-4 h-4" /> Mute Story
                          </button>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={onClose} className="text-white drop-shadow-md"><X /></button>
            </div>
          </div>

          {/* Content */}
          <div 
            className="flex-1 relative group"
            onPointerDown={() => setIsPaused(true)}
            onPointerUp={() => setIsPaused(false)}
            onPointerLeave={() => setIsPaused(false)}
          >
            {currentStory.mediaType === 'image' ? (
              <img
                src={currentStory.mediaUrl}
                alt="Story"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <video
                src={currentStory.mediaUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                loop
              />
            )}

            {/* Tap Zones */}
            <div className="absolute inset-0 flex">
              <div className="w-1/3 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
              <div className="w-2/3 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNext(); }} />
            </div>
          </div>

          {/* Footer / Interaction */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <input 
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => setIsPaused(false)}
                  placeholder="Send message..."
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 text-white text-sm outline-none focus:bg-white/20 transition-all"
                />
                <button 
                  onClick={handleSendReply}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <button onClick={() => handleSendReaction('❤️')} className="text-white active:scale-125 transition-transform"><Heart className="w-6 h-6" /></button>
            </div>

            {/* Quick Reactions */}
            <div className="flex justify-between px-2">
              {['🔥', '😂', '😮', '😢', '😍', '👏'].map(emoji => (
                <button 
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="text-2xl hover:scale-125 transition-transform active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Send to Chat Overlay */}
        <AnimatePresence>
          {isSendMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="absolute inset-x-0 bottom-0 bg-surface rounded-t-[2rem] p-6 z-50 flex flex-col h-[60vh]"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-on-surface">Send to...</h3>
                <button onClick={() => setIsSendMenuOpen(false)} className="p-2 text-on-surface-variant hover:bg-white/10 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {chats.filter(c => !c.isGroup && !c.id.startsWith('bot')).map(chat => (
                  <button 
                    key={chat.id} 
                    onClick={() => handleSendToChat(chat.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover" />
                    <span className="font-medium text-on-surface">{chat.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </AnimatePresence>
  );
}
