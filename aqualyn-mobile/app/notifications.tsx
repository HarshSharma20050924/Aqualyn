import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MessageSquare, UserPlus, ArrowLeft, Bell } from 'lucide-react-native';
import { useAppContext } from '../src/context/AppContext';
import { Theme } from '../src/config/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, acceptFollowRequest, rejectFollowRequest } = useAppContext();

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
      case 'story_like':
        return <Heart size={12} color="#ef4444" fill="#ef4444" />;
      case 'comment':
        return <MessageSquare size={12} color="#3b82f6" fill="#3b82f6" />;
      case 'follow':
      case 'follow_request':
        return <UserPlus size={12} color="#22c55e" />;
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
        return notification.text || '';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bell size={48} color="rgba(255, 255, 255, 0.2)" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
              <View style={styles.avatarContainer}>
                <Image 
                  source={{ uri: item.actor?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.actor?.displayName}` }} 
                  style={styles.avatar} 
                />
                <View style={styles.iconBadge}>
                  {getIcon(item.type)}
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.notificationText}>
                  <Text style={styles.actorName}>{item.actor?.displayName || item.actor?.username}</Text>{' '}
                  {getMessage(item)}
                </Text>
                <Text style={styles.timeText}>
                  {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>

                {item.type === 'follow_request' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={styles.confirmBtn}
                      onPress={() => acceptFollowRequest(item.actorId)}
                    >
                      <Text style={styles.confirmBtnText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.rejectBtn}
                      onPress={() => rejectFollowRequest(item.actorId)}
                    >
                      <Text style={styles.rejectBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(10, 25, 47, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  unreadCard: {
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    borderColor: 'rgba(14, 165, 233, 0.15)',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  notificationText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 18,
  },
  actorName: {
    fontWeight: 'bold',
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  confirmBtn: {
    flex: 1,
    height: 32,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  rejectBtn: {
    flex: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rejectBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});
