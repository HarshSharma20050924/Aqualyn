/**
 * App.tsx
 * Native root application coordinator for Aqualyn.
 * Manages runtime authentication gates, device lock states, and global themes.
 */

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar,
  useColorScheme 
} from 'react-native';

// State & Core Imports
import { useAppContext } from './context/AppContext';
import { Theme } from './config/theme';

// Native Screen Alternatives (Map to your React Navigation configuration or stack screens)
import LoginScreen from './screens/LoginScreen';
import AuthScreen from './screens/AuthScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatDetailScreen from './screens/ChatDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import ContactsScreen from './screens/ContactsScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ContactProfileScreen from './screens/ContactProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import FeedScreen from './screens/FeedScreen';

// Global Overlays & Modals
import BottomNav from './components/BottomNav';
import ToastContainer from './components/ui/ToastContainer';
import AppLockScreen from './components/AppLockScreen';
import { CallOverlay } from './components/CallOverlay';
import BubbleLoader from './components/ui/BubbleLoader';

export default function App() {
  const { currentUser, isLoading, isAppLocked, appLockPin, theme, aquaIntensity } = useAppContext();
  const [currentScreen, setCurrentScreen] = useState<string>('login');
  const systemColorScheme = useColorScheme();

  // Determine current active colors based on theme settings
  const isDarkMode = theme.mode === 'dark' || (theme.mode === 'system' && systemColorScheme === 'dark');
  const activeColors = isDarkMode ? Theme.darkColors : Theme.colors;

  // Authentication Synchronizer Loop
  useEffect(() => {
    if (!isLoading) {
      if (currentUser?.id && currentScreen === 'login') {
        setCurrentScreen('chats');
      } else if (!currentUser?.id && currentScreen !== 'login') {
        setCurrentScreen('login');
      }
    }
  }, [currentUser, isLoading]);

  // Loading State / Splash View
  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: activeColors.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.spinnerWrapper}>
          <BubbleLoader size={120} />
        </View>
        <Text style={[
          styles.brandHeadline, 
          { 
            color: theme.accentColor || activeColors.primary,
            fontSize: (theme.fontSize || 16) + 8
          }
        ]}>
          AQUALYN
        </Text>
      </View>
    );
  }

  // Guard Render Loop when Device Passcode Lock is turned on
  if (appLockPin && isAppLocked) {
    return (
      <SafeAreaView style={[styles.rootContainer, { backgroundColor: activeColors.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppLockScreen />
      </SafeAreaView>
    );
  }

  // Dynamic Navigation Screen Router
  const renderActiveScreen = () => {
    switch (currentScreen) {
case 'auth':
  return <AuthScreen onLogin={() => setCurrentScreen('chats')} />;
      case 'feed':
        return <FeedScreen onNavigate={setCurrentScreen} />;
      case 'chats':
        return <ChatListScreen onNavigate={setCurrentScreen} />;
      case 'chat-detail':
        return <ChatDetailScreen onBack={() => setCurrentScreen('chats')} onNavigate={setCurrentScreen} />;
      case 'profile':
        return <ProfileScreen onNavigate={setCurrentScreen} />;
      case 'settings':
        return <SettingsScreen onBack={() => setCurrentScreen('profile')} onNavigate={setCurrentScreen} />;
      case 'contacts':
        return <ContactsScreen onNavigate={setCurrentScreen} />;
      case 'edit-profile':
        return <EditProfileScreen onBack={() => setCurrentScreen('profile')} />;
      case 'contact-profile':
        return <ContactProfileScreen onBack={() => setCurrentScreen('contacts')} onNavigate={setCurrentScreen} />;
      case 'notifications':
        return <NotificationsScreen onBack={() => setCurrentScreen('feed')} />;
      default:
        return <ChatListScreen onNavigate={setCurrentScreen} />;
    }
  };

  // Determine visibility parameters for Bottom Navigation bar
const shouldShowBottomNav = 
  currentScreen !== 'auth' && 
  currentScreen !== 'login' && 
  currentScreen !== 'chat-detail' && 
  currentScreen !== 'contact-profile' && 
  currentScreen !== 'edit-profile' && 
  currentScreen !== 'notifications';

  return (
    <SafeAreaView style={[styles.rootContainer, { backgroundColor: activeColors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Global Context Engine Overlays */}
      <ToastContainer />
      <CallOverlay />

      {/* Screen Layer Area */}
      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>

      {/* Bottom Navigation Control Mount */}
      {shouldShowBottomNav && (
        <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    width: '100%',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerWrapper: {
    position: 'relative',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandHeadline: {
    marginTop: 24,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});