import { X, Mail, Phone, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User } from '../types';



interface Props {
  user: User | null;
  onClose: () => void;
}

export default function UserProfileDrawer({ user, onClose }: Props) {

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


            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
