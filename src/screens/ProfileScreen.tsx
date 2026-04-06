import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pen, Plus, Heart, MessageCircle, Camera, Grid, Bookmark, Folder, MoreVertical, Settings as SettingsIcon } from 'lucide-react';
import { Post, Collection } from '../types';
import { useAppContext } from '../context/AppContext';
import StoryCreator from '../components/stories/StoryCreator';
import PostCreator from '../components/posts/PostCreator';
import PostViewer from '../components/posts/PostViewer';

export default function ProfileScreen({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { currentUser, posts, createCollection } = useAppContext();
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isPostCreatorOpen, setIsPostCreatorOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'collections'>('posts');
  const [isNewCollectionModalOpen, setIsNewCollectionModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  if (!currentUser) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant font-bold">Loading Profile...</p>
        </div>
      </div>
    );
  }

  const myPosts = posts.filter(p => p.userId === currentUser.id && !p.isArchived);
  const savedPosts = posts.filter(p => currentUser.savedPostIds?.includes(p.id));

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    createCollection(newCollectionName);
    setNewCollectionName('');
    setIsNewCollectionModalOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-surface min-h-screen pb-32 overflow-y-auto">
      <header className="fixed top-0 w-full z-50 bg-slate-50/70 backdrop-blur-xl border-b border-white/15 shadow-[0_8px_32px_0_rgba(0,87,189,0.06)] h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black bg-gradient-to-br from-cyan-600 to-blue-500 bg-clip-text text-transparent font-headline tracking-tight">Aqualyn</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('settings')} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-secondary/20 transition-colors">
            <SettingsIcon className="w-5 h-5 text-on-surface" />
          </button>
          <div className="w-10 h-10 rounded-full border-2 border-secondary-fixed aqua-glow overflow-hidden">
            <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-4xl mx-auto space-y-10">
        <section className="relative flex flex-col md:flex-row items-center md:items-end gap-8">
          <div className="relative group">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-[6px] border-white aqua-glow overflow-hidden bg-surface-container shadow-xl">
              <img src={currentUser.largeAvatar || currentUser.avatar} alt="Large Profile" className="w-full h-full object-cover" />
            </div>
            <button onClick={() => onNavigate('edit-profile')} className="absolute bottom-2 right-2 bg-secondary text-on-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-90">
              <Pen className="w-5 h-5 fill-on-secondary" />
            </button>
          </div>
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">{currentUser.displayName || currentUser.name}</h1>
              <p className="text-on-surface-variant font-bold">@{currentUser.username || currentUser.id}</p>
            </div>
            <p className="text-on-surface/80 max-w-md leading-relaxed">{currentUser.bio || 'Welcome to Aqualyn!'}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              <button onClick={() => onNavigate('edit-profile')} className="px-8 py-3 rounded-full bg-gradient-to-br from-secondary to-primary-container text-on-primary-container font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all border-t border-white/20">
                Edit Profile
              </button>
              <button className="px-6 py-3 rounded-full glass-panel border border-outline-variant/15 text-on-surface font-semibold text-sm hover:bg-white/40 transition-colors active:scale-95">
                Share Profile
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-headline font-bold text-xl text-on-surface">Recent Stories</h2>
            <button onClick={() => onNavigate('stories')} className="text-primary font-bold text-sm hover:text-primary-dim transition-colors">View All</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            <div 
              onClick={() => setIsCreatorOpen(true)}
              className="min-w-[120px] h-[180px] rounded-3xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:bg-white/40 transition-colors cursor-pointer snap-start"
            >
              <div className="w-12 h-12 rounded-full bg-primary-container/30 flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <span className="font-semibold text-sm">Add Story</span>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[120px] h-[180px] rounded-3xl overflow-hidden relative group cursor-pointer snap-start shadow-sm">
                <img src={`https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=300&h=450&sig=${i}`} alt="Story" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <span className="absolute bottom-3 left-3 text-white font-medium text-xs">2h ago</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex border-b border-outline-variant/10">
            <button 
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'posts' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant opacity-60'}`}
            >
              <Grid className="w-5 h-5" /> Posts
            </button>
            <button 
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'saved' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant opacity-60'}`}
            >
              <Bookmark className="w-5 h-5" /> Saved
            </button>
            <button 
              onClick={() => setActiveTab('collections')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'collections' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant opacity-60'}`}
            >
              <Folder className="w-5 h-5" /> Collections
            </button>
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'posts' && (
              <div className="grid grid-cols-3 gap-2">
                <div 
                  onClick={() => setIsPostCreatorOpen(true)}
                  className="aspect-square rounded-xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:bg-white/40 transition-colors cursor-pointer"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">New Post</span>
                </div>
                {myPosts.map((post) => (
                  <div 
                    key={post.id} 
                    onClick={() => setSelectedPost(post)}
                    className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer"
                  >
                    <img src={post.imageUrl || post.mediaUrl || `https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=300&h=300&sig=${post.id}`} alt="Post" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1 text-white font-semibold">
                        <Heart className="w-5 h-5 fill-white" /> {post.likes.length}
                      </div>
                      <div className="flex items-center gap-1 text-white font-semibold">
                        <MessageCircle className="w-5 h-5 fill-white" /> {post.comments.length}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="grid grid-cols-3 gap-2">
                {savedPosts.map((post) => (
                  <div 
                    key={post.id} 
                    onClick={() => setSelectedPost(post)}
                    className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer"
                  >
                    <img src={post.imageUrl || post.mediaUrl || `https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=300&h=300&sig=${post.id}`} alt="Post" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                ))}
                {savedPosts.length === 0 && (
                  <div className="col-span-3 py-20 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-surface-container flex items-center justify-center">
                      <Bookmark className="w-8 h-8 text-on-surface-variant" />
                    </div>
                    <p className="text-on-surface-variant font-medium">No saved posts yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'collections' && (
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsNewCollectionModalOpen(true)}
                  className="aspect-video rounded-3xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:bg-white/40 transition-colors"
                >
                  <Plus className="w-6 h-6" />
                  <span className="font-bold">New Collection</span>
                </button>
                {currentUser.collections?.map(collection => (
                  <div key={collection.id} className="aspect-video rounded-3xl bg-surface-container-highest overflow-hidden relative group cursor-pointer shadow-lg">
                    <img src={collection.coverImageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400&h=225'} alt={collection.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                      <h4 className="text-white font-black text-lg">{collection.name}</h4>
                      <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{collection.postIds.length} posts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {isCreatorOpen && (
          <StoryCreator onClose={() => setIsCreatorOpen(false)} />
        )}
        {isPostCreatorOpen && (
          <PostCreator onClose={() => setIsPostCreatorOpen(false)} />
        )}
        {selectedPost && (
          <PostViewer post={selectedPost} onClose={() => setSelectedPost(null)} />
        )}
        {isNewCollectionModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setIsNewCollectionModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-2xl font-black text-on-surface mb-6">New Collection</h3>
              <input 
                autoFocus
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Collection name"
                className="w-full px-6 py-4 rounded-2xl bg-surface-container text-on-surface font-bold outline-none mb-8"
              />
              <div className="flex gap-4">
                <button onClick={() => setIsNewCollectionModalOpen(false)} className="flex-1 py-4 font-bold text-on-surface-variant">Cancel</button>
                <button onClick={handleCreateCollection} className="flex-1 py-4 bg-primary text-on-primary rounded-2xl font-black shadow-xl">Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
