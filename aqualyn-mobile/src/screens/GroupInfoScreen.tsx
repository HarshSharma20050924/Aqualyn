import BubbleLoader from '../components/ui/BubbleLoader';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  UserPlus,
  LogOut,
  Image as ImageIcon,
  Search,
  ChevronRight,
  Ghost,
  Shield,
  Users,
  Settings,
  Trash2,
  Clock,
  MessageCircle,
  Hash,
  Radio,
  Bell,
  Link as LinkIcon
} from 'lucide-react-native';

import { Chat } from '../types';
import { useAppContext } from '../context/AppContext';
import { ENDPOINTS } from '../config/api';
import { apiFetch } from '../utils/fetcher';

interface GroupInfoScreenProps {
  chat: Chat;
  onBack: () => void;
  onNavigate: (s: string) => void;
}

export default function GroupInfoScreen({ chat, onBack, onNavigate }: GroupInfoScreenProps) {
  const insets = useSafeAreaInsets();
  const { contacts, currentUser, addToast, setActiveContactId } = useAppContext();
  
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

  // Selector Modal state tracking variables
  const [activePicker, setActivePicker] = useState<'slowMode' | 'autoDelete' | null>(null);

  useEffect(() => {
    const fetchGroupInfo = async () => {
      try {
        const res = await apiFetch(ENDPOINTS.GROUP_INFO(chat.id));
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
  }, [chat.id]);

  const updateSetting = async (key: string, value: any) => {
    try {
      const res = await apiFetch(`/api/groups/${chat.id}/settings`, {
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
    addToast(newVal ? 'You are now an anonymous admin' : 'You are no longer anonymous', 'success');
  };

  const slowModeLabels: Record<number, string> = { 0: 'Off', 10: '10s', 30: '30s', 60: '1m', 300: '5m' };
  const autoDeleteLabels: Record<number, string> = { 0: 'Off', 86400: '1 day', 604800: '1 week', 2592000: '1 month' };

  if (loading) {
    return (
      <View style={[styles.loadingCenterDeck, { paddingTop: insets.top }]}>
        <BubbleLoader size={48} />
      </View>
    );
  }

  return (
    <Animated.View 
      entering={SlideInRight.springify().damping(25).stiffness(200)}
      exiting={SlideOutRight.springify().damping(25).stiffness(200)}
      style={styles.screenContainer}
    >
      {/* Header Dock Assembly */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerToolbar}>
          <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
            <ArrowLeft size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Group Info</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.mainScrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Large Avatar Hero Block */}
        <View style={styles.avatarHeroCenterBlock}>
          <View style={styles.avatarMainFrame}>
            <Image source={{ uri: chat.avatar }} style={styles.avatarImageContent} />
            <TouchableOpacity style={styles.avatarPickerBadgeBtn}>
              <ImageIcon size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.groupMainTitleText}>{chat.name}</Text>
          <Text style={styles.groupParticipantsCountSubtitle}>Group • {participants.length} participants</Text>
        </View>

        {/* Global Toolbar Quick Actions Quick Card */}
        <View style={styles.quickActionsRowContainer}>
          <TouchableOpacity 
            style={styles.quickActionFlexColumnItem}
            onPress={() => addToast('Opening contact picker...', 'info')}
          >
            <View style={[styles.quickActionIconCircleWrapper, { backgroundColor: 'rgba(0,87,189,0.08)' }]}>
              <UserPlus size={22} color="#0057bd" />
            </View>
            <Text style={styles.quickActionLabelTypography}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionFlexColumnItem}
            onPress={() => setIsSearchOpen(!isSearchOpen)}
          >
            <View style={[styles.quickActionIconCircleWrapper, isSearchOpen ? styles.bgActivePrimaryTint : styles.bgStandardSlateContainer]}>
              <Search size={22} color={isSearchOpen ? '#0057bd' : '#0f172a'} />
            </View>
            <Text style={styles.quickActionLabelTypography}>Search</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionFlexColumnItem}
            onPress={() => addToast('Chat muted', 'info')}
          >
            <View style={[styles.quickActionIconCircleWrapper, styles.bgStandardSlateContainer]}>
              <Bell size={22} color="#0f172a" />
            </View>
            <Text style={styles.quickActionLabelTypography}>Mute</Text>
          </TouchableOpacity>
        </View>

        {/* Description Group Card */}
        <View style={styles.inputGroupGlassCard}>
          <Text style={styles.cardSectionLabelTitle}>Description</Text>
          <Text style={styles.descriptionBodyParagraphText}>
            Welcome to the {chat.name}! This is a place for us to collaborate, share ideas, and stay updated on our projects. Please keep discussions relevant and respectful.
          </Text>
        </View>

        {/* Horizontal Attachment Files Media Shelf */}
        <View style={styles.inputGroupGlassCardOverrideOverflow}>
          <TouchableOpacity style={styles.interactiveRowNavigationTrigger}>
            <View style={styles.rowLayoutLeftMetadataPair}>
              <ImageIcon size={20} color="#0891b2" />
              <Text style={styles.rowMainNavigationLabelText}>Media, Links, and Docs</Text>
            </View>
            <View style={styles.rowLayoutRightEndCapAccessories}>
              <Text style={styles.rowDisplayCounterBadgeText}>{mediaCount.total}</Text>
              <ChevronRight size={20} color="#64748b" />
            </View>
          </TouchableOpacity>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaHorizontalScrollTrackContent}>
            {[1, 2, 3, 4].map((i) => (
              <Image 
                key={i}
                source={{ uri: `https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?auto=format&fit=crop&q=80&w=200&h=200&sig=${i}` }} 
                style={styles.mediaThumbCardThumbnailSquareImage}
              />
            ))}
          </ScrollView>
        </View>

        {/* Dynamic Participants Streaming Directory Card */}
        <View style={styles.inputGroupGlassCardOverrideOverflow}>
          <View style={styles.cardHeaderPaddingRow}>
            <Text style={styles.cardSectionLabelTitle}>Participants</Text>
            <View style={styles.pillCountCapsuleBadgeContainer}>
              <Text style={styles.pillCountCapsuleBadgeLabelText}>{participants.length}</Text>
            </View>
          </View>

          {isSearchOpen && (
            <View style={styles.searchBarInlineFormWrapperField}>
              <Search size={16} color="#64748b" style={styles.searchBarAbsoluteLeftPositionedIcon} />
              <TextInput
                style={styles.searchBarTextInputFieldElement}
                placeholder="Search participants..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          )}

          <View style={styles.listDivideWrapperRowsStack}>
            {participants.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p, i) => (
              <TouchableOpacity 
                key={i}
                style={styles.participantRowTouchableInteractiveItem}
                onPress={() => {
                  setActiveContactId(p.id);
                  onNavigate('contact-profile');
                }}
              >
                <View style={styles.participantLeftLayoutBlock}>
                  <Image source={{ uri: p.avatar }} style={styles.participantRowAvatarCircleThumbnail} />
                  <View>
                    <Text style={styles.participantMainDisplayNameLabelText}>{p.name}</Text>
                    <Text style={styles.participantSubStatusTaglineLabelText} numberOfLines={1}>
                      {p.role === 'Admin' ? 'Group Admin' : 'Hey there! I am using this app.'}
                    </Text>
                  </View>
                </View>
                {p.role === 'Admin' && (
                  <View style={styles.adminBadgeBorderedTextContainer}>
                    <Text style={styles.adminBadgeBorderedLabelCapsText}>Admin</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* System Group Security Shield Governance Settings Box */}
        <View style={styles.inputGroupGlassCardOverrideOverflow}>
          <View style={styles.settingsHeaderBlockRow}>
            <Shield size={20} color="#0057bd" />
            <Text style={styles.cardSectionLabelTitle}>Admin Settings</Text>
          </View>

          <View style={styles.settingsRowFlexContainerLineItem}>
            <View style={styles.settingsRowLeftMetadataStack}>
              <View style={[styles.settingsSquareIconBackgroundFrame, { backgroundColor: 'rgba(168,85,247,0.15)' }]}>
                <Ghost size={20} color="#a855f7" />
              </View>
              <View style={styles.settingsRowTextsLayoutWrapper}>
                <Text style={styles.settingsRowMainTitleHeadlineText}>Remain Anonymous</Text>
                <Text style={styles.settingsRowSubtitleSupportingDescription}>Hide your identity when sending messages</Text>
              </View>
            </View>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={toggleAnonymous}
              style={[styles.customToggleTrackFrame, isAnonymous ? styles.toggleTrackActiveBgColor : styles.toggleTrackInactiveBgColor]}
            >
              <View style={[styles.customToggleCircleThumbElement, isAnonymous ? styles.toggleThumbPositionedRightSide : styles.toggleThumbPositionedLeftSide]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.settingsRowFlexContainerLineItemInteractiveRow}
            onPress={() => addToast('Opening Administrators list...', 'info')}
          >
            <View style={styles.settingsRowLeftMetadataStack}>
              <View style={[styles.settingsSquareIconBackgroundFrame, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <Users size={20} color="#3b82f6" />
              </View>
              <Text style={styles.settingsRowLabelTitleOnlyText}>Administrators</Text>
            </View>
            <View style={styles.rowLayoutRightEndCapAccessories}>
              <Text style={styles.rowDisplayCounterBadgeText}>{adminCount}</Text>
              <ChevronRight size={18} color="#94a3b8" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingsRowFlexContainerLineItemInteractiveRow}
            onPress={() => addToast('Opening Permissions settings...', 'info')}
          >
            <View style={styles.settingsRowLeftMetadataStack}>
              <View style={[styles.settingsSquareIconBackgroundFrame, { backgroundColor: 'rgba(249,115,22,0.15)' }]}>
                <Settings size={20} color="#f97316" />
              </View>
              <Text style={styles.settingsRowLabelTitleOnlyText}>Permissions</Text>
            </View>
            <View style={styles.rowLayoutRightEndCapAccessories}>
              <Text style={styles.rowDisplayCounterBadgeText}>8/8</Text>
              <ChevronRight size={18} color="#94a3b8" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingsRowFlexContainerLineItemInteractiveRow, { borderBottomWidth: 0 }]}
            onPress={() => addToast('Opening Invite Links...', 'info')}
          >
            <View style={styles.settingsRowLeftMetadataStack}>
              <View style={[styles.settingsSquareIconBackgroundFrame, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                <LinkIcon size={20} color="#22c55e" />
              </View>
              <Text style={styles.settingsRowLabelTitleOnlyText}>Invite Links</Text>
            </View>
            <View style={styles.rowLayoutRightEndCapAccessories}>
              <Text style={styles.rowDisplayCounterBadgeText}>2 active</Text>
              <ChevronRight size={18} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Global Operational Features Chat Tuning Parameters Card */}
        <View style={styles.inputGroupGlassCardOverrideOverflow}>
          <View style={styles.settingsHeaderBlockRow}>
            <Settings size={20} color="#0057bd" />
            <Text style={styles.cardSectionLabelTitle}>Chat Settings</Text>
          </View>

          {/* Slow Mode Selector Row Entry Block */}
          <View style={styles.settingsRowFlexContainerLineItem}>
            <View style={styles.settingsRowLeftMetadataStack}>
              <View style={[styles.settingsSquareIconBackgroundFrame, { backgroundColor: 'rgba(234,179,8,0.15)' }]}>
                <Clock size={20} color="#eab308" />
              </View>
              <View style={styles.settingsRowTextsLayoutWrapper}>
                <Text style={styles.settingsRowMainTitleHeadlineText}>Slow Mode</Text>
                <Text style={styles.settingsRowSubtitleSupportingDescription}>Limit how often members send messages</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setActivePicker('slowMode')} style={styles.customPickerNativeTriggerBox}>
              <Text style={styles.customPickerNativeTriggerSelectionLabelText}>{slowModeLabels[slowMode]}</Text>
            </TouchableOpacity>
          </View>

          {/* Auto Delete Selector Row Entry Block */}
          <View style={styles.settingsRowFlexContainerLineItem}>
            <View style={styles.settingsRowLeftMetadataStack}>
              <View style={[styles.settingsSquareIconBackgroundFrame, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                <Trash2 size={20} color="#ef4444" />
              </View>
              <View style={styles.settingsRowTextsLayoutWrapper}>
                <Text style={styles.settingsRowMainTitleHeadlineText}>Auto-Delete Messages</Text>
                <Text style={styles.settingsRowSubtitleSupportingDescription}>Automatically clear chat logs dynamically</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setActivePicker('autoDelete')} style={styles.customPickerNativeTriggerBox}>
              <Text style={styles.customPickerNativeTriggerSelectionLabelText}>{autoDeleteLabels[autoDelete]}</Text>
            </TouchableOpacity>
          </View>

          {/* Reactions Switch Toggle Layout Row Entry Block */}
          <View style={styles.settingsRowFlexContainerLineItem}>
            <View style={styles.settingsRowLeftMetadataStack}>
              <View style={[styles.settingsSquareIconBackgroundFrame, { backgroundColor: 'rgba(236,72,153,0.15)' }]}>
                <MessageCircle size={20} color="#ec4899" />
              </View>
              <View style={styles.settingsRowTextsLayoutWrapper}>
                <Text style={styles.settingsRowMainTitleHeadlineText}>Reactions</Text>
                <Text style={styles.settingsRowSubtitleSupportingDescription}>Allow members to react to messages</Text>
              </View>
            </View>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => {
                const newVal = !reactionsEnabled;
                setReactionsEnabled(newVal);
                updateSetting('reactionsEnabled', newVal);
              }}
              style={[styles.customToggleTrackFrame, reactionsEnabled ? styles.toggleTrackActiveBgColor : styles.toggleTrackInactiveBgColor]}
            >
              <View style={[styles.customToggleCircleThumbElement, reactionsEnabled ? styles.toggleThumbPositionedRightSide : styles.toggleThumbPositionedLeftSide]} />
            </TouchableOpacity>
          </View>

          {/* Topics Switch Toggle Layout Row Entry Block */}
          <View style={styles.settingsRowFlexContainerLineItem}>
            <View style={styles.settingsRowLeftMetadataStack}>
              <View style={[styles.settingsSquareIconBackgroundFrame, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
                <Hash size={20} color="#6366f1" />
              </View>
              <View style={styles.settingsRowTextsLayoutWrapper}>
                <Text style={styles.settingsRowMainTitleHeadlineText}>Topics</Text>
                <Text style={styles.settingsRowSubtitleSupportingDescription}>Enable forum-like sub topics</Text>
              </View>
            </View>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setTopicsEnabled(!topicsEnabled)}
              style={[styles.customToggleTrackFrame, topicsEnabled ? styles.toggleTrackActiveBgColor : styles.toggleTrackInactiveBgColor]}
            >
              <View style={[styles.customToggleCircleThumbElement, topicsEnabled ? styles.toggleThumbPositionedRightSide : styles.toggleThumbPositionedLeftSide]} />
            </TouchableOpacity>
          </View>

          {/* Voice Chat Module Line Trigger Block */}
          <TouchableOpacity 
            style={[styles.settingsRowFlexContainerLineItemInteractiveRow, { borderBottomWidth: 0 }]}
            onPress={() => addToast('Voice chat feature coming soon', 'info')}
          >
            <View style={styles.settingsRowLeftMetadataStack}>
              <View style={[styles.settingsSquareIconBackgroundFrame, { backgroundColor: 'rgba(20,184,166,0.15)' }]}>
                <Radio size={20} color="#14b8a6" />
              </View>
              <View style={styles.settingsRowTextsLayoutWrapper}>
                <Text style={styles.settingsRowMainTitleHeadlineText}>Voice Chat</Text>
                <Text style={styles.settingsRowSubtitleSupportingDescription}>Start a live voice communication track</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Account Termination Group Leave Danger Outpost Station Block */}
        <View style={styles.dangerZoneOuterBoundaryFrameContainer}>
          <TouchableOpacity 
            style={styles.dangerZoneInteractiveBarButtonAction}
            onPress={async () => {
              try {
                const res = await apiFetch(ENDPOINTS.GROUP_LEAVE(chat.id), { method: 'POST' });
                if (res.ok) {
                  addToast('Left the group', 'success');
                  onBack();
                }
              } catch (e) {
                addToast('Failed to leave group', 'error');
              }
            }}
          >
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.dangerZoneTypographyLabelActionText}>Leave Group</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Cross-Platform Picker Selection Modal Layer */}
      <Modal visible={activePicker !== null} transparent animationType="slide">
        <View style={styles.modalViewportContainerCenteringShield}>
          <TouchableOpacity activeOpacity={1} onPress={() => setActivePicker(null)} style={styles.modalViewportAbsoluteBackgroundDimDismissal} />
          <View style={styles.modalBottomSheetContentCardTrack}>
            <View style={styles.modalBottomSheetCapsuleHandleBarIndicator} />
            <Text style={styles.modalBottomSheetHeaderTitleTypographyLabel}>
              Select {activePicker === 'slowMode' ? 'Slow Mode Limit' : 'Auto-Delete Range'}
            </Text>
            
            <View style={styles.modalBottomSheetOptionLinesListTrack}>
              {activePicker === 'slowMode' ? (
                [0, 10, 30, 60, 300].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.modalInteractiveOptionLineItemRow, slowMode === val && styles.modalActiveOptionLineItemBackgroundTint]}
                    onPress={() => {
                      setSlowMode(val);
                      updateSetting('slowMode', val);
                      setActivePicker(null);
                    }}
                  >
                    <Text style={[styles.modalOptionTextValueTypographyLabel, slowMode === val ? styles.textPrimaryActiveColor : styles.textDarkInactiveColor]}>
                      {slowModeLabels[val]}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                [0, 86400, 604800, 2592000].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.modalInteractiveOptionLineItemRow, autoDelete === val && styles.modalActiveOptionLineItemBackgroundTint]}
                    onPress={() => {
                      setAutoDelete(val);
                      updateSetting('autoDelete', val);
                      setActivePicker(null);
                    }}
                  >
                    <Text style={[styles.modalOptionTextValueTypographyLabel, autoDelete === val ? styles.textPrimaryActiveColor : styles.textDarkInactiveColor]}>
                      {autoDeleteLabels[val]}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#f8fafc' },
  loadingCenterDeck: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  
  // Custom Nav Header Layout Parameters Assembly
  headerContainer: {
    backgroundColor: 'rgba(248,250,252,0.85)',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    zIndex: 100
  },
  headerToolbar: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerBackBtn: { padding: 8, borderRadius: 99 },
  headerTitleText: { fontSize: 18, fontWeight: '900', color: '#0f172a', letterSpacing: -0.3 },

  // Scroll View Frame Box Configurations
  mainScrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  // Profile Large Avatar Title Group Components Matrix
  avatarHeroCenterBlock: { alignItems: 'center', marginBottom: 24 },
  avatarMainFrame: { position: 'relative', width: 120, height: 120, borderRadius: 60, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  avatarImageContent: { width: '100%', height: '100%', borderRadius: 60, resizeMode: 'cover', borderWidth: 4, borderColor: '#fff' },
  avatarPickerBadgeBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0057bd', padding: 10, borderRadius: 99, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  groupMainTitleText: { fontSize: 24, fontWeight: '900', color: '#0f172a', textAlign: 'center', marginTop: 14, letterSpacing: -0.4 },
  groupParticipantsCountSubtitle: { fontSize: 13, color: '#64748b', fontWeight: '500', marginTop: 4 },

  // Quick Action Rows Container Assemblies Custom Designs
  quickActionsRowContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', borderRadius: 24, paddingVertical: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  quickActionFlexColumnItem: { alignItems: 'center', gap: 6, flex: 1 },
  quickActionIconCircleWrapper: { padding: 14, borderRadius: 99 },
  quickActionLabelTypography: { fontSize: 12, fontWeight: '700', color: '#334155' },
  bgActivePrimaryTint: { backgroundColor: 'rgba(0,87,189,0.15)' },
  bgStandardSlateContainer: { backgroundColor: '#f1f5f9' },

  // Group Content Panels Layout Standard Forms Framing Configurations
  inputGroupGlassCard: { backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginBottom: 20 },
  inputGroupGlassCardOverrideOverflow: { backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20, overflow: 'hidden' },
  cardSectionLabelTitle: { fontSize: 11, fontWeight: '800', color: '#0057bd', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  descriptionBodyParagraphText: { fontSize: 14, color: '#334155', lineHeight: 21, fontWeight: '400' },

  // Interactive Lists Navigation Elements Parameters Layout
  interactiveRowNavigationTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowLayoutLeftMetadataPair: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowMainNavigationLabelText: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  rowLayoutRightEndCapAccessories: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowDisplayCounterBadgeText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  mediaHorizontalScrollTrackContent: { paddingLeft: 16, paddingBottom: 16, gap: 8 },
  mediaThumbCardThumbnailSquareImage: { width: 80, height: 80, borderRadius: 16, resizeMode: 'cover' },

  // Directory Listings Headers Blocks Rows Structures
  cardHeaderPaddingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  pillCountCapsuleBadgeContainer: { backgroundColor: 'rgba(0,87,189,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  pillCountCapsuleBadgeLabelText: { fontSize: 11, fontWeight: '800', color: '#0057bd' },
  
  // Custom Indoor Search Bar inputs Form
  searchBarInlineFormWrapperField: { position: 'relative', marginHorizontal: 16, marginBottom: 12, justifyContent: 'center' },
  searchBarAbsoluteLeftPositionedIcon: { position: 'absolute', left: 12, zIndex: 10 },
  searchBarTextInputFieldElement: { height: 40, backgroundColor: '#f1f5f9', borderRadius: 12, paddingLeft: 38, paddingRight: 16, fontSize: 13, color: '#0f172a' },
  
  listDivideWrapperRowsStack: { borderTopWidth: 1, borderColor: '#f1f5f9' },
  participantRowTouchableInteractiveItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  participantLeftLayoutBlock: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  participantRowAvatarCircleThumbnail: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9' },
  participantMainDisplayNameLabelText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  participantSubStatusTaglineLabelText: { fontSize: 11, color: '#64748b', marginTop: 1 },
  adminBadgeBorderedTextContainer: { borderWidth: 1, borderColor: 'rgba(8,145,178,0.4)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  adminBadgeBorderedLabelCapsText: { fontSize: 9, fontWeight: '800', color: '#0891b2', textTransform: 'uppercase' },

  // System Configured Internal Line Blocks Configurations Matrix
  settingsHeaderBlockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  settingsRowFlexContainerLineItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  settingsRowFlexContainerLineItemInteractiveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  settingsRowLeftMetadataStack: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 },
  settingsSquareIconBackgroundFrame: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingsRowTextsLayoutWrapper: { flex: 1 },
  settingsRowMainTitleHeadlineText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  settingsRowSubtitleSupportingDescription: { fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 14 },
  settingsRowLabelTitleOnlyText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },

  // Custom Selection Form Trigger Blocks Assemblies Layout
  customPickerNativeTriggerBox: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  customPickerNativeTriggerSelectionLabelText: { fontSize: 12, fontWeight: '700', color: '#334155' },

  // Custom Toggle Switch Configurations Layout Structures
  customToggleTrackFrame: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  toggleTrackActiveBgColor: { backgroundColor: '#0891b2' },
  toggleTrackInactiveBgColor: { backgroundColor: '#e2e8f0' },
  customToggleCircleThumbElement: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  toggleThumbPositionedRightSide: { alignSelf: 'flex-end' },
  toggleThumbPositionedLeftSide: { alignSelf: 'flex-start' },

  // Operational Danger Boundaries Box components properties
  dangerZoneOuterBoundaryFrameContainer: { backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#fee2e2', overflow: 'hidden', marginTop: 8 },
  dangerZoneInteractiveBarButtonAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: '#fff' },
  dangerZoneTypographyLabelActionText: { fontSize: 14, fontWeight: '800', color: '#ef4444' },

  // Native Picker Modal Architecture Layout Configurations Blocks
  modalViewportContainerCenteringShield: { flex: 1, justifyContent: 'flex-end' },
  modalViewportAbsoluteBackgroundDimDismissal: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,23,42,0.3)' },
  modalBottomSheetContentCardTrack: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 10 },
  modalBottomSheetCapsuleHandleBarIndicator: { width: 36, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalBottomSheetHeaderTitleTypographyLabel: { fontSize: 15, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 16 },
  modalBottomSheetOptionLinesListTrack: { gap: 6 },
  modalInteractiveOptionLineItemRow: { width: '100%', padding: 14, borderRadius: 12, alignItems: 'center' },
  modalActiveOptionLineItemBackgroundTint: { backgroundColor: 'rgba(0,87,189,0.06)' },
  modalOptionTextValueTypographyLabel: { fontSize: 14, fontWeight: '700' },
  textPrimaryActiveColor: { color: '#0057bd' },
  textDarkInactiveColor: { color: '#475569' }
});