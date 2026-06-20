import React, { useState, useEffect } from 'react';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Share
} from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  UserPlus,
  X,
  Share2,
  RefreshCw,
  Users
} from 'lucide-react-native';

import { useAppContext } from '../context/AppContext';
import AddContactModal from '../components/modals/AddContactModal';

interface Props {
  onNavigate: (screen: string) => void;
}

export default function ContactsScreen({ onNavigate }: Props) {
  const insets = useSafeAreaInsets();
  const {
    contacts,
    setActiveContactId,
    isLoading,
    addToast,
    syncContacts,
    currentUser,
    globalUsers
  } = useAppContext();

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'contacts' | 'followers' | 'following'>('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceContacts, setDeviceContacts] = useState<Contacts.Contact[]>([]);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
          });
          setDeviceContacts(data);
        }
      }
    })();
  }, []);

  const handleContactClick = (id: string) => {
    setActiveContactId(id);
    onNavigate('contact-profile');
  };

  const handleInvite = async (phoneNumber?: string) => {
    try {
      if (phoneNumber && await SMS.isAvailableAsync()) {
        await SMS.sendSMSAsync(
          [phoneNumber],
          'Hey! Join me on Aqualyn, the best messaging app. https://aqualyn.io/invite'
        );
      } else {
        await Share.share({
          title: 'Join Aqualyn',
          message: 'Hey! Join me on Aqualyn, the best messaging app. https://aqualyn.io/invite',
        });
      }
    } catch (error) {
      addToast('Could not open share sheet', 'error');
    }
  };

  // Dynamic lists derived from current user relationships and global state
  const getFilteredList = () => {
    const query = searchQuery.toLowerCase();

    if (activeTab === 'contacts') {
      // Get app contacts
      const appContacts = contacts.map(c => ({
         ...c,
         isDeviceOnly: false,
         phoneNumber: c.phone
      }));
      
      // Get device contacts not in app contacts
      // For simplicity, we just filter out device contacts whose name matches an app contact
      // or whose phone matches (if we have phone numbers for app contacts)
      const appContactNames = new Set(appContacts.map(c => c.name?.toLowerCase()));
      const unmappedDeviceContacts = deviceContacts
         .filter(dc => dc.name && !appContactNames.has(dc.name.toLowerCase()))
         .map(dc => ({
            id: `device-${dc.id}`,
            name: dc.name,
            avatar: dc.imageAvailable && dc.image ? dc.image.uri : `https://ui-avatars.com/api/?background=random&name=${dc.name}`,
            role: 'From Device Contacts',
            isDeviceOnly: true,
            phoneNumber: dc.phoneNumbers?.[0]?.number
         }));

      return [...appContacts, ...unmappedDeviceContacts].filter(c => (c.name || '').toLowerCase().includes(query));
    }

    if (activeTab === 'followers') {
      const followerIds = currentUser?.followers || [];
      return globalUsers
        .filter(u => followerIds.includes(u.id))
        .map(u => ({
          id: u.id,
          name: u.displayName || u.username || 'Follower',
          avatar: u.avatar || `https://ui-avatars.com/api/?background=random&name=${u.username || 'F'}`,
          role: u.bio || 'Follower'
        }))
        .filter(c => c.name.toLowerCase().includes(query));
    }

    if (activeTab === 'following') {
      const followingIds = currentUser?.following || [];
      return globalUsers
        .filter(u => followingIds.includes(u.id))
        .map(u => ({
          id: u.id,
          name: u.displayName || u.username || 'Following',
          avatar: u.avatar || `https://ui-avatars.com/api/?background=random&name=${u.username || 'F'}`,
          role: u.bio || 'Following'
        }))
        .filter(c => c.name.toLowerCase().includes(query));
    }

    return [];
  };

  const currentList = getFilteredList();

  const renderSkeletonContact = (index: number) => (
    <View key={index} style={styles.skeletonCard}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonMeta}>
        <View style={[styles.skeletonLine, { width: '40%' }]} />
        <View style={[styles.skeletonLine, { width: '60%', marginTop: 8 }]} />
      </View>
    </View>
  );

  return (
    <Animated.View  style={styles.screenContainer}>
      
      {/* Absolute Sticky Header Block */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerToolbar}>
          <Text style={styles.headerTitleText}>Contacts</Text>
          <View style={styles.headerActionRow}>
            <TouchableOpacity onPress={handleInvite} style={styles.headerIconBtn}>
              <Share2 size={22} color="#0891b2" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsAddContactOpen(true)} style={styles.headerIconBtn}>
              <UserPlus size={22} color="#0891b2" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Container Streams */}
      <ScrollView 
        contentContainerStyle={[styles.mainScroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Invite & Sync Quick Actions Grid */}
        <View style={styles.actionsGridRow}>
          <TouchableOpacity onPress={handleInvite} style={[styles.actionCard, styles.actionCardSecondary]}>
            <View style={[styles.actionIconBox, styles.actionIconBoxSecondary]}>
              <Share2 size={20} color="#0891b2" />
            </View>
            <Text style={[styles.actionCardLabelText, styles.textSecondary]}>Invite Friends</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={syncContacts} style={[styles.actionCard, styles.actionCardPrimary]}>
            <View style={[styles.actionIconBox, styles.actionIconBoxPrimary]}>
              <RefreshCw size={20} color="#0057bd" />
            </View>
            <Text style={[styles.actionCardLabelText, styles.textPrimary]}>Sync Contacts</Text>
          </TouchableOpacity>
        </View>

        {/* Global Search Bar Layer */}
        <View style={styles.searchBoxWrapper}>
          <Search size={20} color="#94a3b8" style={styles.searchIconLeft} />
          <TextInput
            style={styles.searchBarInputField}
            placeholder="Search globally by name or username..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Segmented Tab Row */}
        <View style={styles.tabsNavbarRow}>
          <TouchableOpacity 
            onPress={() => { setActiveTab('contacts'); setSearchQuery(''); }}
            style={styles.tabNavItemBtn}
          >
            <Text style={[styles.tabNavItemLabel, activeTab === 'contacts' ? styles.tabLabelActive : styles.tabLabelInactive]}>
              All Contacts ({contacts.length})
            </Text>
            {activeTab === 'contacts' && <Animated.View layout={Layout} style={styles.tabActiveIndicatorLine} />}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => { setActiveTab('followers'); setSearchQuery(''); }}
            style={styles.tabNavItemBtn}
          >
            <Text style={[styles.tabNavItemLabel, activeTab === 'followers' ? styles.tabLabelActive : styles.tabLabelInactive]}>
              Followers ({currentUser?._count?.followers ?? currentUser?.followers?.length ?? 0})
            </Text>
            {activeTab === 'followers' && <Animated.View layout={Layout} style={styles.tabActiveIndicatorLine} />}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => { setActiveTab('following'); setSearchQuery(''); }}
            style={styles.tabNavItemBtn}
          >
            <Text style={[styles.tabNavItemLabel, activeTab === 'following' ? styles.tabLabelActive : styles.tabLabelInactive]}>
              Following ({currentUser?._count?.following ?? currentUser?.following?.length ?? 0})
            </Text>
            {activeTab === 'following' && <Animated.View layout={Layout} style={styles.tabActiveIndicatorLine} />}
          </TouchableOpacity>
        </View>

        {/* Content Streams Renderer Switch */}
        {isLoading ? (
          <View style={styles.skeletonListGroup}>
            {[1, 2, 3, 4, 5].map((i) => renderSkeletonContact(i))}
          </View>
        ) : currentList.length === 0 ? (
          <View style={styles.emptyStateContainerBox}>
            <Users size={44} color="#94a3b8" style={styles.emptyStateIcon} />
            <Text style={styles.emptyStateHeadingText}>No results found in {activeTab}</Text>
            <Text style={styles.emptyStateSubtextText}>Try a different search query or update your lists.</Text>
          </View>
        ) : (
          <View style={styles.contactsListGroupColumn}>
            {currentList.map((contact: any) => (
              <TouchableOpacity
                key={contact.id}
                onPress={() => contact.isDeviceOnly ? handleInvite(contact.phoneNumber) : handleContactClick(contact.id)}
                style={styles.contactItemCardRow}
              >
                <View style={styles.contactAvatarFrameBox}>
                  <Image source={{ uri: contact.avatar }} style={styles.contactAvatarImage} />
                </View>
                <View style={styles.contactMetaInfoBlock}>
                  <Text numberOfLines={1} style={styles.contactNameHeadlineText}>
                    {contact.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.contactSubtitleRoleText}>
                    {contact.role}
                  </Text>
                </View>
                {contact.isDeviceOnly && (
                  <TouchableOpacity onPress={() => handleInvite(contact.phoneNumber)} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f1f5f9', borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#0057bd' }}>Invite</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Auxiliary Operation Add Contact Overlay Module */}
      <AddContactModal 
        isOpen={isAddContactOpen} 
        onClose={() => setIsAddContactOpen(false)}
        addContact={(name: string, phone: string, id: string, avatar: string) => {
          addToast('Contact added', 'success');
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#f8fafc' },
  
  // Header Dock Structure Layout
  headerContainer: {
    backgroundColor: 'rgba(248,250,252,0.85)',
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    zIndex: 50
  },
  headerToolbar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24
  },
  headerTitleText: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  headerActionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconBtn: { padding: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.7)' },

  // Scroll Area Layout Base
  mainScroll: { paddingHorizontal: 16, paddingTop: 20 },

  // Dual Quick Actions Grid
  actionsGridRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionCard: { flex: 1, padding: 16, borderRadius: 24, alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  actionCardSecondary: { backgroundColor: 'rgba(8,145,178,0.03)', borderColor: 'rgba(8,145,178,0.08)' },
  actionCardPrimary: { backgroundColor: 'rgba(0,87,189,0.03)', borderColor: 'rgba(0,87,189,0.08)' },
  actionIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionIconBoxSecondary: { backgroundColor: 'rgba(8,145,178,0.08)' },
  actionIconBoxPrimary: { backgroundColor: 'rgba(0,87,189,0.08)' },
  actionCardLabelText: { fontSize: 12, fontWeight: '800', letterSpacing: -0.1 },
  textSecondary: { color: '#0891b2' },
  textPrimary: { color: '#0057bd' },

  // Search Engine container styles
  searchBoxWrapper: { position: 'relative', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, borderColor: '#e2e8f0', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 3, elevation: 1, marginBottom: 24 },
  searchIconLeft: { position: 'absolute', left: 16 },
  searchBarInputField: { flex: 1, height: 48, paddingLeft: 48, paddingRight: 44, fontSize: 14, color: '#0f172a' },
  searchClearBtn: { position: 'absolute', right: 14, padding: 4 },

  // Segment Tab Bar Navbar Row Components
  tabsNavbarRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  tabNavItemBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', position: 'relative' },
  tabNavItemLabel: { fontSize: 13, fontWeight: '700' },
  tabLabelActive: { color: '#0057bd' },
  tabLabelInactive: { color: '#64748b' },
  tabActiveIndicatorLine: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 3, backgroundColor: '#0057bd', borderRadius: 99 },

  // Contact Grid Dynamic Components
  contactsListGroupColumn: { gap: 8 },
  contactItemCardRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.01, shadowRadius: 2, elevation: 1 },
  contactAvatarFrameBox: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  contactAvatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  contactMetaInfoBlock: { flex: 1, marginLeft: 16, borderBottomWidth: 1, borderColor: '#f8fafc', paddingBottom: 4 },
  contactNameHeadlineText: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  contactSubtitleRoleText: { fontSize: 13, color: '#64748b', marginTop: 2 },

  // Empty View State Elements Fallback
  emptyStateContainerBox: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  emptyStateIcon: { marginBottom: 12, opacity: 0.5 },
  emptyStateHeadingText: { fontSize: 15, fontWeight: '600', color: '#475569', textAlign: 'center' },
  emptyStateSubtextText: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 4 },

  // Skeleton UI components
  skeletonListGroup: { gap: 8 },
  skeletonCard: { flexDirection: 'row', padding: 14, backgroundColor: '#fff', borderRadius: 20, alignItems: 'center' },
  skeletonAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f1f5f9' },
  skeletonMeta: { flex: 1, marginLeft: 16 },
  skeletonLine: { height: 12, backgroundColor: '#f1f5f9', borderRadius: 6 }
});