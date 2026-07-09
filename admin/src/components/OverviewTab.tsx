import { RefreshCw } from 'lucide-react';

interface Props {
  stats: any;
  usersCount: number;
  chatsCount: number;
  postsCount: number;
  onRefresh: () => void;
}

export default function OverviewTab({ stats, usersCount, chatsCount, postsCount, onRefresh }: Props) {
  const cards = [
    { label: 'Total Users', value: stats.totalUsers ?? usersCount, color: 'bg-blue-500/10' },
    { label: 'Active (24h)', value: stats.activeUsers ?? 0, color: 'bg-green-500/10' },
    { label: 'Global Chats', value: stats.totalChats ?? chatsCount, color: 'bg-purple-500/10' },
    { label: 'Total Msgs', value: stats.totalMessages ?? 0, color: 'bg-orange-500/10' },
    { label: 'Media Posts', value: stats.totalPosts ?? postsCount, color: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map((c) => (
          <div key={c.label} className={`glass-card rounded-[2rem] p-5 border border-white/40 dark:border-white/5 shadow-sm relative overflow-hidden group ${c.color}`}>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{c.label}</p>
            <h3 className="text-2xl sm:text-3xl font-black font-headline mt-1 text-on-surface">{c.value}</h3>
          </div>
        ))}
      </div>
      <div className="glass-card rounded-[2.5rem] p-6 border border-white/40 dark:border-white/5 shadow-sm">
        <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Diagnostics</h3>
        <button
          onClick={onRefresh}
          className="p-4 bg-gradient-to-r from-primary to-primary-container text-white text-sm font-black rounded-2xl shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 border-0 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>
    </div>
  );
}
