import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Post } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface PostCardProps {
  post: Post;
  onViewPost: (post: Post) => void;
}

export default function PostCard({ post, onViewPost }: PostCardProps) {
  const { currentUser, likePost, savePost, addToast } = useAppContext();
  const [isLiked, setIsLiked] = useState(post.likes.includes(currentUser?.id || ''));
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [isSaved, setIsSaved] = useState(currentUser?.savedPostIds?.includes(post.id) || false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [lastTap, setLastTap] = useState(0);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    likePost(post.id);
    if (isLiked) {
      setLikesCount(prev => prev - 1);
    } else {
      setLikesCount(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    savePost(post.id);
    setIsSaved(!isSaved);
    addToast(isSaved ? 'Removed from saved' : 'Post saved', 'success');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.userName}`,
        text: post.caption,
        url: window.location.href,
      }).catch(() => {});
    } else {
      addToast('Sharing not supported on this browser', 'info');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white/40 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-500 mb-8"
    >
      {/* Post Header */}
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewPost(post)}>
          <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-cyan-500 to-blue-600">
            <img 
              src={post.userAvatar || `https://ui-avatars.com/api/?name=${post.userName}&background=random`} 
              alt={post.userName} 
              className="w-full h-full rounded-full border-2 border-white dark:border-slate-900 object-cover"
            />
          </div>
          <div>
            <h4 className="font-headline font-bold text-on-surface text-sm">{post.userName}</h4>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold opacity-60">{post.timestamp}</p>
          </div>
        </div>
        <button className="p-2 text-on-surface-variant hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Post Media */}
        <div 
          className="relative aspect-square md:aspect-video bg-surface-container overflow-hidden group cursor-pointer"
          onClick={(e) => {
            const now = Date.now();
            if (now - lastTap < 300) {
              // Double Tap detected
              if (!isLiked) handleLike(e);
              setShowHeartOverlay(true);
              setTimeout(() => setShowHeartOverlay(false), 1000);
            } else {
              setLastTap(now);
              // Single tap opens viewer after short delay if no second tap
              setTimeout(() => {
                if (Date.now() - lastTap >= 300) {
                   onViewPost(post);
                }
              }, 310);
            }
          }}
        >
          {post.mediaType === 'video' || post.videoUrl ? (
            <>
              <video 
                src={post.videoUrl || post.mediaUrl} 
                autoPlay={isPlaying}
                loop 
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                  className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </>
          ) : (
            <img 
              src={post.imageUrl || post.mediaUrl || `https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800&h=800&sig=${post.id}`} 
              alt="Post content" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
          )}
          
          <AnimatePresence>
            {showHeartOverlay && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.5 }}
                exit={{ opacity: 0, scale: 2 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      {/* Interactions */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all active:scale-90 ${isLiked ? 'bg-red-500/10 text-red-500' : 'bg-surface-container/30 text-on-surface-variant hover:bg-surface-container/50'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
              <span className="text-xs font-black">{likesCount}</span>
            </button>
            <button 
              onClick={() => onViewPost(post)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-container/30 text-on-surface-variant hover:bg-surface-container/50 transition-all active:scale-90"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-black">{post.comments.length}</span>
            </button>
            <button 
              onClick={handleShare}
              className="p-2 text-on-surface-variant hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={handleSave}
            className={`p-2.5 rounded-full transition-all active:scale-90 ${isSaved ? 'text-blue-500 bg-blue-500/10' : 'text-on-surface-variant bg-surface-container/30 hover:bg-surface-container/50'}`}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-blue-500' : ''}`} />
          </button>
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <p className="text-on-surface text-sm leading-relaxed">
            <span className="font-bold mr-2">{post.userName}</span>
            {post.caption || post.text}
          </p>
          {post.comments.length > 0 && (
            <button 
                onClick={() => onViewPost(post)}
                className="text-xs font-bold text-primary hover:underline transition-all uppercase tracking-wider"
            >
                View all conversations
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
