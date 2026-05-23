import React, { useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function NotificationsSettings() {
  const { currentUser, updateSettings } = useAppContext();
  const [loading, setLoading] = useState<string | null>(null);

  const settings = currentUser?.settings?.notifications || {
    pushAlerts: true,
    messagePreviews: true,
    soundEffects: true
  };

  const toggle = async (key: string) => {
    setLoading(key);
    try {
      const newVal = !settings[key];
      await updateSettings({
        notifications: {
          ...settings,
          [key]: newVal
        }
      });
    } finally {
      setLoading(null);
    }
  };

  const items = [
    { key: 'pushAlerts', title: 'Push Alerts', desc: 'Receive notifications for new messages' },
    { key: 'messagePreviews', title: 'Message Previews', desc: 'Show message text in notifications' },
    { key: 'soundEffects', title: 'Sound Effects', desc: 'Play liquid sounds on send/receive' }
  ];

  return (
    <section className="space-y-4">
      <h3 className="font-headline font-bold text-lg text-on-surface px-2 flex items-center gap-2">
        <Bell className="w-5 h-5 text-amber-500" />
        Notifications
      </h3>
      <div className="glass-card rounded-[2rem] overflow-hidden border border-white/40 shadow-sm">
        {items.map((item, i) => (
          <div key={item.key} className={`p-5 flex items-center justify-between hover:bg-white/40 transition-colors ${i !== items.length - 1 ? 'border-b border-white/20' : ''}`}>
            <div>
              <h4 className="font-semibold text-on-surface">{item.title}</h4>
              <p className="text-sm text-on-surface-variant">{item.desc}</p>
            </div>
            <button 
              disabled={loading === item.key}
              onClick={() => toggle(item.key)}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative ${settings[item.key] ? 'bg-secondary' : 'bg-surface-container-highest'}`}
            >
              {loading === item.key ? (
                <Loader2 className="w-4 h-4 text-white animate-spin absolute left-1" />
              ) : (
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings[item.key] ? 'translate-x-6' : 'translate-x-0'}`}></div>
              )}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
