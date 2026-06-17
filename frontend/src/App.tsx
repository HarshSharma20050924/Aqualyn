import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
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
  const { isAppLocked, appLockPin, theme, aquaIntensity } = useAppContext();

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
  

  const { currentUser, isLoading } = useAppContext();
  
  useEffect(() => {
    if (!isLoading) {
      if (currentUser?.id && currentScreen === 'login') {
        setCurrentScreen('chats');
      } else if (!currentUser?.id && currentScreen !== 'login') {
        setCurrentScreen('login');
      }
    }
  }, [currentUser, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
         <BubbleLoader width={120} height={120} />
         <h1 className="mt-8 text-2xl font-black font-headline text-secondary tracking-tighter">AQUALYN</h1>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-surface text-on-surface font-body selection:bg-secondary-container/30 overflow-x-hidden bubble-${theme.bubbleStyle}`}>
      <ToastContainer />
      <CallOverlay />
      
      {appLockPin && isAppLocked ? (
        <AppLockScreen />
      ) : (
        <>
          <AnimatePresence mode="wait">
            {currentScreen === 'login' && <LoginScreen key="login" onLogin={() => setCurrentScreen('chats')} />}
            {currentScreen === 'feed' && <FeedScreen key="feed" onNavigate={setCurrentScreen} />}
            {currentScreen === 'chats' && <ChatListScreen key="chats" onNavigate={setCurrentScreen} />}
            {currentScreen === 'chat-detail' && <ChatDetailScreen key="chat-detail" onBack={() => setCurrentScreen('chats')} onNavigate={setCurrentScreen} />}
            {currentScreen === 'profile' && <ProfileScreen key="profile" onNavigate={setCurrentScreen} />}
            {currentScreen === 'settings' && <SettingsScreen key="settings" onBack={() => setCurrentScreen('profile')} onNavigate={setCurrentScreen} />}
            {currentScreen === 'contacts' && <ContactsScreen key="contacts" onNavigate={setCurrentScreen} />}
            {currentScreen === 'edit-profile' && <EditProfileScreen key="edit-profile" onBack={() => setCurrentScreen('profile')} />}
            {currentScreen === 'contact-profile' && <ContactProfileScreen key="contact-profile" onBack={() => setCurrentScreen('contacts')} onNavigate={setCurrentScreen} />}
            {currentScreen === 'notifications' && <NotificationsScreen key="notifications" onBack={() => setCurrentScreen('feed')} />}
          </AnimatePresence>
          
          {currentScreen !== 'login' && currentScreen !== 'chat-detail' && currentScreen !== 'contact-profile' && currentScreen !== 'edit-profile' && currentScreen !== 'notifications' && (
            <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
          )}
        </>
      )}
    </div>
  );
}
