import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MessageCircle, Users, CircleDashed, Settings as SettingsIcon } from 'lucide-react-native';

export default function BottomNav({ currentScreen, onNavigate }: { currentScreen: string, onNavigate: (s: string) => void }) {
  const navItems = [
    { id: 'chats', icon: MessageCircle, label: 'Chats' },
    { id: 'contacts', icon: Users, label: 'Contacts' },
    { id: 'feed', icon: CircleDashed, label: 'Feed' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' }
  ];

  return (
    <View style={styles.navContainer}>
      {navItems.map((item) => {
        const isActive = currentScreen === item.id || (item.id === 'settings' && currentScreen === 'profile');
        const Icon = item.icon;
        
        return (
          <TouchableOpacity 
            key={item.id} 
            onPress={() => onNavigate(item.id)}
            style={[styles.navItem, isActive ? styles.navItemActive : styles.navItemInactive]}
            activeOpacity={0.8}
          >
            <Icon 
              size={24} 
              color={isActive ? '#0891b2' : '#94a3b8'} 
              fill={isActive ? 'rgba(8, 145, 178, 0.2)' : 'transparent'} 
            />
            <Text style={[styles.navLabel, isActive ? styles.navLabelActive : styles.navLabelInactive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 84,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  navItem: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
    alignItems: 'center',
  },
  navItemActive: {
    transform: [{ scale: 1.05 }],
  },
  navItemInactive: {
    opacity: 0.7,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  navLabelActive: {
    color: '#0891b2',
  },
  navLabelInactive: {
    color: '#94a3b8',
  },
});