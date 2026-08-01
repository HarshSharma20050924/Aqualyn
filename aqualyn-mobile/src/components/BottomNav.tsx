import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MessageCircle, Users, CircleDashed, Settings as SettingsIcon } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, useEffect } from 'react-native-reanimated';

export default function BottomNav({ currentScreen, onNavigate }: { currentScreen: string, onNavigate: (s: string) => void }) {
  const navItems = [
    { id: 'chats', icon: MessageCircle, label: 'Chats' },
    { id: 'contacts', icon: Users, label: 'Contacts' },
    { id: 'feed', icon: CircleDashed, label: 'Feed' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' }
  ];

  return (
    <BlurView intensity={85} tint="light" style={styles.navContainer}>
      {navItems.map((item) => {
        const isActive = currentScreen === item.id || (item.id === 'settings' && currentScreen === 'profile');
        const Icon = item.icon;
        
        return (
          <TouchableOpacity 
            key={item.id} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onNavigate(item.id);
            }}
            style={styles.navItem}
            activeOpacity={0.6}
          >
            <Animated.View style={[styles.navItemInner, isActive ? styles.navItemActive : styles.navItemInactive]}>
              <Icon 
                size={24} 
                color={isActive ? '#0891b2' : '#64748b'} 
                fill={isActive ? 'rgba(8, 145, 178, 0.2)' : 'transparent'} 
              />
              <Text style={[styles.navLabel, isActive ? styles.navLabelActive : styles.navLabelInactive]}>
                {item.label}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 70,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(241, 245, 249, 0.5)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 0,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    transform: [{ scale: 1.05 }],
  },
  navItemInactive: {
    transform: [{ scale: 0.95 }],
    opacity: 0.6,
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