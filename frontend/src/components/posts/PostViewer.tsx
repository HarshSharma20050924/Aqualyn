import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Pin, Archive, Link as LinkIcon, FolderPlus, Send, Volume2, VolumeX, Play } from 'lucide-react';
import { Post } from '../../types';
import { useAppContext } from '../../context/AppContext';
import ContactAvatar from '../ui/ContactAvatar';

interface PostViewerProps {
  post: Post;
  onClose: () => void;
}

export default function PostViewer({ post, onClose }: PostViewerProps) {
  const { currentUser, likePost, commentPost, addToast, archivePost, pinPost, savePost, sendMessage, deletePost, deleteComment, pinComment, followUser } = useAppContext();
  
  const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUser?.id || '') || false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showChatPicker, setShowChatPicker] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const isVideo = post.mediaType === 'video' || !!post.videoUrl || (post.mediaUrl && post.mediaUrl.endsWith('.mp4'));

  const handleLike = () => {
    likePost(post.id);
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
    } else {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentPost(post.id, commentText);
    setCommentText('');
    addToast('Comment added', 'success');
  };

  const handleShareToChat = (chatId: string) => {
    sendMessage(chatId, `Shared a post: ${post.caption?.substring(0, 50) || 'Post'}...`, { sharedPostId: post.id });
    addToast('Post shared to chat', 'success');
    setShowChatPicker(false);
    setShowMenu(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://aqualyn.app/p/${post.id}`);
    addToast('Link copied to clipboard', 'success');
    setShowMenu(false);
  };

  const isSaved = currentUser?.savedPostIds?.includes(post.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6"
      onClick={onClose}
    >
      {/* Global Close Button top-right */}
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 z-[110] p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
        title="Close (Esc)"
      >
        <X className="w-7 h-7" />
      </button>

      {/* Main Instagram-Style Post Viewer Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-full max-w-5xl max-h-[92vh] h-[680px] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-white/10 text-white relative"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Left Side: Media Container ────────────────────────────────────────── */}
        <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden h-full min-h-[300px]">
          {isVideo ? (
            <div className="relative w-full h-full flex items-center justify-center group">
              <video
                src={post.videoUrl || post.mediaUrl}
                className="w-full h-full object-contain"
                autoPlay={isPlaying}
                loop
                muted={isMuted}
                playsInline
                onClick={() => setIsPlaying(!isPlaying)}
              />
              {/* Video Play/Pause Overlay */}
              {!isPlaying && (
                <div 
                  onClick={() => setIsPlaying(true)}
                  className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                  </div>
                </div>
              )}
              {/* Mute/Unmute Control */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute bottom-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-all shadow-lg"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              {/* Reel Tag Badge */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-semibold text-white/90 flex items-center gap-1.5 border border-white/10">
                <Play className="w-3 h-3 fill-white" /> Reel
              </div>
            </div>
          ) : (
            <img
              src={post.imageUrl || post.mediaUrl || `https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800`}
              alt="Post media"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* ── Right Side: Post Info & Comments Panel ───────────────────────────── */}
        <div className="w-full md:w-[380px] lg:w-[420px] shrink-0 bg-slate-900/95 flex flex-col border-t md:border-t-0 md:border-l border-white/10 h-full">
          
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20">
                <ContactAvatar src={post.userAvatar} name={post.userName} />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-white truncate leading-tight">{post.userName}</h4>
                {post.location && <p className="text-xs text-white/60 truncate">{post.location}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {post.userId !== currentUser?.id && (
                <button
                  onClick={() => followUser(post.userId)}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors px-2.5 py-1 rounded-full border border-sky-400/30 hover:bg-sky-400/10"
                >
                  Follow
                </button>
              )}
              <button 
                onClick={() => setShowMenu(true)} 
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Comments & Caption Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {/* Caption Section */}
            {post.caption && (
              <div className="flex gap-3 pb-3 border-b border-white/10">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                  <ContactAvatar src={post.userAvatar} name={post.userName} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">
                    <span className="font-bold mr-2">{post.userName}</span>
                    {post.caption}
                  </p>
                  <span className="text-[11px] text-white/40 mt-1 block">{post.timestamp || 'Just now'}</span>
                </div>
              </div>
            )}

            {/* Comments List */}
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-3 group relative">
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                    <ContactAvatar src={comment.userAvatar || comment.user?.avatar} name={comment.userName || comment.user?.displayName || 'User'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">
                      <span className="font-bold mr-2">{comment.userName || comment.user?.displayName || 'User'}</span>
                      {comment.text}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-white/40 mt-1">
                      <span>{comment.timestamp || 'Just now'}</span>
                      <button className="hover:text-white transition-colors font-semibold">Reply</button>
                    </div>
                  </div>
                  {post.userId === currentUser?.id && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button onClick={() => deleteComment(post.id, comment.id)} className="text-white/40 hover:text-red-400 p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-white/40 text-xs">
                No comments yet. Start the conversation!
              </div>
            )}
          </div>

          {/* Footer Action Bar & Input */}
          <div className="p-4 border-t border-white/10 bg-slate-950 shrink-0 space-y-3">
            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleLike} 
                  className={`transition-transform active:scale-125 ${isLiked ? 'text-red-500' : 'text-white/90 hover:text-white'}`}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500' : ''}`} />
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById(`comment-input-${post.id}`);
                    el?.focus();
                  }} 
                  className="text-white/90 hover:text-white transition-colors"
                >
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setShowChatPicker(true)} 
                  className="text-white/90 hover:text-white transition-colors"
                >
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
              <button 
                onClick={() => savePost(post.id)} 
                className={`transition-colors ${isSaved ? 'text-amber-400' : 'text-white/90 hover:text-white'}`}
              >
                <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-amber-400' : ''}`} />
              </button>
            </div>

            {/* Likes count & Timestamp */}
            <div>
              <p className="font-bold text-sm text-white">{likesCount.toLocaleString()} likes</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{post.timestamp || 'RECENT'}</p>
            </div>

            {/* Comment Input Box */}
            <div className="flex items-center gap-3 pt-2 border-t border-white/10">
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-white/20">
                <ContactAvatar src={currentUser?.avatar} name={currentUser?.displayName || 'Me'} />
              </div>
              <input
                id={`comment-input-${post.id}`}
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim()}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 disabled:opacity-30 disabled:hover:text-sky-400 transition-colors"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Post Menu Modal */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowMenu(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl text-white divide-y divide-white/10"
              onClick={e => e.stopPropagation()}
            >
              {post.userId === currentUser?.id && (
                <>
                  <button onClick={() => { pinPost(post.id); setShowMenu(false); }} className="w-full p-4 font-medium flex items-center gap-3 hover:bg-white/10 transition-colors">
                    <Pin className="w-5 h-5 text-sky-400" /> {post.isPinned ? 'Unpin Post' : 'Pin to Profile'}
                  </button>
                  <button onClick={() => { archivePost(post.id); setShowMenu(false); }} className="w-full p-4 font-medium flex items-center gap-3 hover:bg-white/10 transition-colors">
                    <Archive className="w-5 h-5 text-amber-400" /> {post.isArchived ? 'Unarchive' : 'Archive Post'}
                  </button>
                  <button onClick={() => { deletePost(post.id); onClose(); }} className="w-full p-4 text-red-400 font-medium flex items-center gap-3 hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5" /> Delete Post
                  </button>
                </>
              )}
              <button onClick={handleCopyLink} className="w-full p-4 font-medium flex items-center gap-3 hover:bg-white/10 transition-colors">
                <LinkIcon className="w-5 h-5 text-teal-400" /> Copy Link
              </button>
              <button onClick={() => { setShowChatPicker(true); setShowMenu(false); }} className="w-full p-4 font-medium flex items-center gap-3 hover:bg-white/10 transition-colors">
                <Share2 className="w-5 h-5 text-indigo-400" /> Share to Chat
              </button>
              <button onClick={() => setShowMenu(false)} className="w-full p-4 text-white/50 font-bold hover:bg-white/10 transition-colors text-center">
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share to Chat Modal */}
      <AnimatePresence>
        {showChatPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowChatPicker(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[60vh] text-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-white">Share to Chat</h3>
                <button onClick={() => setShowChatPicker(false)} className="p-1.5 text-white/70 hover:bg-white/10 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {useAppContext().chats.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => handleShareToChat(c.id)}
                    className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 text-left font-semibold text-white transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10">
                      <ContactAvatar src={c.avatar} name={c.name} />
                    </div>
                    <span className="truncate flex-1">{c.name}</span>
                    <Share2 className="w-4 h-4 text-white/50" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
