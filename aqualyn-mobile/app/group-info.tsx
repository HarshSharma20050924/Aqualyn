import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, UserPlus, LogOut, Image as ImageIcon, Bell, Search, ChevronRight, Ghost, Shield, Users, Settings, MessageSquare, Trash2, Hash, Radio, Lock } from 'lucide-react-native';
import { useAppContext } from '../src/context/AppContext';
import { Theme } from '../src/config/theme';
import { apiFetch } from '../src/utils/fetcher';
import { ENDPOINTS } from '../src/config/api';

export default function GroupInfoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { contacts, currentUser, addToast, chats, setActiveContactId } = useAppContext();

  const chat = chats.find((c: any) => c.id === id);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [slowMode, setSlowMode] = useState(0);
  const [autoDelete, setAutoDelete] = useState(0);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [topicsEnabled, setTopicsEnabled] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [mediaCount, setMediaCount] = useState({ images: 0, videos: 0, docs: 0, total: 0 });
  const [adminCount, setAdminCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchGroupInfo = async () => {
      try {
        const res = await apiFetch(ENDPOINTS.GROUP_INFO(id as string));
        if (res.ok) {
          const data = await res.json();
          setParticipants(data.participants?.map((p: any) => ({
            id: p.user.id,
            name: p.user.displayName || p.user.username || 'User',
            avatar: p.user.avatar,
            role: p.role
          })) || []);
          setMediaCount(data.mediaCount || { images: 0, videos: 0, docs: 0, total: 0 });
          setAdminCount(data.adminCount || 0);
          const settings = data.settings || {};
          if (settings.slowMode) setSlowMode(settings.slowMode);
          if (settings.autoDelete) setAutoDelete(settings.autoDelete);
          if (settings.reactionsEnabled !== undefined) setReactionsEnabled(settings.reactionsEnabled);
          if (settings.topicsEnabled !== undefined) setTopicsEnabled(settings.topicsEnabled);
        }
      } catch (e) {
        console.error('[GroupInfo] Fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchGroupInfo();
  }, [id]);

  const updateSetting = async (key: string, value: any) => {
    try {
      const res = await apiFetch(`/api/groups/${id}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ settings: { [key]: value } })
      });
      if (!res.ok) throw new Error('Update failed');
      addToast('Group settings updated', 'success');
    } catch (e) {
      addToast('Failed to update group setting', 'error');
    }
  };

  const toggleAnonymous = () => {
    const newVal = !isAnonymous;
    setIsAnonymous(newVal);
    updateSetting('isAnonymous', newVal);
    addToast(isAnonymous ? 'You are no longer anonymous' : 'You are now an anonymous admin', 'success');
  };

  if (!chat) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'white' }}>Group not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Info</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main Info */}
      <View style={styles.groupMainInfo}>
        <Image source={{ uri: chat.avatar }} style={styles.groupAvatar} />
        <Text style={styles.groupName}>{chat.name}</Text>
        <Text style={styles.groupSub}>Group • {participants.length} participants</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => addToast('Opening contact picker...', 'info')}>
          <View style={styles.actionIconContainer}>
            <UserPlus size={22} color="white" />
          </View>
          <Text style={styles.actionBtnLabel}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setIsSearchOpen(!isSearchOpen)}>
          <View style={styles.actionIconContainer}>
            <Search size={22} color="white" />
          </View>
          <Text style={styles.actionBtnLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => addToast('Notifications muted', 'success')}>
          <View style={styles.actionIconContainer}>
            <Bell size={22} color="white" />
          </View>
          <Text style={styles.actionBtnLabel}>Mute</Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.descriptionText}>
          Welcome to the {chat.name}! This is a place for us to collaborate, share ideas, and stay updated on our projects.
        </Text>
      </View>

      {/* Media Count */}
      <View style={styles.sectionCard}>
        <View style={styles.rowItem}>
          <ImageIcon size={20} color={Theme.colors.primary} />
          <Text style={styles.rowItemTitle}>Media, Links, and Docs</Text>
          <Text style={styles.mediaCountText}>{mediaCount.total}</Text>
          <ChevronRight size={18} color="rgba(255, 255, 255, 0.4)" />
        </View>
      </View>

      {/* Participants List */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>Participants ({participants.length})</Text>
        {loading ? (
          <ActivityIndicator size="small" color="white" style={{ marginVertical: 10 }} />
        ) : (
          participants.map((p, idx) => (
            <TouchableOpacity 
              key={p.id || idx} 
              style={styles.participantRow}
              onPress={() => {
                setActiveContactId(p.id);
                router.push('/contact-profile');
              }}
            >
              <Image source={{ uri: p.avatar }} style={styles.participantAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.participantName}>{p.name}</Text>
                <Text style={styles.participantSub}>{p.role === 'Admin' ? 'Group Admin' : 'Member'}</Text>
              </View>
              {p.role === 'Admin' && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Settings Options */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>Admin Settings</Text>

        <View style={styles.rowSetting}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Remain Anonymous</Text>
            <Text style={styles.settingSub}>Hide identity when sending messages</Text>
          </View>
          <Switch 
            value={isAnonymous} 
            onValueChange={toggleAnonymous}
            thumbColor="white"
            trackColor={{ true: Theme.colors.primary }}
          />
        </View>

        <View style={styles.rowSetting}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Allow Reactions</Text>
            <Text style={styles.settingSub}>Allow members to react to messages</Text>
          </View>
          <Switch 
            value={reactionsEnabled} 
            onValueChange={(val) => {
              setReactionsEnabled(val);
              updateSetting('reactionsEnabled', val);
            }}
            thumbColor="white"
            trackColor={{ true: Theme.colors.primary }}
          />
        </View>

        <View style={styles.rowSetting}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Allow Topics</Text>
            <Text style={styles.settingSub}>Enable sub-forum topics in chat</Text>
          </View>
          <Switch 
            value={topicsEnabled} 
            onValueChange={(val) => {
              setTopicsEnabled(val);
              updateSetting('topicsEnabled', val);
            }}
            thumbColor="white"
            trackColor={{ true: Theme.colors.primary }}
          />
        </View>
      </View>

      {/* Leave Group Button */}
      <View style={{ paddingHorizontal: 16, marginVertical: 30 }}>
        <TouchableOpacity 
          style={styles.leaveButton}
          onPress={async () => {
            try {
              const res = await apiFetch(ENDPOINTS.GROUP_LEAVE(chat.id), {
                method: 'POST'
              });
              if (res.ok) {
                addToast('Left the group', 'success');
                router.back();
              }
            } catch (e) {
              addToast('Failed to leave group', 'error');
            }
          }}
        >
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.leaveButtonText}>Leave Group</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  groupMainInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  groupAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'white',
    marginBottom: 12,
  },
  groupName: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  groupSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  actionBtn: {
    alignItems: 'center',
    width: 70,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionBtnLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionLabel: {
    color: '#0ea5e9',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  descriptionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowItemTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  mediaCountText: {
    color: '#0ea5e9',
    fontWeight: 'bold',
    marginRight: 6,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  participantName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  participantSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  adminBadge: {
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  adminBadgeText: {
    color: '#0ea5e9',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  rowSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  settingSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  leaveButton: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  leaveButtonText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
