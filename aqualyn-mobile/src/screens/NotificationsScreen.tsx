import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Platform
} from 'react-native';
import Animated, { SlideInRight, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, MessageCircle, UserPlus, ArrowLeft, Bell } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

interface NotificationsScreenProps {
  onBack: () => void;
}

export default function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const insets = useSafeAreaInsets();
  const { notifications = [], acceptFollowRequest, rejectFollowRequest } = useAppContext() || {};

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
      case 'story_like':
        return <Heart size={14} color="#ef4444" fill="#ef4444" />;
      case 'comment':
        return <MessageCircle size={14} color="#3b82f6" fill="#3b82f6" />;
      case 'follow':
      case 'follow_request':
        return <UserPlus size={14} color="#22c55e" />;
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

  const formatNotificationTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '';
    }
  };

  const renderNotificationItem = ({ item: notification }: { item: any }) => {
    const isRead = notification.isRead;
    const avatarUrl = notification.actor?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${notification.actor?.displayName}`;

    return (
      <View style={[styles.notificationCard, isRead ? styles.bgTransparent : styles.bgUnreadTint]}>
        {/* Avatar badge configuration */}
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: avatarUrl }} 
            style={styles.actorAvatarImage} 
            resizeMode="cover"
          />
          <View style={styles.iconBadgeAbsolutePosition}>
            {getIcon(notification.type)}
          </View>
        </View>

        {/* Content body layout */}
        <View style={styles.contentBodyWrapper}>
          <Text style={styles.notificationMainTextTypography}>
            <Text style={styles.boldActorNameText}>
              {notification.actor?.displayName || notification.actor?.username || 'Someone'}{' '}
            </Text>
            {notification.text || getMessage(notification)}
          </Text>
          
          <Text style={styles.timestampMetaLabelText}>
            {formatNotificationTime(notification.createdAt)}
          </Text>
          
          {notification.type === 'follow_request' && (
            <View style={styles.actionButtonsInlineTrack}>
              <TouchableOpacity 
                onPress={() => acceptFollowRequest?.(notification.actorId)}
                style={[styles.baseActionBtn, styles.primaryConfirmBtn]}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryConfirmBtnLabel}>Confirm</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => rejectFollowRequest?.(notification.actorId)}
                style={[styles.baseActionBtn, styles.secondaryDeleteBtn]}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryDeleteBtnLabel}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateCenteringWrapper}>
      <Bell size={48} color="#0f172a" style={styles.emptyBellOpacityAdjustment} />
      <Text style={styles.emptyStateHeadlineTypography}>No recent activity</Text>
    </View>
  );

  return (
    <Animated.View 
      entering={SlideInRight.springify().damping(22)} 
      exiting={FadeOut}
      style={styles.viewportBaseContainerFrame}
    >
      {/* Fixed Sticky Header Simulation layout space */}
      <View style={[styles.stickyHeaderGlassBar, { paddingTop: insets.top, height: 64 + insets.top }]}>
        <View style={styles.headerContentHorizontalAligner}>
          <TouchableOpacity 
            onPress={onBack} 
            style={styles.headerIconButtonCircularTrigger}
            activeOpacity={0.6}
          >
            <ArrowLeft size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitleHeadlineTypography}>Activity</Text>
        </View>
      </View>

      {/* Primary Scroll system utilizing lazy-loading list structures */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotificationItem}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listScrollStackDynamicPadding,
          { paddingBottom: insets.bottom + 40 }
        ]}
        showsVerticalScrollIndicator={false}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  viewportBaseContainerFrame: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  stickyHeaderGlassBar: {
    width: '100%',
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    justifyContent: 'flex-end',
    zIndex: 50,
    ...Platform.select({
      ios: {
        shadowColor: '#0057bd',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
      },
      android: {
        elevation: 2
      }
    })
  },
  headerContentHorizontalAligner: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12
  },
  headerIconButtonCircularTrigger: {
    padding: 6,
    marginLeft: -4,
    borderRadius: 20,
    backgroundColor: 'transparent'
  },
  headerTitleHeadlineTypography: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5
  },
  listScrollStackDynamicPadding: {
    flexGrow: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center'
  },

  // Notification Row Components Assembly Properties 
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    padding: 16,
    borderRadius: 20,
    marginBottom: 8
  },
  bgTransparent: {
    backgroundColor: 'transparent'
  },
  bgUnreadTint: {
    backgroundColor: 'rgba(0, 87, 189, 0.05)'
  },
  avatarContainer: {
    position: 'relative',
    width: 48,
    height: 48
  },
  actorAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9'
  },
  iconBadgeAbsolutePosition: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    backgroundColor: '#ffffff',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1
      }
    })
  },
  contentBodyWrapper: {
    flex: 1,
    minWidth: 0
  },
  notificationMainTextTypography: {
    fontSize: 14,
    lineHeight: 20,
    color: '#0f172a'
  },
  boldActorNameText: {
    fontWeight: '700'
  },
  timestampMetaLabelText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500'
  },

  // Follow Actions Buttons Integration Panels Layout Architecture
  actionButtonsInlineTrack: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    width: '100%'
  },
  baseActionBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  primaryConfirmBtn: {
    backgroundColor: '#0057bd'
  },
  primaryConfirmBtnLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600'
  },
  secondaryDeleteBtn: {
    backgroundColor: '#f1f5f9'
  },
  secondaryDeleteBtnLabel: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600'
  },

  // Empty Sandbox Configurations Layout blocks
  emptyStateCenteringWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80
  },
  emptyBellOpacityAdjustment: {
    opacity: 0.15,
    marginBottom: 16
  },
  emptyStateHeadlineTypography: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center'
  }
});