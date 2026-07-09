import { useEffect, useState } from 'react';
import { X, MessageSquare, Loader2, Mail, Phone, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../config/api';
import type { User } from '../types';

const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` });

interface Props {
  user: User | null;
  onClose: () => void;
}

export default function UserProfileDrawer({ user, onClose }: Props) {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setChats([]);
    setLoading(true);
    axios
      .get(ADMIN_ENDPOINTS.USER_CHATS(user.id), { headers: getAuthHeaders() })
      .then(r => setChats(r.data.chats || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <AnimatePresence>
      {user && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-slate-50 dark:bg-[#0d1117] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="font-black text-on-surface text-base">User Profile</h2>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Avatar + name */}
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || user.email}`}
                  alt={user.name || 'User'}
                  className="w-20 h-20 rounded-2xl border-2 border-primary/20 object-cover bg-white"
                />
                <div>
                  <h3 className="font-black text-on-surface text-lg">{user.name || 'Unknown'}</h3>
                  <p className="text-xs text-on-surface-variant font-mono">@{user.username || user.id.substring(0, 10)}</p>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                  user.role === 'admin'
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-slate-500/10 text-on-surface-variant border-slate-500/20'
                }`}>
                  {user.role || 'user'}
                </span>
              </div>

              {/* Details */}
              <div className="glass-card rounded-2xl border border-white/30 dark:border-white/5 p-4 space-y-3">
                {user.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-on-surface-variant shrink-0" />
                    <span className="text-sm text-on-surface truncate">{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-on-surface-variant shrink-0" />
                    <span className="text-sm text-on-surface">{user.phone}</span>
                  </div>
                )}
                {user.bio && (
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-on-surface-variant shrink-0 mt-0.5" />
                    <span className="text-sm text-on-surface-variant leading-relaxed">{user.bio}</span>
                  </div>
                )}
              </div>

              {/* Chats */}
              <div>
                <h4 className="text-xs font-black text-on-surface uppercase tracking-widest mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Conversations ({chats.length})
                </h4>

                {loading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : chats.length === 0 ? (
                  <p className="text-xs text-on-surface-variant text-center py-6">No chats found</p>
                ) : (
                  <div className="space-y-2">
                    {chats.map((c: any) => (
                      <div key={c.id} className="glass-card rounded-xl p-3 border border-white/30 dark:border-white/5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-on-surface truncate">{c.name || 'Direct Chat'}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono truncate">{c.id}</p>
                          {c.messages?.[0]?.text && (
                            <p className="text-[10px] text-on-surface-variant truncate italic mt-0.5">"{c.messages[0].text}"</p>
                          )}
                        </div>
                        {c.isGroup && (
                          <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                            Group
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
