import React from 'react';
import { motion } from 'motion/react';
import { Heart, MessageCircle, UserPlus, ArrowLeft, Check, X, Bell } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const { notifications, acceptFollowRequest, rejectFollowRequest } = useAppContext();

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
      case 'story_like':
        return <Heart className="w-5 h-5 text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500 fill-blue-500" />;
      case 'follow':
      case 'follow_request':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };

  const getMessage = (notification: any) => {
    switch (notification.type) {
      case 'like':
        return 'liked your post.';
      case 'story_like':
        return 'liked your story.';
      case 'comment':
        return `commented: "${notification.text}"`;
      case 'follow':
        return 'started following you.';
      case 'follow_request':
        return 'requested to follow you.';
      default:
        return '';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-surface min-h-screen pb-24">
      <header className="fixed top-0 w-full z-50 bg-slate-50/70 backdrop-blur-xl border-b border-white/15 shadow-[0_8px_32px_0_rgba(0,87,189,0.06)] h-16 flex items-center px-4 gap-4">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/40 transition-colors">
          <ArrowLeft className="w-6 h-6 text-on-surface" />
        </button>
        <h1 className="text-xl font-bold font-headline text-on-surface">Activity</h1>
      </header>

      <main className="pt-20 px-4 max-w-2xl mx-auto space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No recent activity</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className={`flex items-start gap-4 p-4 rounded-2xl transition-colors ${notification.isRead ? 'bg-transparent' : 'bg-primary-container/30'}`}>
              <div className="relative">
                <img src={notification.actor?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${notification.actor?.displayName}`} alt={notification.actor?.displayName} className="w-12 h-12 rounded-full object-cover" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-surface rounded-full flex items-center justify-center shadow-sm">
                  {getIcon(notification.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-on-surface">
                  <span className="font-bold">{notification.actor?.displayName || notification.actor?.username}</span> {notification.text || getMessage(notification)}
                </p>
                <div className="text-xs text-on-surface-variant mt-1 block">
                    {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                
                {notification.type === 'follow_request' && (
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => acceptFollowRequest(notification.actorId)}
                      className="flex-1 py-1.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={() => rejectFollowRequest(notification.actorId)}
                      className="flex-1 py-1.5 bg-surface-container-highest text-on-surface rounded-lg text-sm font-semibold hover:bg-surface-container-highest/80 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </main>
    </motion.div>
  );
}
