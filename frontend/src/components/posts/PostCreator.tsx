import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, Video, Camera, Check, MapPin, Tag, Music } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface PostCreatorProps {
  onClose: () => void;
}

export default function PostCreator({ onClose }: PostCreatorProps) {
  const { addPost, addToast, currentUser } = useAppContext();
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [location, setLocation] = useState('');
  const [isTagging, setIsTagging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    }
  };

  const handlePost = () => {
    if (!mediaUrl && !caption.trim()) {
      addToast('Please add a photo, video, or caption', 'error');
      return;
    }

    addPost({
      caption,
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaType || undefined,
      userId: currentUser?.id,
      userName: currentUser?.name,
      userAvatar: currentUser?.avatar,
      timestamp: 'Just now',
      likes: [],
      comments: []
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        className="fixed inset-0 z-[100] bg-surface flex flex-col md:max-w-xl md:mx-auto md:my-12 md:rounded-[2.5rem] md:shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
          <button onClick={onClose} className="p-2 text-on-surface hover:bg-surface-variant rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-on-surface font-headline font-bold text-xl">New Post</h2>
          <button 
            onClick={handlePost}
            disabled={!mediaUrl && !caption.trim()}
            className="px-6 py-2 bg-primary text-on-primary rounded-full font-bold disabled:opacity-50 transition-all active:scale-95"
          >
            Share
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="flex gap-4">
            <img src={currentUser?.avatar} alt="Me" className="w-12 h-12 rounded-full object-cover shadow-md" />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="flex-1 bg-transparent text-on-surface text-lg resize-none outline-none placeholder:text-on-surface-variant/40 min-h-[120px]"
            />
          </div>

          {mediaUrl ? (
            <div className="relative rounded-3xl overflow-hidden aspect-square bg-surface-container-highest shadow-inner group">
              {mediaType === 'image' ? (
                <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <video src={mediaUrl} className="w-full h-full object-cover" controls />
              )}
              <button 
                onClick={() => { setMediaUrl(null); setMediaType(null); }}
                className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-[2rem] border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-4 text-on-surface-variant hover:bg-primary-container/20 hover:border-primary/40 transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-8 h-8 text-primary" />
                </div>
                <span className="font-bold">Add Photo</span>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-[2rem] border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-4 text-on-surface-variant hover:bg-secondary-container/20 hover:border-secondary/40 transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Video className="w-8 h-8 text-secondary" />
                </div>
                <span className="font-bold">Add Video</span>
              </button>
            </div>
          )}

          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-container hover:bg-surface-container-highest transition-colors">
              <div className="flex items-center gap-3 text-on-surface font-semibold">
                <Tag className="w-5 h-5 text-primary" />
                <span>Tag People</span>
              </div>
              <Check className="w-5 h-5 text-on-surface-variant opacity-0" />
            </button>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <MapPin className="w-5 h-5 text-secondary" />
              </div>
              <input 
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add Location"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-container text-on-surface font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-container hover:bg-surface-container-highest transition-colors">
              <div className="flex items-center gap-3 text-on-surface font-semibold">
                <Music className="w-5 h-5 text-pink-500" />
                <span>Add Music</span>
              </div>
              <span className="text-xs text-on-surface-variant">Select track</span>
            </button>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*,video/*" 
            className="hidden" 
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
