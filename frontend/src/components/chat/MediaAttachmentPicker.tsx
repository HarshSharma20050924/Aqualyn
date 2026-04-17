import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, FileText, MapPin, Camera, Video, Wallet, Clock } from 'lucide-react';

interface MediaAttachmentPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
}

export default function MediaAttachmentPicker({ isOpen, onClose, onSelect }: MediaAttachmentPickerProps) {
  const options = [
    { id: 'camera', icon: Camera, label: 'Camera', color: 'bg-blue-500', iconColor: 'text-white' },
    { id: 'photo', icon: ImageIcon, label: 'Photo & Video', color: 'bg-purple-500', iconColor: 'text-white' },
    { id: 'document', icon: FileText, label: 'Document', color: 'bg-indigo-500', iconColor: 'text-white' },
    { id: 'location', icon: MapPin, label: 'Location', color: 'bg-emerald-500', iconColor: 'text-white' },
    { id: 'wallet', icon: Wallet, label: 'Send Money', color: 'bg-green-500', iconColor: 'text-white' },
    { id: 'schedule', icon: Clock, label: 'Schedule', color: 'bg-orange-500', iconColor: 'text-white' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 left-4 z-[61] glass-card rounded-3xl p-4 shadow-2xl border border-white/20 w-72"
          >
            <div className="grid grid-cols-3 gap-4">
              {options.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      onSelect(option.id);
                      onClose();
                    }}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${option.iconColor}`} />
                    </div>
                    <span className="text-[10px] font-medium text-on-surface-variant group-hover:text-on-surface transition-colors text-center leading-tight">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
