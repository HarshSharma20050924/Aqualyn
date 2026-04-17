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
import DiscoveryScreen from './screens/DiscoveryScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import BottomNav from './components/BottomNav';
import ToastContainer from './components/ui/ToastContainer';
import AppLockScreen from './components/AppLockScreen';
import { useAppContext } from './context/AppContext';

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
  
  const { currentUser, isLoading } = useAppContext();
  
  useEffect(() => {
    if (!isLoading) {
      if (currentUser && currentScreen === 'login') {
        setCurrentScreen('chats');
      } else if (!currentUser && currentScreen !== 'login') {
        setCurrentScreen('login');
      }
    }
  }, [currentUser, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
         <div className="w-24 h-24 relative">
            <div className="absolute inset-0 border-4 border-secondary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
         </div>
         <h1 className="mt-8 text-2xl font-black font-headline text-secondary tracking-tighter">AQUALYN</h1>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-surface text-on-surface font-body selection:bg-secondary-container/30 overflow-x-hidden bubble-${theme.bubbleStyle}`}>
      <ToastContainer />
      
      {appLockPin && isAppLocked ? (
        <AppLockScreen />
      ) : (
        <>
          <AnimatePresence mode="wait">
            {currentScreen === 'login' && <LoginScreen key="login" onLogin={() => setCurrentScreen('chats')} />}
            {currentScreen === 'chats' && <ChatListScreen key="chats" onNavigate={setCurrentScreen} />}
            {currentScreen === 'chat-detail' && <ChatDetailScreen key="chat-detail" onBack={() => setCurrentScreen('chats')} onNavigate={setCurrentScreen} />}
            {currentScreen === 'profile' && <ProfileScreen key="profile" onNavigate={setCurrentScreen} />}
            {currentScreen === 'settings' && <SettingsScreen key="settings" onBack={() => setCurrentScreen('profile')} onNavigate={setCurrentScreen} />}
            {currentScreen === 'contacts' && <ContactsScreen key="contacts" onNavigate={setCurrentScreen} />}
            {currentScreen === 'edit-profile' && <EditProfileScreen key="edit-profile" onBack={() => setCurrentScreen('profile')} />}
            {currentScreen === 'contact-profile' && <ContactProfileScreen key="contact-profile" onBack={() => setCurrentScreen('chats')} onNavigate={setCurrentScreen} />}
            {currentScreen === 'discovery' && <DiscoveryScreen key="discovery" onBack={() => setCurrentScreen('chats')} onNavigate={setCurrentScreen} />}
            {currentScreen === 'notifications' && <NotificationsScreen key="notifications" onBack={() => setCurrentScreen('chats')} />}
          </AnimatePresence>
          
          {currentScreen !== 'login' && currentScreen !== 'chat-detail' && currentScreen !== 'contact-profile' && currentScreen !== 'edit-profile' && (
            <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
          )}
        </>
      )}
    </div>
  );
}
