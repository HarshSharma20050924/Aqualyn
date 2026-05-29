# components/social/UserListModal.tsx

## File Location
`frontend/src/components/social/UserListModal.tsx`

## Purpose
See implementation below for details.

## Implementation

```typescript
import React from 'react';
import { motion } from 'motion/react';
import { X, UserPlus, Search } from 'lucide-react';
import { User } from '../../types';

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: User[];
  isLoading: boolean;
  onUserClick?: (user: User) => void;
}

export default function UserListModal({ isOpen, onClose, title, users, isLoading, onUserClick }: UserListModalProps) {
  const [search, setSearch] = React.useState('');
  
  const filteredUsers = React.useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u => 
      u.displayName?.toLowerCase().includes(q) || 
      u.username?.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: isOpen ? 0 : "100%" }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white w-full max-w-md h-[85vh] sm:h-[600px] rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex flex-col">
            <h3 className="text-xl font-black text-on-surface capitalize tracking-tight">{title}</h3>
            <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest">{users.length} Users</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-90">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-50/50">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 ring-primary/20 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={`Search ${title}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-400"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
             <div className="py-20 flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Identity</p>
             </div>
          ) : filteredUsers.length > 0 ? (
             filteredUsers.map(u => (
                <div 
                  key={u.id} 
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer group active:scale-[0.98]"
                  onClick={() => {
                        if (onUserClick) onUserClick(u);
                        onClose();
                  }}
                >
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm font-bold text-white bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.displayName?.charAt(0).toUpperCase()}
                     </div>
                     <div className="min-w-0">
                        <p className="font-bold text-on-surface truncate">{u.displayName || u.username}</p>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1">
                            @{u.username}
                        </p>
                     </div>
                  </div>
                  <button className="px-5 py-2 rounded-full bg-slate-100 text-on-surface font-black text-[10px] uppercase tracking-wider hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95">
                     Profile
                  </button>
                </div>
             ))
          ) : (
             <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                   <UserPlus className="w-8 h-8 text-slate-200" />
                </div>
                <div>
                   <p className="text-on-surface font-black text-lg">No Results</p>
                   <p className="text-xs text-on-surface-variant max-w-[200px] mx-auto">We couldn't find anyone matching your search in this list.</p>
                </div>
             </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
```
