import { Trash2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Chat } from '../types';

interface Props {
  chats: Chat[];
  onDeleteRequest: (type: 'chat', id: string, name: string) => void;
}

export default function ChatsTab({ chats, onDeleteRequest }: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black font-headline text-on-surface">
          Chat Sessions <span className="text-primary text-base">({chats.length})</span>
        </h2>
        {/* E2E notice */}
        <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant font-bold px-3 py-1.5 rounded-full bg-primary/5 border border-primary/15">
          <Lock className="w-3 h-3 text-primary" />
          E2E Encrypted — content not accessible
        </div>
      </div>

      <div className="glass-card rounded-[2rem] border border-white/40 dark:border-white/5 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-200/50 dark:bg-[#1a1f23]/40 border-b border-white/10">
              <th className="p-5 text-xs font-black uppercase tracking-wider text-on-surface-variant">Chat ID</th>
              <th className="p-5 text-xs font-black uppercase tracking-wider text-on-surface-variant">Type</th>
              <th className="p-5 text-xs font-black uppercase tracking-wider text-on-surface-variant">Participants</th>
              <th className="p-5 text-xs font-black uppercase tracking-wider text-on-surface-variant">Msg Count</th>
              <th className="p-5 text-xs font-black uppercase tracking-wider text-on-surface-variant text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {chats.map(chat => (
                <motion.tr
                  key={chat.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-white/10 dark:border-white/5 hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="p-5">
                    <span className="text-[11px] text-on-surface-variant font-mono">{chat.id.substring(0, 20)}…</span>
                  </td>
                  <td className="p-5">
                    {(chat as any).isGroup ? (
                      <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-full font-bold">Group</span>
                    ) : (
                      <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full font-bold">Direct</span>
                    )}
                  </td>
                  <td className="p-5">
                    <span className="text-xs text-on-surface-variant">
                      {(chat as any)._count?.participants ?? chat.participants?.length ?? '—'}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <Lock className="w-3 h-3 text-primary/50" />
                      {(chat as any)._count?.messages ?? '—'}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <button
                      onClick={() => onDeleteRequest('chat', chat.id, `Chat ${chat.id.substring(0, 8)}`)}
                      title="Delete entire chat (abuse/CSAM reports only)"
                      className="p-2 border border-red-500/30 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-400 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {chats.length === 0 && (
          <p className="text-center text-on-surface-variant text-sm py-10">No chats found</p>
        )}
      </div>
    </div>
  );
}
