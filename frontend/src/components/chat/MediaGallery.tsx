import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
}

interface MediaGalleryProps {
  items: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}

export default function MediaGallery({ items, initialIndex, onClose }: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const currentItem = items[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col"
        onClick={onClose}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="text-white font-medium">
            {currentIndex + 1} / {items.length}
          </div>
          <div className="flex items-center gap-4 text-white">
            <button className="p-2 hover:bg-white/20 rounded-full transition-colors" onClick={(e) => e.stopPropagation()}>
              <Download className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-white/20 rounded-full transition-colors" onClick={onClose}>
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {currentItem.type === 'image' ? (
                <img
                  src={currentItem.url}
                  alt="Gallery item"
                  className="max-w-full max-h-full object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <video
                  src={currentItem.url}
                  controls
                  className="max-w-full max-h-full rounded-lg"
                  autoPlay
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          {currentIndex > 0 && (
            <button
              className="absolute left-4 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              onClick={handlePrev}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {currentIndex < items.length - 1 && (
            <button
              className="absolute right-4 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              onClick={handleNext}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
