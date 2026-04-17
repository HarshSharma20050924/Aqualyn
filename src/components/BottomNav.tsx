import React from 'react';
import { MessageCircle, Users, CircleDashed, Settings as SettingsIcon, Bell } from 'lucide-react';

export default function BottomNav({ currentScreen, onNavigate }: { currentScreen: string, onNavigate: (s: string) => void }) {
  const navItems = [
    { id: 'chats', icon: MessageCircle, label: 'Chats' },
    { id: 'contacts', icon: Users, label: 'Contacts' },
    { id: 'discovery', icon: CircleDashed, label: 'Feed' },
    { id: 'notifications', icon: Bell, label: 'Activity' },
    { id: 'profile', icon: Users, label: 'Profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full h-20 bg-white/80 backdrop-blur-2xl flex justify-around items-center px-4 pb-2 border-t border-white/20 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] rounded-t-[2rem] z-50">
      {navItems.map((item) => {
        const isActive = currentScreen === item.id || (item.id === 'settings' && currentScreen === 'profile');
        const Icon = item.icon;
        return (
          <div 
            key={item.id} 
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 active:scale-90 ${isActive ? 'text-cyan-600 scale-110' : 'text-slate-400 opacity-70 hover:opacity-100'}`}
          >
            <Icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-cyan-600/20' : ''}`} />
            <span className="font-body text-[11px] font-medium tracking-wide">{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
