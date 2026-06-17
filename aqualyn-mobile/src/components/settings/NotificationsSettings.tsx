import BubbleLoader from '../../components/ui/BubbleLoader';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
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
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Bell size={20} color="#fbbf24" />
        <Text style={styles.titleText}>Notifications</Text>
      </View>

      <View style={styles.card}>
        {items.map((item, i) => {
          const isActive = settings[item.key];
          const isItemLoading = loading === item.key;

          return (
            <View 
              key={item.key} 
              style={[
                styles.itemRow,
                i !== items.length - 1 ? styles.borderBottom : null
              ]}
            >
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDesc}>{item.desc}</Text>
              </View>

              <TouchableOpacity 
                disabled={isItemLoading}
                onPress={() => toggle(item.key)}
                style={[
                  styles.switchTrack,
                  isActive ? styles.switchTrackActive : styles.switchTrackInactive
                ]}
                activeOpacity={0.8}
              >
                {isItemLoading ? (
                  <View style={styles.spinnerWrapper}>
                    <BubbleLoader size={24} />
                  </View>
                ) : (
                  <View style={[
                    styles.switchThumb,
                    isActive ? styles.switchThumbActive : styles.switchThumbInactive
                  ]} />
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 32,
    overflow: 'hidden',
  },
  itemRow: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  itemTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  itemDesc: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  switchTrack: {
    width: 48,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: '#0284C7',
  },
  switchTrackInactive: {
    backgroundColor: '#cbd5e1',
  },
  spinnerWrapper: {
    alignSelf: 'center',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  switchThumbInactive: {
    alignSelf: 'flex-start',
  },
});