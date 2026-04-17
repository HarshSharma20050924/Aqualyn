import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Camera, Image as ImageIcon, Type, Smile, Music, 
  Send, ChevronLeft, Download, Zap, RefreshCw, 
  MapPin, Hash, AtSign, Search, Heart, Star, Settings, Check
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface Sticker {
  id: string;
  type: 'mention' | 'hashtag' | 'location' | 'gif' | 'emoji';
  content: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
}

export default function StoryCreator({ onClose }: { onClose: () => void }) {
  const { addStory, currentUser, toggleCloseFriend, globalUsers } = useAppContext();
  const [step, setStep] = useState<'capture' | 'edit' | 'settings'>('capture');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [filter, setFilter] = useState('none');
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [isAddingText, setIsAddingText] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isCloseFriendsOnly, setIsCloseFriendsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const filters = [
    { name: 'Normal', value: 'none' },
    { name: 'Vivid', value: 'contrast(1.2) saturate(1.2)' },
    { name: 'B&W', value: 'grayscale(1)' },
    { name: 'Warm', value: 'sepia(0.3) hue-rotate(-30deg)' },
    { name: 'Cool', value: 'hue-rotate(30deg) saturate(0.8)' },
    { name: 'Vintage', value: 'sepia(0.5) contrast(0.8)' },
  ];

  const handleCapture = () => {
    // Simulate capture
    setMediaUrl('https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=600&h=900');
    setMediaType('image');
    setStep('edit');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      setMediaType(file.type.startsWith('video') ? 'video' : 'image');
      setStep('edit');
    }
  };

  const handleAddText = () => {
    if (currentText.trim()) {
      setTextOverlays([...textOverlays, {
        id: Date.now().toString(),
        text: currentText,
        x: 50,
        y: 50,
        color: '#ffffff',
        fontSize: 24
      }]);
      setCurrentText('');
      setIsAddingText(false);
    }
  };

  const handleAddSticker = (type: Sticker['type'], content: string) => {
    setStickers([...stickers, {
      id: Date.now().toString(),
      type,
      content,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0
    }]);
    setShowStickers(false);
  };

  const handleShare = () => {
    if (mediaUrl) {
      addStory({
        mediaUrl,
        mediaType,
        stickers,
        isCloseFriends: isCloseFriendsOnly,
      });
      onClose();
    }
  };

  const filteredUsers = globalUsers.filter(u => 
    u.id !== currentUser?.id && 
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[600] bg-black flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 flex items-center justify-between pointer-events-none">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto active:scale-90 transition-transform"
        >
          <X className="w-6 h-6" />
        </button>
        
        {step === 'edit' && (
          <div className="flex gap-3 pointer-events-auto">
            <button onClick={() => setStep('settings')} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white">
              <Settings className="w-6 h-6" />
            </button>
            <button onClick={() => setIsAddingText(true)} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white">
              <Type className="w-6 h-6" />
            </button>
            <button onClick={() => setShowStickers(true)} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white">
              <Smile className="w-6 h-6" />
            </button>
            <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white">
              <Music className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 relative bg-neutral-900 overflow-hidden">
        {step === 'capture' ? (
          <div className="h-full flex flex-col items-center justify-center">
            {/* Mock Camera View */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
            <div className="text-white/20 flex flex-col items-center">
              <Camera className="w-24 h-24 mb-4 opacity-20" />
              <p className="font-bold tracking-widest uppercase text-xs">Camera Preview</p>
            </div>
            
            {/* Capture Controls */}
            <div className="absolute bottom-12 left-0 right-0 px-8 flex items-center justify-between">
              <label className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform">
                <ImageIcon className="w-6 h-6" />
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
              </label>
              
              <button 
                onClick={handleCapture}
                onMouseDown={() => setIsRecording(true)}
                onMouseUp={() => setIsRecording(false)}
                className="relative group"
              >
                <div className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all duration-300 ${isRecording ? 'scale-125' : ''}`}>
                  <div className={`w-16 h-16 rounded-full bg-white transition-all duration-300 ${isRecording ? 'scale-75 rounded-lg bg-red-500' : ''}`} />
                </div>
                {isRecording && (
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                  >
                    REC
                  </motion.div>
                )}
              </button>
              
              <button 
                onClick={() => setIsFrontCamera(!isFrontCamera)}
                className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                <RefreshCw className={`w-6 h-6 transition-transform duration-500 ${isFrontCamera ? '' : 'rotate-180'}`} />
              </button>
            </div>
          </div>
        ) : step === 'edit' ? (
          <div className="h-full relative">
            {/* Media Preview */}
            <div 
              className="h-full w-full bg-cover bg-center transition-all duration-500"
              style={{ 
                backgroundImage: `url(${mediaUrl})`,
                filter: filter
              }}
            />
            
            {/* Stickers & Text Overlays */}
            <div className="absolute inset-0 pointer-events-none">
              {textOverlays.map(text => (
                <motion.div 
                  key={text.id}
                  drag
                  dragMomentum={false}
                  className="absolute pointer-events-auto cursor-move"
                  style={{ left: `${text.x}%`, top: `${text.y}%`, color: text.color, fontSize: `${text.fontSize}px` }}
                >
                  <span className="font-black drop-shadow-lg whitespace-nowrap">{text.text}</span>
                </motion.div>
              ))}
              
              {stickers.map(sticker => (
                <motion.div 
                  key={sticker.id}
                  drag
                  dragMomentum={false}
                  className="absolute pointer-events-auto cursor-move"
                  style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
                >
                  {sticker.type === 'mention' && (
                    <div className="bg-white text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-xl">
                      <AtSign className="w-4 h-4" /> {sticker.content}
                    </div>
                  )}
                  {sticker.type === 'hashtag' && (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-xl">
                      <Hash className="w-4 h-4" /> {sticker.content}
                    </div>
                  )}
                  {sticker.type === 'location' && (
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-xl">
                      <MapPin className="w-4 h-4" /> {sticker.content}
                    </div>
                  )}
                  {sticker.type === 'emoji' && (
                    <span className="text-6xl drop-shadow-xl">{sticker.content}</span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Filter Selector */}
            <div className="absolute bottom-32 left-0 right-0 flex gap-4 px-6 overflow-x-auto scrollbar-hide py-4">
              {filters.map(f => (
                <button 
                  key={f.name}
                  onClick={() => setFilter(f.value)}
                  className={`flex flex-col items-center gap-2 transition-all ${filter === f.value ? 'scale-110' : 'opacity-60'}`}
                >
                  <div 
                    className="w-14 h-14 rounded-xl border-2 border-white/40 overflow-hidden bg-cover bg-center"
                    style={{ backgroundImage: `url(${mediaUrl})`, filter: f.value }}
                  />
                  <span className="text-[10px] font-bold text-white uppercase tracking-tighter">{f.name}</span>
                </button>
              ))}
            </div>

            {/* Edit Controls */}
            <div className="absolute bottom-12 left-0 right-0 px-8 flex items-center gap-4">
              <button 
                onClick={() => setStep('capture')}
                className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button 
                onClick={() => setIsCloseFriendsOnly(!isCloseFriendsOnly)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-2xl font-bold transition-all ${isCloseFriendsOnly ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-white/10 backdrop-blur-md text-white'}`}
              >
                <Star className={`w-5 h-5 ${isCloseFriendsOnly ? 'fill-white' : ''}`} />
                Close Friends
              </button>

              <button 
                onClick={handleShare}
                className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-transform"
              >
                Share <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full bg-surface flex flex-col">
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
              <button onClick={() => setStep('edit')} className="p-2 text-on-surface"><ChevronLeft /></button>
              <h3 className="text-xl font-black text-on-surface">Story Settings</h3>
              <div className="w-10" />
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section className="space-y-4">
                <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Close Friends</h4>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-container text-on-surface font-semibold outline-none"
                  />
                </div>
                <div className="space-y-2">
                  {filteredUsers.map(user => {
                    const isCloseFriend = currentUser?.closeFriends?.includes(user.id);
                    return (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                          <div>
                            <p className="font-bold text-on-surface text-sm">{user.name}</p>
                            <p className="text-xs text-on-surface-variant">@{user.username}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleCloseFriend(user.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isCloseFriend ? 'bg-green-500 border-green-500' : 'border-outline-variant'}`}
                        >
                          {isCloseFriend && <Check className="w-4 h-4 text-white" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Privacy</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low">
                    <div>
                      <p className="font-bold text-on-surface">Hide story from</p>
                      <p className="text-xs text-on-surface-variant">0 people</p>
                    </div>
                    <ChevronLeft className="w-5 h-5 rotate-180 text-on-surface-variant" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low">
                    <div>
                      <p className="font-bold text-on-surface">Allow message replies</p>
                      <p className="text-xs text-on-surface-variant">Everyone</p>
                    </div>
                    <ChevronLeft className="w-5 h-5 rotate-180 text-on-surface-variant" />
                  </div>
                </div>
              </section>
            </div>
            
            <div className="p-6">
              <button 
                onClick={() => setStep('edit')}
                className="w-full py-4 bg-primary text-on-primary rounded-2xl font-black shadow-xl"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Text Input Modal */}
      <AnimatePresence>
        {isAddingText && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8"
          >
            <input 
              autoFocus
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder="Type something..."
              className="w-full bg-transparent text-white text-4xl font-black text-center outline-none mb-12"
            />
            <div className="flex gap-4">
              <button 
                onClick={() => setIsAddingText(false)}
                className="px-8 py-4 rounded-2xl font-bold text-white/60"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddText}
                className="px-12 py-4 rounded-2xl bg-white text-black font-black shadow-xl"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stickers Modal */}
      <AnimatePresence>
        {showStickers && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            className="fixed inset-0 z-[700] bg-black/90 backdrop-blur-xl flex flex-col p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-white">Stickers</h3>
              <button onClick={() => setShowStickers(false)} className="text-white/60"><X /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button 
                onClick={() => handleAddSticker('location', 'San Francisco, CA')}
                className="bg-blue-500/20 border border-blue-500/40 p-6 rounded-3xl flex flex-col items-center gap-3 text-blue-400"
              >
                <MapPin className="w-8 h-8" />
                <span className="font-bold">Location</span>
              </button>
              <button 
                onClick={() => handleAddSticker('mention', 'alex_rivero')}
                className="bg-white/10 border border-white/20 p-6 rounded-3xl flex flex-col items-center gap-3 text-white"
              >
                <AtSign className="w-8 h-8" />
                <span className="font-bold">Mention</span>
              </button>
              <button 
                onClick={() => handleAddSticker('hashtag', 'aqualyn')}
                className="bg-pink-500/20 border border-pink-500/40 p-6 rounded-3xl flex flex-col items-center gap-3 text-pink-400"
              >
                <Hash className="w-8 h-8" />
                <span className="font-bold">Hashtag</span>
              </button>
              <button 
                className="bg-yellow-500/20 border border-yellow-500/40 p-6 rounded-3xl flex flex-col items-center gap-3 text-yellow-400"
              >
                <Heart className="w-8 h-8" />
                <span className="font-bold">Music</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <p className="text-white/40 font-bold text-xs uppercase tracking-widest mb-4">Emojis</p>
              <div className="grid grid-cols-4 gap-6">
                {['❤️', '🔥', '😂', '🙌', '✨', '🚀', '🌈', '🍕', '🌊', '🎸', '🎮', '📸'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => handleAddSticker('emoji', emoji)}
                    className="text-4xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
