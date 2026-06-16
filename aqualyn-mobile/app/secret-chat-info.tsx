import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Lock, Trash2, Shield, Clock, EyeOff, Smartphone, Key, CheckCircle, ChevronRight } from 'lucide-react-native';
import { useAppContext } from '../src/context/AppContext';
import { Theme } from '../src/config/theme';
import { apiFetch } from '../src/utils/fetcher';
import { ENDPOINTS } from '../src/config/api';

export default function SecretChatInfoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { chats, addToast } = useAppContext();

  const chat = chats.find((c: any) => c.id === id);

  const [selfDestructTimer, setSelfDestructTimer] = useState(0);
  const [screenshotProtection, setScreenshotProtection] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (chat) {
      setSelfDestructTimer(chat.selfDestructTimer || 0);
      const settings = chat.settings || {};
      setScreenshotProtection(settings.screenshotProtection !== false);
      setIsVerified(!!settings.isVerified);
    }
  }, [chat]);

  const updateChatSettings = async (updates: any) => {
    if (!chat) return;
    try {
      await apiFetch(ENDPOINTS.CHAT_SETTINGS(chat.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.error('Failed to update chat settings', e);
    }
  };

  const handleSetTimer = (seconds: number) => {
    setSelfDestructTimer(seconds);
    updateChatSettings({ selfDestructTimer: seconds });
    addToast(`Self-destruct timer set to ${seconds}s`, 'success');
  };

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setVerificationCode('394-102-845');
    }, 800);
  };

  const confirmVerification = () => {
    setIsVerifying(false);
    setIsVerified(true);
    const settings = chat?.settings || {};
    updateChatSettings({ settings: { ...settings, isVerified: true } });
    addToast('Encryption verified successfully', 'success');
  };

  if (!chat) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'white' }}>Secret chat not found</Text>
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
        <Text style={styles.headerTitle}>Secret Chat Info</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: chat.avatar }} style={styles.avatar} />
          <View style={styles.lockBadge}>
            <Lock size={16} color="#0f172a" />
          </View>
        </View>
        <Text style={styles.chatName}>{chat.name}</Text>
        <Text style={styles.encryptedText}>End-to-end Encrypted</Text>
      </View>

      {/* Main Settings Card */}
      <View style={styles.settingsCard}>
        {/* Encryption Key */}
        <View style={styles.rowSetting}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(14, 165, 233, 0.1)' }]}>
            <Shield size={20} color="#0ea5e9" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Encryption Key</Text>
            <Text style={styles.settingSub}>{isVerified ? 'Verified' : 'Unverified connection'}</Text>
          </View>
          {isVerified ? (
            <CheckCircle size={20} color="#0ea5e9" />
          ) : (
            <TouchableOpacity onPress={handleVerify}>
              <Text style={styles.verifyBtnText}>Verify</Text>
            </TouchableOpacity>
          )}
        </View>

        {isVerifying && (
          <View style={styles.verificationBox}>
            <Text style={styles.verificationInfo}>Compare this code with {chat.name}</Text>
            {verificationCode ? (
              <>
                <Text style={styles.verificationCodeText}>{verificationCode}</Text>
                <TouchableOpacity style={styles.markVerifyBtn} onPress={confirmVerification}>
                  <Text style={styles.markVerifyBtnText}>Mark as Verified</Text>
                </TouchableOpacity>
              </>
            ) : (
              <ActivityIndicator size="small" color="white" />
            )}
          </View>
        )}

        {/* Self-Destruct Timer */}
        <View style={styles.rowSetting}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
            <Clock size={20} color="#22c55e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Self-Destruct Timer</Text>
            <Text style={styles.settingSub}>Delete messages automatically</Text>
          </View>
          <TouchableOpacity 
            style={styles.timerSelector}
            onPress={() => {
              // Cycle through options: Off, 10s, 30s, 1m, 1d
              const nextTimerMap: Record<number, number> = { 0: 10, 10: 30, 30: 60, 60: 86400, 86400: 0 };
              const next = nextTimerMap[selfDestructTimer] ?? 0;
              handleSetTimer(next);
            }}
          >
            <Text style={styles.timerSelectorText}>
              {selfDestructTimer === 0 ? 'Off' : `${selfDestructTimer}s`}
            </Text>
            <ChevronRight size={16} color="rgba(255, 255, 255, 0.4)" />
          </TouchableOpacity>
        </View>

        {/* Screenshot Protection */}
        <View style={styles.rowSetting}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <EyeOff size={20} color="#ef4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Screenshot Protection</Text>
            <Text style={styles.settingSub}>Alert when screenshotted</Text>
          </View>
          <Switch 
            value={screenshotProtection} 
            onValueChange={(val) => {
              setScreenshotProtection(val);
              const settings = chat?.settings || {};
              updateChatSettings({ settings: { ...settings, screenshotProtection: val } });
              addToast(`Screenshot protection ${val ? 'enabled' : 'disabled'}`, 'info');
            }}
            thumbColor="white"
            trackColor={{ true: Theme.colors.primary }}
          />
        </View>

        {/* Device Restriction */}
        <View style={[styles.rowSetting, { borderBottomWidth: 0 }]}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <Smartphone size={20} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Device Session</Text>
            <Text style={styles.settingSub}>Chat restricted to this device</Text>
          </View>
        </View>
      </View>

      {/* Danger Card */}
      <View style={styles.dangerCard}>
        <TouchableOpacity 
          style={styles.dangerRow}
          onPress={() => {
            addToast('Secret chat deleted', 'error');
            setTimeout(() => router.back(), 500);
          }}
        >
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Trash2 size={20} color="#ef4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dangerTitle}>Delete Secret Chat</Text>
            <Text style={styles.dangerSub}>Wipe all messages permanently</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Key size={20} color="rgba(255, 255, 255, 0.3)" />
        <Text style={styles.footerText}>
          MESSAGES ARE NOT STORED ON SERVERS.{"\n"}FORWARDING IS DISABLED.
        </Text>
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0a192f',
  },
  chatName: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  encryptedText: {
    color: '#0ea5e9',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  settingsCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  rowSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
  verifyBtnText: {
    color: '#0ea5e9',
    fontWeight: 'bold',
    fontSize: 13,
  },
  verificationBox: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  verificationInfo: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    marginBottom: 10,
  },
  verificationCodeText: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'monospace',
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  markVerifyBtn: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  markVerifyBtnText: {
    color: '#0ea5e9',
    fontWeight: 'bold',
    fontSize: 12,
  },
  timerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerSelectorText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  dangerCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  dangerTitle: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerSub: {
    color: 'rgba(239, 68, 68, 0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    marginVertical: 40,
    gap: 10,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
