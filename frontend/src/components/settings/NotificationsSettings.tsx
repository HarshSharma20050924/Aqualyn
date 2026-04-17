import React from 'react';
import { Bell } from 'lucide-react';

export default function NotificationsSettings() {
  return (
    <section className="space-y-4">
      <h3 className="font-headline font-bold text-lg text-on-surface px-2 flex items-center gap-2">
        <Bell className="w-5 h-5 text-amber-500" />
        Notifications
      </h3>
      <div className="glass-card rounded-[2rem] overflow-hidden border border-white/40 shadow-sm">
        {[
          { title: 'Push Alerts', desc: 'Receive notifications for new messages' },
          { title: 'Message Previews', desc: 'Show message text in notifications' },
          { title: 'Sound Effects', desc: 'Play liquid sounds on send/receive' }
        ].map((item, i) => (
          <div key={i} className={`p-5 flex items-center justify-between hover:bg-white/40 transition-colors ${i !== 2 ? 'border-b border-white/20' : ''}`}>
            <div>
              <h4 className="font-semibold text-on-surface">{item.title}</h4>
              <p className="text-sm text-on-surface-variant">{item.desc}</p>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${i !== 1 ? 'bg-secondary' : 'bg-surface-container-highest'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${i !== 1 ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
