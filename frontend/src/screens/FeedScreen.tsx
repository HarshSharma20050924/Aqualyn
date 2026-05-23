import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Send, Bookmark, MoreVertical, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Post, User, Story } from '../types';
import StoryViewer from '../components/StoryViewer';
import StoryCreator from '../components/stories/StoryCreator';

export default function FeedScreen({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { posts, stories, globalUsers, currentUser, likePost, savePost, addToast } = useAppContext();
  const [doubleClickTarget, setDoubleClickTarget] = useState<string | null>(null);
  const [viewerStories, setViewerStories] = useState<Story[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const activeStories = stories.filter(s => {
    const createdAt = new Date(s.createdAt);
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
    return expiresAt > new Date();
  });

  // Group stories by user
  const storiesByUser = activeStories.reduce((acc, story) => {
    if (!acc[story.userId]) {
      acc[story.userId] = [];
    }
    acc[story.userId].push(story);
    return acc;
  }, {} as Record<string, typeof stories>);

  // Get unique users who have stories
  const storyUsers = Object.values(storiesByUser).map(msgs => {
    const first = msgs[0];
    return {
      id: first.userId,
      name: first.userName || 'User',
      username: first.userName || 'user',
      avatar: first.userAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${first.userId}`
    } as any as User;
  });

  // If current user isn't in storyUsers, we could add them with a "add story" capability
  const hasMyStory = storiesByUser[currentUser?.id || '']?.length > 0;

  // Render Post Card
  const PostCard = ({ post }: { post: Post }) => {
    const { likePost, savePost, commentPost, deletePost, addToast, currentUser, globalUsers } = useAppContext();
    const user = globalUsers.find(u => u.id === post.userId) || currentUser;
    const isLiked = currentUser && post.likes.includes(currentUser.id);
    const isSaved = currentUser?.savedPostIds?.includes(post.id);
    const [commentText, setCommentText] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleDoubleTap = () => {
      setDoubleClickTarget(post.id);
      if (!isLiked) {
        likePost(post.id);
      }
      setTimeout(() => setDoubleClickTarget(null), 1000); // Remove animation after 1s
    };

    const handleAddComment = (e: React.FormEvent) => {
      e.preventDefault();
      if (commentText.trim()) {
        commentPost(post.id, commentText);
        setCommentText('');
      }
    };

    const handleDelete = async () => {
      if (window.confirm('Delete this post?')) {
        try {
          await (deletePost as any)(post.id);
          addToast('Post deleted', 'success');
        } catch (e) {
          addToast('Failed to delete', 'error');
        }
      }
      setIsMenuOpen(false);
    };

    return (
      <div className="bg-surface mb-6 border-b border-surface-container pb-6 w-full max-w-lg mx-auto sm:border sm:rounded-3xl sm:mb-8 sm:pb-0 sm:overflow-hidden sm:shadow-sm">
        {/* Post Header */}
        <div className="flex items-center justify-between p-3 sm:px-4">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-surface-container">
              <img src={user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-headline font-bold text-sm tracking-tight">{user?.username || user?.name}</div>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-container-high rounded-2xl shadow-xl z-20 overflow-hidden border border-surface-container">
                {post.userId === currentUser?.id ? (
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-3 text-left text-error hover:bg-surface-container transition-colors flex items-center gap-2"
                  >
                    Delete Post
                  </button>
                ) : (
                  <button className="w-full px-4 py-3 text-left hover:bg-surface-container transition-colors">
                    Report Post
                  </button>
                )}
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full px-4 py-3 text-left hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Post Media */}
        <div
          className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center cursor-pointer"
          onDoubleClick={handleDoubleTap}
        >
          {post.mediaType === 'video' ? (
            <video src={post.mediaUrl} className="w-full h-full object-cover" controls playsInline />
          ) : (
            <img src={post.mediaUrl} alt="Post" className="w-full h-full object-cover" />
          )}

          <AnimatePresence>
            {doubleClickTarget === post.id && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
              >
                <Heart className="w-24 h-24 text-white fill-white drop-shadow-xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Post Actions */}
        <div className="p-3 sm:px-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button onClick={() => likePost(post.id)} className="transition-transform active:scale-90">
                <Heart className={`w-7 h-7 ${isLiked ? 'fill-red-500 text-red-500' : 'text-on-surface'}`} />
              </button>
              <button className="transition-transform active:scale-90 text-on-surface">
                <MessageCircle className="w-7 h-7" />
              </button>
              <button className="transition-transform active:scale-90 text-on-surface">
                <Send className="w-7 h-7" />
              </button>
            </div>
            <button
              onClick={() => {
                savePost(post.id);
                addToast(isSaved ? 'Removed from saved' : 'Saved to collection', 'success');
              }}
            >
              <Bookmark className={`w-7 h-7 ${isSaved ? 'fill-on-surface' : 'text-on-surface'}`} />
            </button>
          </div>

          <div className="font-headline font-semibold text-sm mb-1">{post.likes.length} likes</div>

          {post.caption && (
            <div className="text-sm mb-2">
              <span className="font-headline font-semibold mr-1">{user?.username || user?.name}</span>
              <span className="text-on-surface">{post.caption}</span>
            </div>
          )}

          {post.comments.length > 0 && (
            <div className="space-y-1 mb-2">
              {post.comments.map((c: any, i: number) => (
                <div key={i} className="text-xs">
                  <span className="font-semibold mr-1">{c.user?.username || 'User'}</span>
                  <span className="text-on-surface-variant">{c.content}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddComment} className="mt-3 flex items-center gap-2 border-t border-surface-container pt-3">
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-sm border-none focus:ring-0 outline-none text-on-surface"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              disabled={!commentText.trim()}
              className="text-cyan-600 font-semibold text-sm disabled:opacity-50"
            >
              Post
            </button>
          </form>

          <div className="text-[10px] text-on-surface-variant font-medium mt-2 uppercase tracking-wide">
            {new Date(post.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>
    );
  };

  const feedPosts = [...posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-surface pb-28">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-surface-container">
        <div className="flex items-center justify-between px-4 h-16 w-full max-w-lg mx-auto">
          <h1 className="text-2xl font-black bg-gradient-to-br from-cyan-600 to-blue-500 bg-clip-text text-transparent font-headline tracking-tighter" style={{ fontFamily: 'var(--font-headline, "Outfit", sans-serif)' }}>Aqualyn</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('notifications')} className="p-2 hover:bg-surface-container rounded-full transition-colors active:scale-95 duration-200">
              <Heart className="w-6 h-6 text-on-surface" />
            </button>
            <button onClick={() => onNavigate('chats')} className="p-2 hover:bg-surface-container rounded-full transition-colors active:scale-95 duration-200">
              <MessageCircle className="w-6 h-6 text-on-surface" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Feed Content */}
      <main className="pt-16 max-w-lg mx-auto">

        {/* Stories Horizontal Tray */}
        <div className="py-4 border-b border-surface-container overflow-x-auto scrollbar-hide flex items-center px-4 gap-4">

          {/* My Story/Add Story */}
          <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={() => {
            if (hasMyStory) {
              setViewerStories(storiesByUser[currentUser?.id as string]);
              setActiveStoryIndex(0);
            } else {
              setIsCreatorOpen(true);
            }
          }}>
            <div className="relative w-16 h-16 rounded-full p-[2px] bg-surface-container hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-surface rounded-full overflow-hidden border-2 border-surface">
                <img src={currentUser?.avatar} alt="You" className="w-full h-full object-cover" />
              </div>
              {!hasMyStory && (
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-cyan-500 rounded-full border-2 border-surface flex items-center justify-center">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <span className="text-[11px] text-on-surface-variant font-medium">Your story</span>
          </div>

          {/* Friends Stories */}
          {storyUsers.map(user => {
            if (user.id === currentUser?.id) return null; // Already rendered in My Story
            return (
              <div key={user.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group" onClick={() => {
                setViewerStories(storiesByUser[user.id]);
                setActiveStoryIndex(0);
              }}>
                <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-cyan-500 to-purple-500 group-hover:scale-105 transition-transform duration-200">
                  <div className="w-full h-full bg-surface rounded-full overflow-hidden border-2 border-surface">
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                </div>
                <span className="text-[11px] text-on-surface font-medium truncate w-16 text-center">{user.username || user.name.split(' ')[0]}</span>
              </div>
            );
          })}

        </div>

        {/* Posts Feed */}
        <div className="mt-2 sm:mt-6 sm:px-4">
          {feedPosts.length === 0 ? (
            <div className="text-center mt-20 opacity-60">
              <p className="text-on-surface-variant font-medium">No posts yet.</p>
              <p className="text-sm mt-2">Follow some friends to see their updates here.</p>
            </div>
          ) : (
            feedPosts.map(post => <PostCard key={post.id} post={post} />)
          )}
        </div>

      </main>

      <AnimatePresence>
        {activeStoryIndex !== null && (
          <StoryViewer
            stories={viewerStories}
            initialIndex={activeStoryIndex}
            onClose={() => setActiveStoryIndex(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreatorOpen && (
          <StoryCreator onClose={() => setIsCreatorOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
