import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Shield, Smartphone, Download, Trash2, MonitorSmartphone, Lock, Key, X } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import DeactivateAccountModal from '../modals/DeactivateAccountModal';
import { apiFetch } from '../../utils/fetcher';
import { ENDPOINTS } from '../../config/api';

export default function SecuritySettings() {
  const { appLockPin, setAppLockPin, archiveLockPin, setArchiveLockPin, addToast, currentUser, updateSettings, updatePrivacy } = useAppContext();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinType, setPinType] = useState<'app' | 'archive'>('app');
  const [pinValue, setPinValue] = useState('');
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  
  const [invitationSetting, setInvitationSetting] = useState<'everyone' | 'mutual' | 'no_one'>(
    (currentUser?.invitationSettings as 'everyone' | 'mutual' | 'no_one') || 'everyone'
  );

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await apiFetch(ENDPOINTS.SESSIONS);
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSessions(false);
    }
  };

  const revokeSession = async (id: string) => {
    try {
      const res = await apiFetch(`${ENDPOINTS.SESSIONS}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
        addToast('Session revoked', 'success');
      }
    } catch (e) {
      addToast('Failed to revoke session', 'error');
    }
  };

  const handleExport = async () => {
    try {
      const res = await apiFetch(ENDPOINTS.EXPORT_DATA, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        addToast(data.message, 'success');
      }
    } catch (e) {
      addToast('Failed to initiate export', 'error');
    }
  };

  const updateInvitationSetting = async (option: 'everyone' | 'mutual' | 'no_one') => {
    setInvitationSetting(option);
    await updatePrivacy({ invitationSettings: option });
  };

  const handleSetPin = async () => {
    if (pinValue.length < 4) {
      addToast('PIN must be at least 4 digits', 'error');
      return;
    }
    
    try {
      const settingsKey = pinType === 'app' ? 'appLockPin' : 'archiveLockPin';
      await updateSettings({
        security: { [settingsKey]: pinValue }
      });
      
      if (pinType === 'app') setAppLockPin(pinValue);
      else setArchiveLockPin(pinValue);
      
      addToast(`${pinType === 'app' ? 'App' : 'Archive'} PIN set successfully`, 'success');
      setIsPinModalOpen(false);
      setPinValue('');
    } catch (e) {
      addToast('Failed to set PIN', 'error');
    }
  };

  useEffect(() => {
    const s = currentUser?.settings?.security;
    if (s?.appLockPin) setAppLockPin(s.appLockPin);
    if (s?.archiveLockPin) setArchiveLockPin(s.archiveLockPin);
  }, [currentUser, setAppLockPin, setArchiveLockPin]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.flex1}>
      <View style={styles.titleRow}>
        <Shield size={20} color="#6366f1" />
        <Text style={styles.titleText}>Security & Data</Text>
      </View>
      
      <View style={styles.card}>
        {/* App Lock */}
        <TouchableOpacity 
          onPress={() => { setPinType('app'); setIsPinModalOpen(true); }}
          style={styles.itemRow}
          activeOpacity={0.7}
        >
          <View style={styles.itemLeft}>
            <View style={[styles.iconContainer, styles.bgIndigo]}>
              <Lock size={20} color="#6366f1" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>App Lock</Text>
              <Text style={styles.itemDesc}>{appLockPin ? 'PIN is set' : 'Protect app with a PIN'}</Text>
            </View>
          </View>
          {appLockPin && <Text style={styles.activeBadge}>Active</Text>}
        </TouchableOpacity>

        {/* Archive Lock */}
        <TouchableOpacity 
          onPress={() => { setPinType('archive'); setIsPinModalOpen(true); }}
          style={styles.itemRow}
          activeOpacity={0.7}
        >
          <View style={styles.itemLeft}>
            <View style={[styles.iconContainer, styles.bgAmber]}>
              <Key size={20} color="#d97706" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>Archive Lock</Text>
              <Text style={styles.itemDesc}>{archiveLockPin ? 'PIN is set' : 'Lock archived chats with a PIN'}</Text>
            </View>
          </View>
          {archiveLockPin && <Text style={styles.activeBadge}>Active</Text>}
        </TouchableOpacity>

        {/* Linked Devices */}
        <TouchableOpacity 
          onPress={() => { setShowSessions(true); fetchSessions(); }}
          style={styles.itemRow}
          activeOpacity={0.7}
        >
          <View style={styles.itemLeft}>
            <View style={[styles.iconContainer, styles.bgIndigo]}>
              <MonitorSmartphone size={20} color="#6366f1" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>Linked Devices</Text>
              <Text style={styles.itemDesc}>Use Aqualyn on desktop or web</Text>
            </View>
          </View>
          <Text style={styles.devicesBadge}>
            {loadingSessions ? '...' : `${sessions.length || 'No'} Devices`}
          </Text>
        </TouchableOpacity>
        
        {/* Export Data */}
        <TouchableOpacity onPress={handleExport} style={styles.itemRow} activeOpacity={0.7}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconContainer, styles.bgEmerald]}>
              <Download size={20} color="#10b981" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>Export Data</Text>
              <Text style={styles.itemDesc}>Download all your chats and media</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Deactivate Account */}
        <TouchableOpacity onPress={() => setIsDeactivateModalOpen(true)} style={[styles.itemRow, styles.lastItemRow]} activeOpacity={0.7}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconContainer, styles.bgRed]}>
              <Trash2 size={20} color="#ef4444" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitleRed}>Deactivate Account</Text>
              <Text style={styles.itemDescRed}>Permanently delete your data</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Privacy Block */}
      <View style={[styles.titleRow, styles.marginTopContainer]}>
        <Smartphone size={20} color="#6366f1" />
        <Text style={styles.titleText}>Privacy Settings</Text>
      </View>
      <View style={styles.privacyCard}>
        <Text style={styles.privacyQuestion}>Who can call me into a chat (@username)?</Text>
        <View style={styles.optionsRow}>
          {(['everyone', 'mutual', 'no_one'] as const).map(option => (
            <TouchableOpacity 
              key={option}
              onPress={() => updateInvitationSetting(option)}
              style={[
                styles.optionButton,
                invitationSetting === option ? styles.optionButtonActive : styles.optionButtonInactive
              ]}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.optionButtonText,
                invitationSetting === option ? styles.optionButtonTextActive : styles.optionButtonTextInactive
              ]}>
                {option.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.privacyDescription}>
          When someone mentions your @username in a 1-to-1 chat, you'll receive an invitation to join. 
          Joining turns the chat into a temporary group without showing previous history.
        </Text>
      </View>

      {/* PIN Code Overlay Modal */}
      <Modal visible={isPinModalOpen} transparent animationType="fade" onRequestClose={() => setIsPinModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set {pinType === 'app' ? 'App' : 'Archive'} PIN</Text>
            <Text style={styles.modalSubtitle}>Enter a 4-digit PIN to secure your {pinType === 'app' ? 'application' : 'archived chats'}.</Text>
            
            <TextInput 
              secureTextEntry
              maxLength={4}
              keyboardType="number-pad"
              value={pinValue}
              onChangeText={(txt) => setPinValue(txt.replace(/\D/g, ''))}
              placeholder="••••"
              placeholderTextColor="#94A3B8"
              style={styles.pinInput}
            />
            
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity onPress={() => setIsPinModalOpen(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSetPin} style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Set PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Linked Sessions Overlay Modal */}
      <Modal visible={showSessions} transparent animationType="fade" onRequestClose={() => setShowSessions(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sessionsModalContent}>
            <View style={styles.sessionsHeader}>
              <Text style={styles.modalTitle}>Active Sessions</Text>
              <TouchableOpacity onPress={() => setShowSessions(false)} style={styles.closeSessionsButton}>
                <X size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.sessionsList} style={styles.flex1}>
              {loadingSessions ? (
                 <View style={styles.loadingContainer}>
                   <ActivityIndicator size="large" color="#0284C7" />
                 </View>
              ) : sessions.length === 0 ? (
                <Text style={styles.noSessionsText}>No other active sessions found.</Text>
              ) : sessions.map(s => (
                <View key={s.id} style={styles.sessionItem}>
                  <View>
                    <Text style={styles.sessionDevice}>{s.device || 'Unknown Device'}</Text>
                    <Text style={styles.sessionDate}>Added: {new Date(s.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => revokeSession(s.id)} style={styles.revokeButton}>
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DeactivateAccountModal isOpen={isDeactivateModalOpen} onClose={() => setIsDeactivateModalOpen(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastItemRow: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgIndigo: {
    backgroundColor: '#e0e7ff',
  },
  bgAmber: {
    backgroundColor: '#fef3c7',
  },
  bgEmerald: {
    backgroundColor: '#d1fae5',
  },
  bgRed: {
    backgroundColor: '#fee2e2',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  itemTitleRed: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  itemDesc: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  itemDescRed: {
    fontSize: 14,
    color: 'rgba(239, 68, 68, 0.8)',
    marginTop: 2,
  },
  activeBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  devicesBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#e0e7ff',
    color: '#4f46e5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  marginTopContainer: {
    marginTop: 24,
  },
  privacyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 32,
    padding: 20,
    gap: 16,
  },
  privacyQuestion: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  optionButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  optionButtonTextActive: {
    color: '#ffffff',
  },
  optionButtonTextInactive: {
    color: '#64748b',
  },
  privacyDescription: {
    fontSize: 10,
    color: '#64748b',
    paddingHorizontal: 4,
    fontWeight: '500',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 40,
    padding: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  pinInput: {
    width: '100%',
    height: 64,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 'bold',
    borderRadius: 16,
    backgroundColor: 'rgba(241, 245, 249, 0.5)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
    letterSpacing: 8,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    fontWeight: 'bold',
    color: '#64748b',
  },
  submitButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  sessionsModalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 40,
    padding: 32,
    flexDirection: 'column',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  sessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeSessionsButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
  },
  sessionsList: {
    gap: 12,
    paddingRight: 8,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  noSessionsText: {
    textAlign: 'center',
    paddingVertical: 48,
    color: '#64748b',
  },
  sessionItem: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(241, 245, 249, 0.5)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionDevice: {
    fontWeight: 'bold',
    color: '#0f172a',
    fontSize: 16,
  },
  sessionDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  revokeButton: {
    padding: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
});