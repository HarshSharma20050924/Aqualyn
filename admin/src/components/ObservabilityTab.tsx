import { useEffect, useState } from 'react';
import { TrendingUp, MessageSquare, Users, FileText, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../config/api';

const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` });

export default function ObservabilityTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(ADMIN_ENDPOINTS.OBSERVABILITY, { headers: getAuthHeaders() });
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  if (!data) return <div className="text-center py-20 text-on-surface-variant">Failed to load metrics.</div>;

  const { growthSeries = [], summary = {}, recentActivity = {} } = data;
  const maxMessages = Math.max(...growthSeries.map((d: any) => d.messages), 1);
  const maxUsers = Math.max(...growthSeries.map((d: any) => d.users), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'New Users (7d)', value: summary.newUsers ?? 0, color: 'text-blue-400' },
          { icon: MessageSquare, label: 'Messages (7d)', value: summary.messages ?? 0, color: 'text-purple-400' },
          { icon: FileText, label: 'Posts (7d)', value: summary.posts ?? 0, color: 'text-orange-400' },
          { icon: TrendingUp, label: 'Avg Msgs/Day', value: summary.avgMessagesPerDay ?? 0, color: 'text-green-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-card rounded-[2rem] p-5 border border-white/40 dark:border-white/5 shadow-sm">
            <Icon className={`w-5 h-5 mb-2 ${color}`} />
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{label}</p>
            <h3 className="text-2xl font-black font-headline mt-1 text-on-surface">{value}</h3>
          </div>
        ))}
      </div>

      {summary.peakDay && (
        <div className="glass-card rounded-2xl px-5 py-3 border border-white/30 dark:border-white/5 text-sm text-on-surface-variant">
          📈 Peak day: <span className="font-black text-on-surface">{summary.peakDay}</span> with{' '}
          <span className="font-black text-primary">{summary.peakMessages}</span> messages
        </div>
      )}

      {/* Message bar chart */}
      <div className="glass-card rounded-[2.5rem] p-6 border border-white/40 dark:border-white/5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Messages per Day</h3>
          <button onClick={load} className="p-2 rounded-xl hover:bg-white/20 transition-colors">
            <RefreshCw className="w-4 h-4 text-on-surface-variant" />
          </button>
        </div>
        <div className="flex items-end gap-2 h-32">
          {growthSeries.map((d: any) => {
            const pct = maxMessages > 0 ? (d.messages / maxMessages) * 100 : 0;
            return (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-[9px] text-primary font-black opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.messages}
                </span>
                <div className="w-full rounded-t-lg bg-primary/80 transition-all duration-500" style={{ height: `${Math.max(pct, 3)}%` }} />
                <span className="text-[8px] text-on-surface-variant font-medium text-center leading-tight whitespace-nowrap">
                  {d.label.split(',')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* User signups bar chart */}
      <div className="glass-card rounded-[2.5rem] p-6 border border-white/40 dark:border-white/5 shadow-sm">
        <h3 className="text-sm font-black text-on-surface uppercase tracking-widest mb-5">New Signups per Day</h3>
        <div className="flex items-end gap-2 h-28">
          {growthSeries.map((d: any) => {
            const pct = maxUsers > 0 ? (d.users / maxUsers) * 100 : 0;
            return (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-[9px] text-green-400 font-black opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.users}
                </span>
                <div className="w-full rounded-t-lg bg-green-500/70 transition-all duration-500" style={{ height: `${Math.max(pct, 3)}%` }} />
                <span className="text-[8px] text-on-surface-variant font-medium whitespace-nowrap">
                  {d.label.split(',')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent users */}
        <div className="glass-card rounded-[2rem] p-5 border border-white/40 dark:border-white/5 shadow-sm space-y-3">
          <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Recent Signups</h3>
          {(recentActivity.users || []).map((u: any) => (
            <div key={u.id} className="flex items-center gap-3">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${u.displayName || u.email}`}
                className="w-8 h-8 rounded-lg border border-white/20 bg-white"
                alt=""
              />
              <div className="min-w-0">
                <p className="text-xs font-black text-on-surface truncate">{u.displayName || 'Unknown'}</p>
                <p className="text-[10px] text-on-surface-variant truncate">{u.email}</p>
              </div>
              <span className="ml-auto text-[9px] text-on-surface-variant whitespace-nowrap">
                {new Date(u.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>

        {/* Recent messages — intentionally omitted: E2E encrypted */}
        <div className="glass-card rounded-[2rem] p-5 border border-white/40 dark:border-white/5 shadow-sm space-y-3">
          <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Messages</h3>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-black text-on-surface">End-to-End Encrypted</p>
              <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                Message content is encrypted on device and is never accessible by the server or admin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
