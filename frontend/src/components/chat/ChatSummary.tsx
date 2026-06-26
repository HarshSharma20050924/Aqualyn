import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, AlertCircle, CheckSquare, Smile, MessageSquare } from 'lucide-react';
import { AIService } from '../../services/ai.service';
import BubbleLoader from '../ui/BubbleLoader';

interface ChatSummaryProps {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSummary({ chatId, isOpen, onClose }: ChatSummaryProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    summary: string;
    actionItems: string[];
    sentiment: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !chatId) return;

    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await AIService.getChatSummary(chatId);
        setData(result);
      } catch (err) {
        console.error('Failed to get chat summary:', err);
        setError('Unable to summarize this chat. Please ensure you have exchanged messages first.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [chatId, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg glass-card rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-white/20 z-10 max-h-[85vh] flex flex-col"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Sparkles className="w-5 h-5 fill-cyan-600/20" />
              </div>
              <div>
                <h3 className="text-xl font-headline font-black text-on-surface">Chat Intelligence</h3>
                <p className="text-xs text-on-surface-variant">Powered by Qwen AI</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <BubbleLoader />
                <p className="text-sm font-medium text-on-surface-variant/80 animate-pulse">Analyzing conversation dynamics...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-500">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            ) : data ? (
              <>
                {/* Executive Summary */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Conversation Summary
                  </h4>
                  <p className="text-sm text-on-surface/90 leading-relaxed bg-white/40 dark:bg-black/20 p-4 rounded-2xl border border-white/20 dark:border-white/5 shadow-sm">
                    {data.summary || 'No summary available.'}
                  </p>
                </div>

                {/* Sentiment Analysis */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5" />
                    Overall Vibe & Sentiment
                  </h4>
                  <div className="flex items-center gap-3 bg-white/40 dark:bg-black/20 p-4 rounded-2xl border border-white/20 dark:border-white/5 shadow-sm">
                    <span className="text-2xl">
                      {data.sentiment?.toLowerCase().includes('positive') ? '✨' : 
                       data.sentiment?.toLowerCase().includes('negative') ? '💬' : '⚖️'}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-on-surface capitalize">{data.sentiment || 'Neutral'}</p>
                      <p className="text-xs text-on-surface-variant">Reflected sentiment of recent interactions</p>
                    </div>
                  </div>
                </div>

                {/* Action Items */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" />
                    Extracted Tasks & Action Items
                  </h4>
                  {data.actionItems && data.actionItems.length > 0 ? (
                    <div className="space-y-2">
                      {data.actionItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex gap-3 items-start bg-white/40 dark:bg-black/20 p-3.5 rounded-xl border border-white/10 dark:border-white/5 shadow-sm"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 rounded border-white/40 text-cyan-600 focus:ring-cyan-500/20"
                          />
                          <span className="text-sm text-on-surface/90">{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant/80 italic p-4 text-center bg-white/20 dark:bg-black/10 rounded-2xl border border-white/10">
                      No specific actions or commitments identified.
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md active:scale-95 transition-all"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
