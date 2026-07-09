import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Post } from '../types';

interface Props {
  posts: Post[];
  onDeleteRequest: (type: 'post', id: string, name: string) => void;
}

export default function PostsTab({ posts, onDeleteRequest }: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-black font-headline text-on-surface">
        Feed Posts <span className="text-primary text-base">({posts.length})</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {posts.map(post => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
              className="glass-card rounded-[2rem] p-5 border border-white/40 dark:border-white/5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <img
                    src={post.userAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.userName}`}
                    alt={post.userName}
                    className="w-8 h-8 rounded-xl border border-white/20 bg-white object-cover"
                  />
                  <div>
                    <span className="font-bold text-xs text-on-surface block">{post.userName || 'User'}</span>
                    {post.timestamp && (
                      <span className="text-[9px] text-on-surface-variant">
                        {new Date(post.timestamp).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {post.imageUrl && (
                  <img src={post.imageUrl} alt="" className="w-full h-36 object-cover rounded-xl mb-3 border border-white/10" />
                )}
                <p className="text-xs text-on-surface leading-relaxed italic">
                  "{post.caption || (post as any).content || 'No text content'}"
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-on-surface-variant">❤️ {post.likes?.length ?? 0}</span>
                  <span className="text-[10px] text-on-surface-variant">💬 {post.comments?.length ?? 0}</span>
                </div>
              </div>
              <button
                onClick={() => onDeleteRequest('post', post.id, `Post by ${post.userName || 'User'}`)}
                className="mt-4 text-xs font-black bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-rose-400 py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Delete Post
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {posts.length === 0 && (
          <p className="text-on-surface-variant text-sm text-center py-10 col-span-3">No posts found</p>
        )}
      </div>
    </div>
  );
}
