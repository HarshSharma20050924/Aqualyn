import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, Eye } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import StoryViewer from '../components/StoryViewer';
import StoryCreator from '../components/stories/StoryCreator';

export default function StoriesScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate: (s: string) => void }) {
  const { stories, currentUser, isLoading } = useAppContext();
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const SkeletonStory = () => (
    <div className="flex items-center gap-4 p-4 rounded-2xl animate-pulse">
      <div className="w-16 h-16 rounded-full bg-white/10 shrink-0"></div>
      <div className="flex-1 border-b border-surface-container pb-2 space-y-2">
        <div className="h-4 bg-white/10 rounded-full w-1/3"></div>
        <div className="h-3 bg-white/10 rounded-full w-1/4"></div>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }} 
      className="bg-surface min-h-screen pb-32"
    >
      <header className="fixed top-0 w-full z-50 bg-slate-50/70 backdrop-blur-xl border-b border-white/15 shadow-[0_8px_32px_0_rgba(0,87,189,0.06)] h-16 flex items-center px-6">
        <button onClick={onBack} className="text-on-surface-variant hover:bg-on-surface/5 p-2 rounded-full transition-colors active:scale-95 mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-black text-on-surface font-headline tracking-tight">Stories</h1>
      </header>

      <main className="pt-24 px-4 max-w-2xl mx-auto space-y-8">
        <section>
          <h2 className="font-headline font-bold text-lg text-on-surface px-2 mb-4">My Story</h2>
          <div 
            onClick={() => setIsCreatorOpen(true)}
            className="flex items-center gap-4 p-4 glass-card rounded-2xl border border-white/40 shadow-sm hover:bg-white/60 transition-colors cursor-pointer"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-surface-container">
                <img src={currentUser?.avatar} alt="My Story" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full border-2 border-white flex items-center justify-center text-white">
                <Plus className="w-3 h-3" />
              </div>
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">Add to your story</h3>
              <p className="text-sm text-on-surface-variant">Share a photo or video</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-headline font-bold text-lg text-on-surface px-2 mb-4">Recent Updates</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <SkeletonStory key={i} />)}
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-8 opacity-60">
              <p className="text-on-surface-variant font-medium">No recent updates.</p>
              <p className="text-sm mt-2">Add contacts to see their stories.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stories.map((story, i) => (
                <div 
                  key={story.id} 
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/40 transition-colors cursor-pointer"
                  onClick={() => setActiveStoryIndex(i)}
                >
                  <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-secondary to-primary">
                    <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                      <img src={story.userAvatar} alt={story.userName} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex-1 border-b border-surface-container pb-2 flex justify-between items-center">
                    <div>
                      <h3 className="font-headline font-bold text-on-surface">{story.userName}</h3>
                      <p className="text-sm text-on-surface-variant">{story.timestamp}</p>
                    </div>
                    <div className="flex items-center gap-1 text-on-surface-variant">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-bold">{story.views}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

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
        {isCreatorOpen && (
          <StoryCreator onClose={() => setIsCreatorOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
