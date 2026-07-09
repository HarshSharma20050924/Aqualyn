import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, MessageCircle, Users, CircleDashed, Settings as SettingsIcon } from 'lucide-react';
import LoginScreen from './screens/LoginScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatDetailScreen from './screens/ChatDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import ContactsScreen from './screens/ContactsScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ContactProfileScreen from './screens/ContactProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import FeedScreen from './screens/FeedScreen';
import ExploreScreen from './screens/ExploreScreen';
import BottomNav from './components/BottomNav';
import ToastContainer from './components/ui/ToastContainer';
import AppLockScreen from './components/AppLockScreen';
import { useAppContext } from './context/AppContext';
import { CallOverlay } from './components/CallOverlay';
import { ENDPOINTS } from './config/api';
import { getRedirectResult } from 'firebase/auth';
import { auth } from './config/firebase';
import BubbleLoader from './components/ui/BubbleLoader';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  // Always tracks the screen we were on BEFORE the current one
  const [previousScreen, setPreviousScreen] = useState('chats');
  const { isAppLocked, appLockPin, theme, aquaIntensity, currentUser, isLoading } = useAppContext();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [leftWidth, setLeftWidth] = useState(420);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(420);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = leftWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [leftWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - dragStartX.current;
      const maxWidth = window.innerWidth - 72 - 260; // icon rail 72px + min right panel 260px
      const newWidth = Math.min(maxWidth, Math.max(80, dragStartWidth.current + delta));
      setLeftWidth(newWidth);
    };
    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // All navigation goes through here so previousScreen is always accurate
  const navigateTo = (screen: string) => {
    setPreviousScreen(currentScreen);
    setCurrentScreen(screen);
  };

  useEffect(() => {
    // Apply theme settings
    document.documentElement.style.setProperty('--color-secondary', theme.accentColor);
    document.documentElement.style.setProperty('--color-secondary-container', `${theme.accentColor}33`); // 20% opacity
    document.documentElement.style.setProperty('--color-on-secondary-container', theme.accentColor);
    document.documentElement.style.fontSize = `${theme.fontSize}px`;
    
    // Apply bubble style
    document.body.classList.remove('bubble-rounded', 'bubble-sharp', 'bubble-glass');
    document.body.classList.add(`bubble-${theme.bubbleStyle}`);

    // Apply aqua intensity
    document.documentElement.style.setProperty('--aqua-intensity', `${aquaIntensity}%`);
    
    // Apply dark mode
    if (theme.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, aquaIntensity]);
  
  // Google redirect result resolver (mobile / PWA)
  useEffect(() => {
    // Only resolve when coming back from a Google redirect round-trip
    // and the redirect hasn't already been processed.
    if (!window.location.hash.includes('googleauth')) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (cancelled || !result?.user) return;
        const idToken = await result.user.getIdToken();
        await fetch(ENDPOINTS.AUTH_SYNC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          credentials: 'include',
          body: JSON.stringify({}),
        });
        // clear hash without triggering navigation
        history.replaceState(null, '', window.location.pathname);
      } catch (err: any) {
        console.error('[Google Redirect] Failed:', err);
        history.replaceState(null, '', window.location.pathname);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  
  useEffect(() => {
    if (!isLoading) {
      if (currentUser?.id && currentScreen === 'login') {
        setCurrentScreen('chats');
      } else if (!currentUser?.id && currentScreen !== 'login') {
        setCurrentScreen('login');
      }
    }
  }, [currentUser, isLoading, currentScreen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
         <BubbleLoader width={120} height={120} />
         <h1 className="mt-8 text-2xl font-black font-headline text-secondary tracking-tighter">AQUALYN</h1>
      </div>
    );
  }

  const renderScreen = (screenId: string, sidebar = false) => {
    switch (screenId) {
      case 'login': return <LoginScreen key="login" onLogin={() => navigateTo('chats')} />;
      case 'feed': return <FeedScreen key="feed" onNavigate={navigateTo} />;
      case 'explore': return <ExploreScreen key="explore" onBack={() => navigateTo(previousScreen || 'chats')} onNavigate={navigateTo} />;
      case 'chats': return <ChatListScreen key="chats" onNavigate={navigateTo} compact={sidebar && leftWidth < 220} onExpand={() => setLeftWidth(380)} />;
      case 'chat-detail': return <ChatDetailScreen key="chat-detail" onBack={() => isDesktop ? navigateTo('chats') : navigateTo('chats')} onNavigate={navigateTo} />;
      case 'profile': return <ProfileScreen key="profile" onNavigate={navigateTo} isSidebar={sidebar} />;
      case 'settings': return <SettingsScreen key="settings" onBack={() => navigateTo('profile')} onNavigate={navigateTo} />;
      case 'contacts': return <ContactsScreen key="contacts" onNavigate={navigateTo} />;
      case 'edit-profile': return <EditProfileScreen key="edit-profile" onBack={() => navigateTo('profile')} />;
      case 'contact-profile': return <ContactProfileScreen key="contact-profile" onBack={() => setCurrentScreen(previousScreen)} onNavigate={navigateTo} />;
      case 'notifications': return <NotificationsScreen key="notifications" onBack={() => navigateTo('feed')} />;
      default: return null;
    }
  };

  const renderMobileLayout = () => (
    <>
      <AnimatePresence mode="wait">
        {renderScreen(currentScreen)}
      </AnimatePresence>
      {currentScreen !== 'login' && currentScreen !== 'chat-detail' && currentScreen !== 'contact-profile' && currentScreen !== 'edit-profile' && currentScreen !== 'notifications' && (
        <BottomNav currentScreen={currentScreen} onNavigate={navigateTo} />
      )}
    </>
  );

  const renderDesktopLayout = () => {
    if (currentScreen === 'login') return renderScreen('login');

    let leftScreen = 'chats';
    let rightScreen = null;

    if (['chats', 'feed', 'explore', 'contacts', 'profile'].includes(currentScreen)) {
      leftScreen = currentScreen;
      rightScreen = null;
    } else if (currentScreen === 'chat-detail') {
      leftScreen = ['chats', 'feed', 'explore', 'contacts', 'profile'].includes(previousScreen) ? previousScreen : 'chats';
      rightScreen = 'chat-detail';
    } else if (currentScreen === 'settings' || currentScreen === 'edit-profile') {
      leftScreen = 'profile';
      rightScreen = currentScreen;
    } else if (currentScreen === 'contact-profile') {
      leftScreen = ['chats', 'feed', 'explore', 'contacts', 'profile'].includes(previousScreen) ? previousScreen : 'contacts';
      rightScreen = 'contact-profile';
    } else if (currentScreen === 'notifications') {
      leftScreen = 'feed';
      rightScreen = 'notifications';
    }

    return (
      <div className="flex h-screen w-full overflow-hidden bg-surface">
        {/* Navigation Sidebar (Web style) */}
        <div className="w-[72px] border-r border-outline/10 flex flex-col items-center py-6 gap-6 h-full shrink-0 bg-surface z-50">
          <div className="w-10 h-10 rounded-xl overflow-hidden mb-4 shadow-lg shadow-cyan-500/20 shrink-0">
            <img src="/logo.png" alt="Aqualyn" className="w-full h-full object-cover" />
          </div>
          
          <div className="flex flex-col gap-4 flex-1 w-full">
            {[
              { id: 'chats',    icon: MessageCircle, label: 'Chats' },
              { id: 'contacts', icon: Users,         label: 'Contacts' },
              { id: 'feed',     icon: CircleDashed,  label: 'Feed' },
              { id: 'settings', icon: SettingsIcon,  label: 'Settings' }
            ].map(item => {
              const isActive = leftScreen === item.id || rightScreen === item.id || (item.id === 'settings' && (rightScreen === 'profile' || rightScreen === 'edit-profile'));
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (['chat-detail', 'contact-profile', 'settings', 'edit-profile'].includes(item.id)) {
                      navigateTo(item.id);
                    } else {
                      setCurrentScreen(item.id);
                    }
                  }}
                  title={item.label}
                  className={`w-12 h-12 mx-auto flex items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 group ${
                    isActive ? 'bg-cyan-600/10 text-cyan-600 shadow-sm' : 'text-slate-400 hover:bg-black/5 hover:text-slate-600'
                  }`}
                >
                  <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                </button>
              );
            })}
          </div>
          
          {/* User profile pic in side rail */}
          <button 
            onClick={() => navigateTo('profile')}
            className="w-10 h-10 rounded-full border-2 border-transparent hover:border-cyan-500 transition-colors overflow-hidden mt-auto cursor-pointer"
          >
            <img src={currentUser?.avatar || "https://ui-avatars.com/api/?name=User"} alt="Profile" className="w-full h-full object-cover" />
          </button>
        </div>

        {/* Left Sidebar */}
        <div style={{ width: leftWidth }} className="border-r border-outline/10 flex flex-col h-full shrink-0 relative bg-surface transition-none">
          <div className="flex-1 overflow-y-auto relative">
            {renderScreen(leftScreen, true)}
          </div>
        </div>

        {/* Drag Resizer — wide invisible hit area with thin visual line */}
        <div
          onMouseDown={onDragStart}
          className="w-[6px] h-full shrink-0 cursor-col-resize relative z-10 group flex items-center justify-center"
        >
          <div className="w-px h-full bg-outline/10 group-hover:bg-cyan-500/60 group-active:bg-cyan-500/80 transition-colors duration-150" />
        </div>

        {/* Right Main Area */}
        <div className="flex-1 min-w-0 h-full overflow-hidden relative bg-surface-container-lowest">
          <AnimatePresence mode="wait">
            {rightScreen ? (
              renderScreen(rightScreen)
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-on-surface-variant/50 gap-4"
              >
                <div className="w-24 h-24 rounded-full bg-secondary-container/20 flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-container/40 flex items-center justify-center">
                    <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl font-headline font-bold text-on-surface">Aqualyn Web</h2>
                <p className="text-sm">Select a chat or contact to start messaging</p>
                <p className="text-xs mt-8 opacity-50 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> End-to-end encrypted
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-surface text-on-surface font-body selection:bg-secondary-container/30 overflow-hidden bubble-${theme.bubbleStyle}`}>
      <ToastContainer />
      <CallOverlay />
      
      {appLockPin && isAppLocked ? (
        <AppLockScreen />
      ) : (
        isDesktop ? renderDesktopLayout() : renderMobileLayout()
      )}
    </div>
  );
}
