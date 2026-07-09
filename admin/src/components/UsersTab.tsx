import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Trash2, Eye, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import type { User } from '../types';
import { ADMIN_ENDPOINTS } from '../config/api';
import UserProfileDrawer from './UserProfileDrawer';

const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` });
const PAGE_SIZE = 20;

interface Props {
  onDeleteRequest: (type: 'user', id: string, name: string) => void;
}

export default function UsersTab({ onDeleteRequest }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadUsers = useCallback(async (p: number, append: boolean) => {
    setLoadingMore(true);
    try {
      const res = await axios.get(`${ADMIN_ENDPOINTS.USERS}?page=${p}&limit=${PAGE_SIZE}`, { headers: getAuthHeaders() });
      const { users: newUsers = [], pagination } = res.data;
      setUsers(prev => append ? [...prev, ...newUsers] : newUsers);
      setHasMore(p < (pagination?.pages ?? 1));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadUsers(1, false); }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore) {
        const next = page + 1;
        setPage(next);
        loadUsers(next, true);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, page, loadUsers]);

  const filtered = useMemo(() =>
    users.filter(u =>
      (u.name || u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(search.toLowerCase())
    ),
    [users, search]
  );

  return (
    <>
      <UserProfileDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />

      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-black font-headline text-on-surface">
            Member Profiles <span className="text-primary text-base">({users.length})</span>
          </h2>
          <div className="relative flex-1 sm:w-64 glass-card rounded-full flex items-center px-4 py-2 border border-white/40 dark:border-white/5">
            <Search className="w-4 h-4 text-on-surface-variant shrink-0" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="ml-2 w-full bg-transparent text-sm border-0 outline-none placeholder:text-on-surface-variant/60"
            />
          </div>
        </div>

        <div className="glass-card rounded-[2rem] border border-white/40 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-200/50 dark:bg-[#1a1f23]/40 border-b border-white/10">
                  <th className="p-4 text-xs font-black uppercase tracking-wider text-on-surface-variant">Profile</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider text-on-surface-variant">Email</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider text-on-surface-variant">Role</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider text-on-surface-variant text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.map(user => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      layout
                      className="border-b border-white/10 dark:border-white/5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || user.email}`}
                            alt={user.name || 'User'}
                            className="w-9 h-9 rounded-xl border border-white/20 object-cover bg-white shrink-0"
                          />
                          <div>
                            <span className="font-black text-on-surface block truncate max-w-[130px] text-sm">{user.name || 'Unknown'}</span>
                            <span className="text-[10px] text-on-surface-variant font-mono">@{user.username || user.id.substring(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-on-surface max-w-[160px] truncate block">{user.email || '—'}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-500/10 text-on-surface-variant border-slate-500/20">
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-1.5 bg-white/50 border border-white/30 hover:bg-primary hover:text-white hover:border-primary rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRequest('user', user.id, user.name || user.email || 'User')}
                            className="p-1.5 bg-white/50 border border-white/30 hover:bg-red-600 hover:text-white hover:border-red-600 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Sentinel for infinite scroll */}
          <div ref={loaderRef} className="flex items-center justify-center py-4">
            {loadingMore && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
            {!hasMore && users.length > 0 && (
              <p className="text-xs text-on-surface-variant">All {users.length} users loaded</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
