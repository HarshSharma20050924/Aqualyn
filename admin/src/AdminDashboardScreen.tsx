import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Users, MessageSquare, FileText, Sliders, AlertTriangle, ArrowLeft, BarChart2 } from 'lucide-react';
import axios from 'axios';
import type { Chat, Post } from './types';
import { ADMIN_ENDPOINTS } from './config/api';
import OverviewTab from './components/OverviewTab';
import ObservabilityTab from './components/ObservabilityTab';
import UsersTab from './components/UsersTab';
import ChatsTab from './components/ChatsTab';
import PostsTab from './components/PostsTab';

const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` });

type TabId = 'overview' | 'observability' | 'users' | 'chats' | 'posts';

export default function AdminDashboardScreen({ onBack }: { onBack: () => void }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'user' | 'chat' | 'post'; id: string; name: string } | null>(null);

  const fetchBaseData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [statsRes, chatsRes, postsRes] = await Promise.all([
        axios.get(ADMIN_ENDPOINTS.STATS, { headers }),
        axios.get(`${ADMIN_ENDPOINTS.CHATS}?limit=100`, { headers }),
        axios.get(`${ADMIN_ENDPOINTS.POSTS}?limit=100`, { headers }),
      ]);
      setStats(statsRes.data);
      setChats(chatsRes.data.chats || []);
      setPosts(postsRes.data.posts || []);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('adminToken');
        onBack();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBaseData(); }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const headers = getAuthHeaders();
    try {
      if (deleteConfirm.type === 'chat') {
        await axios.delete(ADMIN_ENDPOINTS.DELETE_CHAT(deleteConfirm.id), { headers });
        setChats(p => p.filter(c => c.id !== deleteConfirm.id));
      } else if (deleteConfirm.type === 'post') {
        await axios.delete(ADMIN_ENDPOINTS.DELETE_POST(deleteConfirm.id), { headers });
        setPosts(p => p.filter(x => x.id !== deleteConfirm.id));
      }
    } catch (e) {
      alert('Delete failed');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'overview', label: 'Dashboard', icon: Sliders },
    { id: 'observability', label: 'Metrics', icon: BarChart2 },
    { id: 'users', label: `Users`, icon: Users },
    { id: 'chats', label: `Chats (${chats.length})`, icon: MessageSquare },
    { id: 'posts', label: `Posts (${posts.length})`, icon: FileText },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-primary font-black text-lg animate-pulse">Loading console...</div>
    </div>
  );

  return (
    <div className="liquid-bg min-h-screen text-on-surface font-body overflow-x-hidden flex flex-col">
      <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-50/70 dark:bg-[#0a0f12]/70 backdrop-blur-xl border-b border-white/15 dark:border-white/5 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-on-surface-variant hover:bg-white/40 dark:hover:bg-white/10 p-2 rounded-full transition-colors active:scale-95">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-black font-headline tracking-tight flex items-center gap-2">
              System Admin
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-widest border border-primary/20">Live Console</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-white/10 dark:border-white/5 bg-white/25 dark:bg-[#0a0f12]/20 px-4 pt-2 overflow-x-auto scrollbar-hide shrink-0">
        <div className="flex gap-1.5 md:gap-3 max-w-7xl mx-auto w-full">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 font-headline text-sm font-black flex items-center gap-2 border-b-2 transition-all capitalize whitespace-nowrap rounded-t-xl ${
                  active ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-on-surface-variant'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6 pb-24">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            usersCount={stats.totalUsers ?? 0}
            chatsCount={chats.length}
            postsCount={posts.length}
            onRefresh={fetchBaseData}
          />
        )}
        {activeTab === 'observability' && <ObservabilityTab />}
        {activeTab === 'users' && (
          <UsersTab
            onDeleteRequest={(type, id, name) => setDeleteConfirm({ type, id, name })}
          />
        )}
        {activeTab === 'chats' && (
          <ChatsTab
            chats={chats}
            onDeleteRequest={(type, id, name) => setDeleteConfirm({ type, id, name })}
          />
        )}
        {activeTab === 'posts' && (
          <PostsTab
            posts={posts}
            onDeleteRequest={(type, id, name) => setDeleteConfirm({ type, id, name })}
          />
        )}
      </main>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="glass-card rounded-[2.5rem] border border-white/50 w-full max-w-sm p-6 relative z-10 bg-white/95 dark:bg-[#0d1117]/95 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-500">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-headline font-black text-on-surface text-base">Purge Data?</h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Permanently delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 border border-white/30 text-on-surface-variant font-bold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition-colors cursor-pointer border-0"
                >
                  Force Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
