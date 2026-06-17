import BubbleLoader from '../components/ui/BubbleLoader';
import React, { useState, useRef } from 'react';
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
  Switch
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Save, Camera, ChevronDown } from 'lucide-react-native';

import { useAppContext } from '../context/AppContext';
import { ENDPOINTS } from '../config/api';
import { apiFetch } from '../utils/fetcher';
import { uploadFile } from '../utils/uploads';

interface Props {
  onBack: () => void;
}

const VISIBILITY_OPTIONS = [
  { id: 'everyone', label: 'Everyone' },
  { id: 'contacts', label: 'My Contacts' },
  { id: 'nobody', label: 'Nobody' }
];

export default function EditProfileScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { currentUser, setCurrentUser, addToast } = useAppContext();
  
  const [name, setName] = useState(currentUser?.displayName || currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [role, setRole] = useState(currentUser?.role || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [showPhoneTo, setShowPhoneTo] = useState<string>(currentUser?.showPhoneTo || 'everyone');
  const [searchByPhone, setSearchByPhone] = useState(currentUser?.searchByPhone ?? true);
  const [avatar, setAvatar] = useState(currentUser?.largeAvatar || currentUser?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleAvatarPick = async () => {
    // Pipeline connection placeholder: connect to your preferred image picker library
    // e.g., expo-image-picker or react-native-image-crop-picker
    addToast('Triggering native media system picker...', 'info');
  };

  const handleSave = async () => {
    if (!name.trim() || !username.trim()) {
      addToast('Name and username are required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiFetch(ENDPOINTS.UPDATE_PROFILE, {
        method: 'PUT',
        body: JSON.stringify({
          displayName: name,
          username,
          role,
          bio,
          phone,
          showPhoneTo,
          searchByPhone,
          avatar
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setCurrentUser(updatedUser);
        addToast('Profile updated successfully!', 'success');
        onBack();
      } else {
        const errData = await response.json();
        addToast(errData.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error(error);
      addToast('An error occurred while saving profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const currentVisibilityLabel = VISIBILITY_OPTIONS.find(opt => opt.id === showPhoneTo)?.label || 'Everyone';

  return (
    <Animated.View entering={FadeIn} style={styles.screenContainer}>
      
      {/* Header Dock Assembly */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerToolbar}>
          <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
            <ArrowLeft size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Edit Profile</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={isSaving}
            style={[styles.headerSaveBtn, isSaving && styles.btnDisabled]}
          >
            {isSaving ? (
              <BubbleLoader size={24} />
            ) : (
              <>
                <Save size={18} color="#fff" />
                <Text style={styles.headerSaveText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Inputs Scroll Body */}
      <ScrollView 
        contentContainerStyle={[styles.mainScrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* Avatar Setup Section */}
        <View style={styles.avatarSetupCenterDeck}>
          <View style={styles.avatarMainFrame}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImageContent} />
            ) : (
              <View style={styles.avatarFallbackBox}>
                <Text style={styles.avatarInitialsText}>
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            {isUploadingAvatar && (
              <View style={styles.avatarLoadingOverlay}>
                <BubbleLoader size={24} />
              </View>
            )}
            <TouchableOpacity onPress={handleAvatarPick} style={styles.avatarPickerBadgeBtn}>
              <Camera size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHelperText}>Tap camera icon to update profile picture</Text>
        </View>

        {/* Global Account Credentials Group Card */}
        <View style={styles.inputGroupGlassCard}>
          <View style={styles.cardHeaderPadding}>
            <Text style={styles.cardSectionLabelTitle}>Profile Information</Text>
          </View>

          <View style={styles.fieldItemWrapper}>
            <Text style={styles.fieldInputLabelText}>Full Name</Text>
            <TextInput
              style={styles.fieldTextInputBox}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.fieldItemWrapper}>
            <Text style={styles.fieldInputLabelText}>Username</Text>
            <TextInput
              style={styles.fieldTextInputBox}
              value={username}
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldItemWrapper}>
            <Text style={styles.fieldInputLabelText}>Role / Profession</Text>
            <TextInput
              style={styles.fieldTextInputBox}
              value={role}
              onChangeText={setRole}
              placeholder="e.g. Senior Software Engineer"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={[styles.fieldItemWrapper, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldInputLabelText}>Bio Description</Text>
            <TextInput
              style={[styles.fieldTextInputBox, styles.fieldMultilineInputBox]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Sensitive Security & Privacy Matrix Layer Card */}
        <View style={styles.inputGroupGlassCard}>
          <View style={styles.cardHeaderPadding}>
            <Text style={styles.cardSectionLabelTitle}>Privacy & Security Settings</Text>
          </View>

          <View style={styles.fieldItemWrapper}>
            <Text style={styles.fieldInputLabelText}>Phone Number</Text>
            <TextInput
              style={styles.fieldTextInputBox}
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (234) 567-8900"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
            />
          </View>

          {/* Custom Context Dropdown Trigger */}
          <View style={styles.dropdownFieldWrapper}>
            <View style={styles.dropdownMetadataTexts}>
              <Text style={styles.dropdownMainLabel}>Show Phone Number To</Text>
              <Text style={styles.dropdownSubtitleHelper}>Manage who can see your mobile connection</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              style={styles.dropdownTriggerInteractiveBox}
            >
              <Text style={styles.dropdownTriggerSelectionText}>{currentVisibilityLabel}</Text>
              <ChevronDown size={16} color="#475569" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {/* Animate Dropdown Option Menu Items list */}
          {isDropdownOpen && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.dropdownMenuOptionsListTrack}>
              {VISIBILITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => {
                    setShowPhoneTo(opt.id);
                    setIsDropdownOpen(false);
                  }}
                  style={[
                    styles.dropdownMenuInteractiveItem,
                    showPhoneTo === opt.id && styles.dropdownItemActiveBackground
                  ]}
                >
                  <Text style={[
                    styles.dropdownItemLabelText,
                    showPhoneTo === opt.id ? styles.textActiveWhite : styles.textInactiveSlate
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {/* Global Phone Search Privacy Switch Option Toggle Layout */}
          <View style={styles.toggleRowInteractiveContainer}>
            <View style={styles.toggleRowMetadataTexts}>
              <Text style={styles.toggleMainLabelTitle}>Search by Phone</Text>
              <Text style={styles.toggleSubtitleHelperDesc}>
                Allow users to find your account by searching this mobile number globally.
              </Text>
            </View>
            <Switch
              value={searchByPhone}
              onValueChange={setSearchByPhone}
              trackColor={{ false: '#e2e8f0', true: '#0891b2' }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : searchByPhone ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#f8fafc' },
  
  // Custom Header Navigation Assembly layout structures
  headerContainer: {
    backgroundColor: 'rgba(248,250,252,0.85)',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    zIndex: 100
  },
  headerToolbar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  headerBackBtn: { padding: 8, borderRadius: 99 },
  headerTitleText: { fontSize: 18, fontWeight: '900', color: '#0f172a', letterSpacing: -0.3 },
  headerSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0057bd',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#0057bd',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3
  },
  headerSaveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  btnDisabled: { opacity: 0.6 },

  // Scroll Area Layout Properties
  mainScrollContent: { paddingHorizontal: 16, paddingTop: 24 },

  // Profile Custom Avatar Components Matrix
  avatarSetupCenterDeck: { alignItems: 'center', marginBottom: 28 },
  avatarMainFrame: { position: 'relative', width: 110, height: 110, borderRadius: 55, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  avatarImageContent: { width: '100%', height: '100%', borderRadius: 55, resizeMode: 'cover' },
  avatarFallbackBox: { width: '100%', height: '100%', borderRadius: 55, backgroundColor: '#0891b2', justifyContent: 'center', alignItems: 'center' },
  avatarInitialsText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  avatarLoadingOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  avatarPickerBadgeBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0057bd', padding: 8, borderRadius: 99, borderWidth: 3, borderColor: '#f8fafc', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  avatarHelperText: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 10 },

  // Group Input Containers Framing
  inputGroupGlassCard: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.01, shadowRadius: 4, elevation: 1, marginBottom: 20 },
  cardHeaderPadding: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 },
  cardSectionLabelTitle: { fontSize: 11, fontWeight: '800', color: '#0057bd', textTransform: 'uppercase', letterSpacing: 0.6 },
  
  // Layout components input fields lines
  fieldItemWrapper: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  fieldInputLabelText: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6 },
  fieldTextInputBox: { height: 44, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: '#0f172a' },
  fieldMultilineInputBox: { height: 80, paddingTop: 10, paddingBottom: 10 },

  // Dropdown Component Assemblies Matrix Custom Layouts
  dropdownFieldWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  dropdownMetadataTexts: { flex: 1, paddingRight: 16 },
  dropdownMainLabel: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  dropdownSubtitleHelper: { fontSize: 11, color: '#64748b', marginTop: 2 },
  dropdownTriggerInteractiveBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  dropdownTriggerSelectionText: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  dropdownMenuOptionsListTrack: { backgroundColor: '#f8fafc', padding: 8, borderBottomWidth: 1, borderColor: '#f1f5f9', gap: 4 },
  dropdownMenuInteractiveItem: { width: '100%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  dropdownItemActiveBackground: { backgroundColor: '#0891b2' },
  dropdownItemLabelText: { fontSize: 13, fontWeight: '700' },
  textActiveWhite: { color: '#fff' },
  textInactiveSlate: { color: '#334155' },

  // Switch Toggle Row Structure Design Parameters
  toggleRowInteractiveContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  toggleRowMetadataTexts: { flex: 1, paddingRight: 24 },
  toggleMainLabelTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  toggleSubtitleHelperDesc: { fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 15 }
});