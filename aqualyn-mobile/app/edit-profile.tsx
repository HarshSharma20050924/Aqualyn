import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Switch, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save, Camera, ChevronDown } from 'lucide-react-native';
import { useAppContext } from '../src/context/AppContext';
import { ENDPOINTS } from '../src/config/api';
import { apiFetch } from '../src/utils/fetcher';
import { Theme } from '../src/config/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { currentUser, setCurrentUser, addToast } = useAppContext();

  const [name, setName] = useState(currentUser?.displayName || currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [role, setRole] = useState(currentUser?.role || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [showPhoneTo, setShowPhoneTo] = useState(currentUser?.showPhoneTo || 'everyone');
  const [searchByPhone, setSearchByPhone] = useState(currentUser?.searchByPhone ?? true);
  const [avatar, setAvatar] = useState(currentUser?.largeAvatar || currentUser?.avatar || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showPrivacyPicker, setShowPrivacyPicker] = useState(false);

  if (!currentUser) return null;

  const handleUsernameChange = (val: string) => {
    setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  };

  const handleSave = async () => {
    if (!username) {
      addToast('Username cannot be empty', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const res = await apiFetch(ENDPOINTS.AUTH_SYNC, {
        method: 'POST',
        body: JSON.stringify({ 
          displayName: name, username, bio, role, avatar, phone, showPhoneTo, searchByPhone 
        })
      });
      if (!res.ok) {
        if (res.status === 409) {
          addToast('Username already taken', 'error');
          setIsSaving(false);
          return;
        }
        throw new Error('Failed to save');
      }
      const data = await res.json();
      setCurrentUser(data.user);
      addToast('Profile updated successfully', 'success');
      router.back();
    } catch (e) {
      addToast('Error saving profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectAvatar = () => {
    addToast('Camera upload is simulated on mobile', 'info');
    // Set a random avatar to simulate upload
    const mockAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    ];
    const picked = mockAvatars[Math.floor(Math.random() * mockAvatars.length)];
    setAvatar(picked);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveBtn}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#0ea5e9" />
          ) : (
            <>
              <Save size={18} color="#0ea5e9" />
              <Text style={styles.saveBtnText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={selectAvatar} style={styles.avatarWrapper}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <View style={styles.cameraIconContainer}>
            <Camera size={16} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Fields */}
      <View style={styles.fieldsContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Username</Text>
          <View style={styles.usernameWrapper}>
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              style={[styles.input, { paddingLeft: 36 }]}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="username"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              autoCapitalize="none"
            />
          </View>
          <Text style={styles.fieldHint}>
            Allows search without phone number. Lowercase letters & underscores only.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Role / Title</Text>
          <TextInput
            style={styles.input}
            value={role}
            onChangeText={setRole}
            placeholder="Software Architect"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>About</Text>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top', paddingVertical: 12 }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            multiline
          />
        </View>

        {/* Privacy Section */}
        <View style={styles.privacySection}>
          <Text style={styles.sectionTitle}>Privacy & Contact</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 000 000 0000"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Show Mobile Number To</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowPrivacyPicker(!showPrivacyPicker)}
            >
              <Text style={styles.pickerButtonText}>
                {showPhoneTo === 'everyone' ? 'Everyone' : 
                 showPhoneTo === 'followers' ? 'Followers' : 
                 showPhoneTo === 'close_friends' ? 'Close Friends' : 'No One (Private)'}
              </Text>
              <ChevronDown size={18} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>

            {showPrivacyPicker && (
              <View style={styles.pickerDropdown}>
                {[
                  { id: 'everyone', label: 'Everyone' },
                  { id: 'followers', label: 'Followers' },
                  { id: 'close_friends', label: 'Close Friends' },
                  { id: 'no_one', label: 'No One (Private)' }
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.pickerItem, showPhoneTo === opt.id && styles.pickerItemActive]}
                    onPress={() => {
                      setShowPhoneTo(opt.id as any);
                      setShowPrivacyPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, showPhoneTo === opt.id && styles.pickerItemTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Search by Phone</Text>
              <Text style={styles.toggleSub}>Allow others to find your account by phone</Text>
            </View>
            <Switch
              value={searchByPhone}
              onValueChange={setSearchByPhone}
              thumbColor="white"
              trackColor={{ true: Theme.colors.primary }}
            />
          </View>
        </View>
      </View>
    </ScrollView>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  saveBtnText: {
    color: '#0ea5e9',
    fontWeight: 'bold',
    fontSize: 15,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'white',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0a192f',
  },
  fieldsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: 'white',
    fontSize: 15,
  },
  usernameWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  atSymbol: {
    position: 'absolute',
    left: 16,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fieldHint: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  privacySection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 24,
    marginTop: 10,
  },
  sectionTitle: {
    color: '#0ea5e9',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  pickerButton: {
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  pickerDropdown: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 8,
    padding: 6,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  pickerItemActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  pickerItemText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  pickerItemTextActive: {
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  toggleTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleSub: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    marginTop: 2,
  },
});
