import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, Search, TrendingUp, Sparkles, Filter } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import StoryViewer from '../components/StoryViewer';
import StoryCreator from '../components/stories/StoryCreator';
import PostCard from '../components/posts/PostCard';
import PostViewer from '../components/posts/PostViewer';
import { Post } from '../types';

export default function DiscoveryScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate: (s: string) => void }) {
  const { stories, posts, currentUser, isLoading } = useAppContext();
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const SkeletonPost = () => (
    <div className="bg-white/20 rounded-[2.5rem] overflow-hidden animate-pulse mb-8 border border-white/20">
      <div className="h-16 flex items-center gap-4 px-6">
        <div className="w-10 h-10 rounded-full bg-white/10"></div>
        <div className="h-4 w-24 bg-white/10 rounded-full"></div>
      </div>
      <div className="aspect-square bg-white/5"></div>
      <div className="p-6 space-y-4">
        <div className="flex gap-4">
            <div className="w-16 h-8 bg-white/10 rounded-full"></div>
            <div className="w-16 h-8 bg-white/10 rounded-full"></div>
        </div>
        <div className="h-4 w-2/3 bg-white/10 rounded-full"></div>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="bg-surface min-h-screen pb-32 overflow-x-hidden"
    >
      {/* Premium Header */}
      <header className="fixed top-0 w-full z-50 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-white/15 shadow-[0_8px_32px_0_rgba(0,87,189,0.06)] h-20 flex items-center px-6">
        <div className="flex items-center gap-4 flex-1">
          <h1 className="text-3xl font-black text-on-surface font-headline tracking-tighter bg-gradient-to-br from-cyan-600 to-blue-500 bg-clip-text text-transparent">FEED</h1>
        </div>
        <div className="flex items-center gap-3">
            <button className="p-3 rounded-full bg-surface-container/50 hover:bg-secondary/10 transition-colors">
                <Search className="w-6 h-6 text-on-surface" />
            </button>
            <button className="p-3 rounded-full bg-surface-container/50 hover:bg-secondary/10 transition-colors">
                <Sparkles className="w-6 h-6 text-secondary" />
            </button>
        </div>
      </header>

      <main className="pt-24 px-4 max-w-2xl mx-auto space-y-10">
        
        {/* Stories Row */}
        <section>
          <div className="flex items-center justify-between px-2 mb-4">
            <h2 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
                <CircleDashedIcon className="w-5 h-5 text-secondary" />
                Stories
            </h2>
            <button className="text-xs font-black text-secondary tracking-widest uppercase">Watch All</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
             {/* Add Story Button */}
            <div 
              onClick={() => setIsStoryCreatorOpen(true)}
              className="flex flex-col items-center gap-2 snap-start shrink-0"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-[2rem] border-2 border-dashed border-secondary/30 flex items-center justify-center bg-secondary/5 hover:bg-secondary/10 transition-all">
                  <Plus className="w-8 h-8 text-secondary" />
                </div>
              </div>
              <span className="text-[11px] font-bold text-on-surface-variant">Add</span>
            </div>

            {/* Recent Stories */}
            {stories.map((story, i) => (
              <div 
                key={story.id} 
                onClick={() => setActiveStoryIndex(i)}
                className="flex flex-col items-center gap-2 snap-start shrink-0 cursor-pointer group"
              >
                <div className="w-20 h-20 rounded-[2rem] p-[3px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 shadow-lg group-active:scale-90 transition-transform">
                  <div className="w-full h-full rounded-[1.8rem] border-2 border-white dark:border-slate-900 overflow-hidden">
                    <img src={story.userAvatar} alt={story.userName} className="w-full h-full object-cover" />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-on-surface truncate w-20 text-center">{story.userName.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Global Feed */}
        <section className="space-y-6">
            <div className="flex items-center gap-2 px-2">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <h2 className="font-headline font-bold text-lg text-on-surface">Trending Feed</h2>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <SkeletonPost key={i} />)}
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-20 glass-card rounded-[3rem] border border-dashed border-secondary/20 bg-secondary/5">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-10 h-10 text-secondary" />
                    </div>
                    <h3 className="text-xl font-black text-on-surface">Your feed is empty</h3>
                    <p className="text-on-surface-variant mt-2 max-w-xs mx-auto text-sm">Follow people or invite friends to see what's happening around you.</p>
                    <button 
                        onClick={() => onNavigate('contacts')}
                        className="mt-6 px-8 py-3 bg-secondary text-white rounded-full font-black shadow-xl shadow-secondary/20 hover:scale-105 transition-transform active:scale-95"
                    >
                        Find People
                    </button>
                </div>
            ) : (
                <div className="pb-20">
                    {posts.map(post => (
                        <PostCard 
                            key={post.id} 
                            post={post} 
                            onViewPost={() => setSelectedPost(post)} 
                        />
                    ))}
                </div>
            )}
        </section>
      </main>

      {/* Floating Action Menu */}
      <button 
        onClick={() => onNavigate('profile')} // Or open a generic creator
        className="fixed right-6 bottom-24 w-16 h-16 rounded-[2rem] bg-gradient-to-br from-cyan-600 to-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all animate-bounce-slow"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Modals */}
      <AnimatePresence>
        {activeStoryIndex !== null && (
          <StoryViewer
            stories={stories}
            initialIndex={activeStoryIndex}
            onClose={() => setActiveStoryIndex(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isStoryCreatorOpen && (
          <StoryCreator onClose={() => setIsStoryCreatorOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPost && (
          <PostViewer post={selectedPost} onClose={() => setSelectedPost(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CircleDashedIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M10.1 2.18a10 10 0 0 1 3.8 0"/>
            <path d="M17.6 5.26a10 10 0 0 1 1.14 1.14"/>
            <path d="M21.82 10.1a10 10 0 0 1 0 3.8"/>
            <path d="M18.74 17.6a10 10 0 0 1-1.14 1.14"/>
            <path d="M13.9 21.82a10 10 0 0 1-3.8 0"/>
            <path d="M6.4 18.74a10 10 0 0 1-1.14-1.14"/>
            <path d="M2.18 13.9a10 10 0 0 1 0-3.8"/>
            <path d="M5.26 6.4a10 10 0 0 1 1.14-1.14"/>
        </svg>
    );
}

