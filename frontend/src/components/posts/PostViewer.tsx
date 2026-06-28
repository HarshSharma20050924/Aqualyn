import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, MessageCircle, Share2, MoreHorizontal, Send, Bookmark, Pin, Archive, Link as LinkIcon, FolderPlus, CheckCheck } from 'lucide-react';
import { Post } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface PostViewerProps {
  post: Post;
  onClose: () => void;
}

export default function PostViewer({ post, onClose }: PostViewerProps) {
  const { currentUser, likePost, commentPost, addToast, archivePost, pinPost, savePost, addPostToCollection, sendMessage, deletePost, deleteComment, pinComment } = useAppContext();
  const [isLiked, setIsLiked] = useState(post.likes.includes(currentUser?.id || ''));
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);

  const [showChatPicker, setShowChatPicker] = useState(false);

  const handleLike = () => {
    likePost(post.id);
    setIsLiked(!isLiked);
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentPost(post.id, commentText);
    setCommentText('');
    addToast('Comment added', 'success');
  };

  const handleShareToChat = (chatId: string) => {
    sendMessage(chatId, `Shared a post: ${post.caption.substring(0, 50)}...`, { sharedPostId: post.id });
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
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col"
    >
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent absolute top-0 w-full z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <img src={post.userAvatar || `https://ui-avatars.com/api/?name=${post.userName}&background=random`} alt={post.userName} className="w-8 h-8 rounded-full" />
            <span className="text-white font-semibold">{post.userName}</span>
          </div>
        </div>
        <button onClick={() => setShowMenu(true)} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {(post.imageUrl || (post.mediaUrl && post.mediaType !== 'video')) && (
          <img src={post.imageUrl || post.mediaUrl} alt="Post" className="w-full h-full object-contain" />
        )}
        {(post.videoUrl || (post.mediaUrl && post.mediaType === 'video')) && (
          <video src={post.videoUrl || post.mediaUrl} className="w-full h-full object-contain" controls autoPlay loop muted playsInline />
        )}
      </div>

      <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 absolute bottom-0 w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className={`p-2 rounded-full transition-colors ${isLiked ? 'text-red-500' : 'text-white hover:bg-white/10'}`}>
              <Heart className={`w-7 h-7 ${isLiked ? 'fill-red-500' : ''}`} />
            </button>
            <button onClick={() => setShowComments(!showComments)} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
              <MessageCircle className="w-7 h-7" />
            </button>
            <button onClick={() => setShowChatPicker(true)} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
              <Share2 className="w-7 h-7" />
            </button>
          </div>
          <button onClick={() => savePost(post.id)} className={`p-2 rounded-full transition-colors ${isSaved ? 'text-yellow-500' : 'text-white hover:bg-white/10'}`}>
            <Bookmark className={`w-7 h-7 ${isSaved ? 'fill-yellow-500' : ''}`} />
          </button>
        </div>

        <div className="text-white mb-2">
          <span className="font-bold mr-2">{post.likes.length} likes</span>
        </div>

        <div className="text-white">
          <span className="font-bold mr-2">{post.userName}</span>
          <span>{post.caption}</span>
        </div>
        
        {post.comments.length > 0 && (
          <button onClick={() => setShowComments(true)} className="text-white/60 text-sm mt-2 hover:text-white transition-colors">
            View all {post.comments.length} comments
          </button>
        )}
        <div className="text-white/40 text-xs mt-1 uppercase tracking-wider">{post.timestamp}</div>
      </div>

      {/* Post Menu Modal */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowMenu(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col">
                {post.userId === currentUser?.id && (
                  <>
                    <button onClick={() => { pinPost(post.id); setShowMenu(false); }} className="p-4 text-on-surface font-semibold flex items-center gap-3 hover:bg-surface-variant transition-colors">
                      <Pin className="w-5 h-5" /> {post.isPinned ? 'Unpin from profile' : 'Pin to profile'}
                    </button>
                    <button onClick={() => { archivePost(post.id); setShowMenu(false); }} className="p-4 text-on-surface font-semibold flex items-center gap-3 hover:bg-surface-variant transition-colors">
                      <Archive className="w-5 h-5" /> {post.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button onClick={() => { deletePost(post.id); onClose(); }} className="p-4 text-red-500 font-semibold flex items-center gap-3 hover:bg-surface-variant transition-colors">
                      <X className="w-5 h-5" /> Delete Post
                    </button>
                  </>
                )}
                <button onClick={() => { setShowCollectionPicker(true); setShowMenu(false); }} className="p-4 text-on-surface font-semibold flex items-center gap-3 hover:bg-surface-variant transition-colors">
                  <FolderPlus className="w-5 h-5" /> Add to collection
                </button>
                <button onClick={handleCopyLink} className="p-4 text-on-surface font-semibold flex items-center gap-3 hover:bg-surface-variant transition-colors">
                  <LinkIcon className="w-5 h-5" /> Copy link
                </button>
                <button onClick={() => { setShowChatPicker(true); setShowMenu(false); }} className="p-4 text-on-surface font-semibold flex items-center gap-3 hover:bg-surface-variant transition-colors">
                  <Share2 className="w-5 h-5" /> Share to...
                </button>
                <button onClick={() => setShowMenu(false)} className="p-4 text-red-500 font-bold hover:bg-surface-variant transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Picker Modal */}
      <AnimatePresence>
        {showChatPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowChatPicker(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-surface w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[60vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
                <h3 className="font-bold text-on-surface">Share to Chat</h3>
                <button onClick={() => setShowChatPicker(false)} className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {useAppContext().chats.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => handleShareToChat(c.id)}
                    className="w-full p-4 rounded-2xl bg-surface-variant/50 hover:bg-surface-variant text-left font-semibold text-on-surface transition-colors flex items-center gap-4"
                  >
                    <img src={c.avatar || `https://ui-avatars.com/api/?name=${c.name}`} className="w-10 h-10 rounded-full" />
                    <span className="truncate">{c.name}</span>
                    {c.isGroup && <span className="ml-auto text-[10px] bg-secondary/10 text-secondary px-2 py-1 rounded-full uppercase font-bold tracking-widest whitespace-nowrap">Group</span>}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 h-[70vh] bg-surface rounded-t-3xl shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-outline-variant/20">
              <h3 className="font-headline font-bold text-lg text-on-surface">Comments</h3>
              <button onClick={() => setShowComments(false)} className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {post.comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-3 group relative">
                  <img src={comment.userAvatar || `https://ui-avatars.com/api/?name=${comment.userName}&background=random`} alt={comment.userName} className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-sm text-on-surface">{comment.userName}</span>
                      <span className="text-xs text-on-surface-variant">{comment.timestamp}</span>
                      {comment.isPinned && <Pin className="w-3 h-3 text-secondary fill-secondary" />}
                    </div>
                    <p className="text-sm text-on-surface mt-0.5 pr-8">{comment.text}</p>
                  </div>
                  {post.userId === currentUser?.id && (
                    <div className="absolute right-0 top-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => pinComment(post.id, comment.id)} className="text-on-surface-variant hover:text-secondary p-1">
                        <Pin className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteComment(post.id, comment.id)} className="text-on-surface-variant hover:text-red-500 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {post.comments.length === 0 && (
                <div className="text-center text-on-surface-variant py-8">
                  No comments yet. Be the first!
                </div>
              )}
            </div>

            <div className="p-4 border-t border-outline-variant/20 bg-surface">
              <div className="flex items-center gap-2 bg-surface-variant rounded-full px-4 py-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                />
                <button 
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="p-2 text-primary disabled:opacity-50 transition-opacity"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
