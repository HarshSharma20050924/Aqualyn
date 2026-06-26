import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AIService } from '../../services/ai.service';
import { motion, AnimatePresence } from 'motion/react';

interface SmartReplyProps {
  chatId: string;
  lastMessageText?: string;
  onSelect: (text: string) => void;
}

export default function SmartReply({ chatId, lastMessageText, onSelect }: SmartReplyProps) {
  const [replies, setReplies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!chatId) return;

    const fetchReplies = async () => {
      setIsLoading(true);
      try {
        const fetched = await AIService.getSmartReplies(chatId);
        setReplies(fetched);
      } catch (err) {
        console.error('Failed to load smart replies:', err);
        setReplies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReplies();
  }, [chatId, lastMessageText]);

  if (isLoading) {
    return (
      <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide items-center justify-start opacity-70">
        <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-600 dark:text-cyan-400" />
        <span className="text-xs text-on-surface-variant/80 font-medium">Generating replies...</span>
      </div>
    );
  }

  if (replies.length === 0) return null;

  return (
    <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide items-center justify-start w-full">
      <div className="flex items-center gap-1 shrink-0 text-cyan-600 dark:text-cyan-400">
        <Sparkles className="w-4 h-4 fill-cyan-600/20" />
        <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Lyn:</span>
      </div>
      <AnimatePresence>
        {replies.map((reply, i) => (
          <motion.button
            key={`${reply}-${i}`}
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            onClick={() => onSelect(reply)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-white/60 dark:bg-black/40 text-on-surface hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 border border-white/40 dark:border-white/5 hover:border-cyan-500/30 transition-all duration-200 shadow-sm active:scale-95 flex items-center gap-1"
          >
            {reply}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
