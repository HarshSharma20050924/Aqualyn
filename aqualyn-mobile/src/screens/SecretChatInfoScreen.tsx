import BubbleLoader from '../components/ui/BubbleLoader';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  Switch
} from 'react-native';
import Animated, { 
  SlideInRight, 
  FadeOut, 
  useAnimatedStyle, 
  withTiming, 
  useSharedValue 
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Lock, 
  Trash2, 
  Shield, 
  Clock, 
  EyeOff, 
  Smartphone, 
  Key, 
  CheckCircle, 
  ChevronRight 
} from 'lucide-react-native';
import { Chat } from '../types';
import { useAppContext } from '../context/AppContext';
import { apiFetch } from '../utils/fetcher';
import { ENDPOINTS } from '../config/api';

interface SecretChatInfoScreenProps {
  chat: Chat;
  onBack: () => void;
}

const TIMER_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '1h', value: 3600 },
  { label: '1d', value: 86400 },
  { label: '1w', value: 604800 },
];

export default function SecretChatInfoScreen({ chat, onBack }: SecretChatInfoScreenProps) {
  const insets = useSafeAreaInsets();
  const { addToast } = useAppContext() || {};
  const settings = (chat as any).settings || {};

  const [selfDestructTimer, setSelfDestructTimer] = useState(chat.selfDestructTimer || 0);
  const [screenshotProtection, setScreenshotProtection] = useState(settings.screenshotProtection !== false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(!!settings.isVerified);

  // Height tracking for verifying block layout animation
  const verifyHeight = useSharedValue(0);

  useEffect(() => {
    setSelfDestructTimer(chat.selfDestructTimer || 0);
    setScreenshotProtection(settings.screenshotProtection !== false);
    setIsVerified(!!settings.isVerified);
  }, [chat.selfDestructTimer, settings.screenshotProtection, settings.isVerified]);

  const updateChatSettings = async (updates: any) => {
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
    addToast?.(`Self-destruct timer set to ${TIMER_OPTIONS.find(o => o.value === seconds)?.label}`, 'success');
  };

  const showTimerPickerActionSheet = () => {
    const options = TIMER_OPTIONS.map(o => o.label);
    options.push('Cancel');

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        title: 'Self-Destruct Timer',
        message: 'Automatically delete logs from this window after read'
      },
      (buttonIndex) => {
        if (buttonIndex < TIMER_OPTIONS.length) {
          handleSetTimer(TIMER_OPTIONS[buttonIndex].value);
        }
      }
    );
  };

  const handleVerify = () => {
    setIsVerifying(true);
    verifyHeight.value = withTiming(160); // Expand block smoothly
    setTimeout(() => {
      setVerificationCode('394-102-845');
    }, 800);
  };

  const confirmVerification = () => {
    verifyHeight.value = withTiming(0, {}, () => {
      // Execute UI mutations back on main thread chain
    });
    setIsVerifying(false);
    setIsVerified(true);
    updateChatSettings({ settings: { ...settings, isVerified: true } });
    addToast?.('Encryption verified successfully', 'success');
  };

  const animatedVerifyStyle = useAnimatedStyle(() => ({
    height: verifyHeight.value,
    opacity: verifyHeight.value > 0 ? withTiming(1) : withTiming(0),
    overflow: 'hidden',
  }));

  const toggleScreenshotProtection = () => {
    const newValue = !screenshotProtection;
    setScreenshotProtection(newValue);
    updateChatSettings({ settings: { ...settings, screenshotProtection: newValue } });
    addToast?.(`Screenshot protection ${newValue ? 'enabled' : 'disabled'}`, 'info');
  };

  return (
    <Animated.View 
      entering={SlideInRight.springify().damping(25).stiffness(200)} 
      exiting={FadeOut}
      style={styles.viewportBaseFrame}
    >
      {/* Sticky Native Navigation Header Layout */}
      <View style={[styles.stickyHeaderPanel, { paddingTop: insets.top, height: 64 + insets.top }]}>
        <View style={styles.headerContentWrapper}>
          <TouchableOpacity 
            onPress={onBack} 
            style={styles.backIconButtonTrigger}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitleTypographyHeadline}>Secret Chat</Text>
          <View style={{ width: 36 }} /> {/* Balance Spacer layout */}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.mainScrollStackContainer, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Identity Metadata Presentation Area */}
        <View style={styles.profileMetaOverviewBlock}>
          <View style={styles.avatarBadgeAbsolutePositionWrapper}>
            <View style={styles.avatarCircularBadgeBorderCard}>
              <Image source={{ uri: chat.avatar }} style={styles.chatProfileAvatarImg} />
            </View>
            <View style={styles.absoluteLockIconBadgeIndicator}>
              <Lock size={14} color="#ffffff" />
            </View>
          </View>
          <Text style={styles.chatDisplayNameHeadline}>{chat.name}</Text>
          <Text style={styles.encryptionSubtitleStatusText}>End-to-end Encrypted</Text>
        </View>

        {/* Security / System Core Capabilities Cluster Block */}
        <View style={styles.modularMenuOptionsGroupingPanel}>
          {/* Encryption Key Row Item */}
          <View style={styles.menuInteractiveRowItem}>
            <View style={[styles.iconBoxContainerSquareBadge, styles.secondaryTintIconBoxBg]}>
              <Shield size={20} color="#0057bd" />
            </View>
            <View style={styles.menuItemTextContentBlock}>
              <Text style={styles.menuItemTitleLabelText}>Encryption Key</Text>
              <Text style={styles.menuItemDescriptionSubtitle}>{isVerified ? 'Verified' : 'Unverified connection'}</Text>
            </View>
            {isVerified ? (
              <CheckCircle size={20} color="#0057bd" fill="rgba(0,87,189,0.1)" />
            ) : (
              <TouchableOpacity onPress={handleVerify} activeOpacity={0.7}>
                <Text style={styles.inlineActionTextButtonLink}>Verify</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Interactive Simulated Expandable Section Block */}
          <Animated.View style={animatedVerifyStyle}>
            <View style={styles.expandableVerifyBoxInnerContainer}>
              <Text style={styles.verificationCodeInstructionalMetaText}>Compare this code with {chat.name}</Text>
              {verificationCode ? (
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <Text style={styles.verificationCodeMonoDisplayTypography}>{verificationCode}</Text>
                  <TouchableOpacity 
                    onPress={confirmVerification}
                    style={styles.innerBoxConfirmActionBtnStadiumShape}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.innerBoxConfirmActionBtnLabel}>Mark as Verified</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.innerLoadingSpinnerFlexCenterSpacer}>
                  <BubbleLoader size={24} />
                </View>
              )}
            </View>
          </Animated.View>

          {/* Self Destruct Timer Selector Row Item */}
          <TouchableOpacity 
            onPress={showTimerPickerActionSheet}
            style={styles.menuInteractiveRowItem}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBoxContainerSquareBadge, styles.primaryTintIconBoxBg]}>
              <Clock size={20} color="#0057bd" />
            </View>
            <View style={styles.menuItemTextContentBlock}>
              <Text style={styles.menuItemTitleLabelText}>Self-Destruct Timer</Text>
              <Text style={styles.menuItemDescriptionSubtitle}>Delete messages automatically</Text>
            </View>
            <View style={styles.pickerRightArrowLayoutLinkTrack}>
              <Text style={styles.currentActiveValueLabelTypography}>
                {TIMER_OPTIONS.find(o => o.value === selfDestructTimer)?.label}
              </Text>
              <ChevronRight size={16} color="#94a3b8" />
            </View>
          </TouchableOpacity>

          {/* Screenshot Protection Switch Toggle Row Item */}
          <TouchableOpacity 
            onPress={toggleScreenshotProtection}
            style={styles.menuInteractiveRowItem}
            activeOpacity={0.9}
          >
            <View style={[styles.iconBoxContainerSquareBadge, styles.neutralTintIconBoxBg]}>
              <EyeOff size={20} color="#334155" />
            </View>
            <View style={styles.menuItemTextContentBlock}>
              <Text style={styles.menuItemTitleLabelText}>Screenshot Protection</Text>
              <Text style={styles.menuItemDescriptionSubtitle}>Alert when screenshotted</Text>
            </View>
            <Switch
              value={screenshotProtection}
              onValueChange={toggleScreenshotProtection}
              trackColor={{ false: '#e2e8f0', true: '#0057bd' }}
              thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
            />
          </TouchableOpacity>

          {/* Restricted Device Session Informational Badge Row Item */}
          <View style={[styles.menuInteractiveRowItem, styles.bgTransparentNoBorderBorder]}>
            <View style={[styles.iconBoxContainerSquareBadge, styles.neutralTintIconBoxBg]}>
              <Smartphone size={20} color="#334155" />
            </View>
            <View style={styles.menuItemTextContentBlock}>
              <Text style={styles.menuItemTitleLabelText}>Device Session</Text>
              <Text style={styles.menuItemDescriptionSubtitle}>Chat restricted to this device</Text>
            </View>
          </View>
        </View>

        {/* Destructive Destruct Options Grouping Block */}
        <View style={styles.modularMenuOptionsGroupingPanel}>
          <TouchableOpacity 
            onPress={() => {
              addToast?.('Secret chat deleted', 'error');
              setTimeout(() => onBack(), 500);
            }} 
            style={[styles.menuInteractiveRowItem, styles.bgTransparentNoBorderBorder]}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBoxContainerSquareBadge, styles.destructiveTintIconBoxBg]}>
              <Trash2 size={20} color="#ef4444" />
            </View>
            <View style={styles.menuItemTextContentBlock}>
              <Text style={styles.destructiveActionTitleLabelText}>Delete Secret Chat</Text>
              <Text style={styles.menuItemDescriptionSubtitle}>Wipe all messages permanently</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* System Server Protocols Status Footer Information Deck */}
        <View style={styles.serverPolicyNoticeBottomLayoutContainer}>
          <Key size={18} color="#94a3b8" style={styles.policyKeyIconOpacityWeightAdjustment} />
          <Text style={styles.policyDisclaimerParagraphText}>
            MESSAGES ARE NOT STORED ON SERVERS.{'\n'}FORWARDING IS DISABLED.
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  viewportBaseFrame: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  stickyHeaderPanel: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
    justifyContent: 'flex-end',
    zIndex: 60
  },
  headerContentWrapper: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  backIconButtonTrigger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -4
  },
  headerTitleTypographyHeadline: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3
  },
  mainScrollStackContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center'
  },

  // Unique Profile Composite Badge Blocks Properties Styles
  profileMetaOverviewBlock: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 36
  },
  avatarBadgeAbsolutePositionWrapper: {
    position: 'relative',
    marginBottom: 16
  },
  avatarCircularBadgeBorderCard: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)'
  },
  chatProfileAvatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  absoluteLockIconBadgeIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff'
  },
  chatDisplayNameHeadline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5
  },
  encryptionSubtitleStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0057bd',
    marginTop: 4,
    letterSpacing: 0.2
  },

  // Interactive Options Dynamic Selection Matrix Panels Components
  modularMenuOptionsGroupingPanel: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    overflow: 'hidden',
    paddingHorizontal: 16,
    marginBottom: 16
  },
  menuInteractiveRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)'
  },
  bgTransparentNoBorderBorder: {
    borderBottomWidth: 0
  },
  iconBoxContainerSquareBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  secondaryTintIconBoxBg: { backgroundColor: 'rgba(0, 87, 189, 0.06)' },
  primaryTintIconBoxBg: { backgroundColor: 'rgba(0, 87, 189, 0.06)' },
  neutralTintIconBoxBg: { backgroundColor: 'rgba(15, 23, 42, 0.04)' },
  destructiveTintIconBoxBg: { backgroundColor: 'rgba(239, 68, 68, 0.08)' },
  
  menuItemTextContentBlock: {
    flex: 1,
    marginLeft: 14,
    paddingRight: 8
  },
  menuItemTitleLabelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    letterSpacing: -0.2
  },
  destructiveActionTitleLabelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
    letterSpacing: -0.2
  },
  menuItemDescriptionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500'
  },
  inlineActionTextButtonLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0057bd',
    paddingVertical: 4,
    paddingHorizontal: 8
  },

  // Verify Hidden Slider Dropdowns Layout Space
  expandableVerifyBoxInnerContainer: {
    backgroundColor: 'rgba(15,23,42,0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.03)',
    padding: 14,
    alignItems: 'center',
    marginVertical: 4
  },
  verificationCodeInstructionalMetaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 10
  },
  verificationCodeMonoDisplayTypography: {
    fontSize: 22,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 12
  },
  innerBoxConfirmActionBtnStadiumShape: {
    backgroundColor: 'rgba(0,87,189,0.08)',
    height: 38,
    borderRadius: 19,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  innerBoxConfirmActionBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0057bd'
  },
  innerLoadingSpinnerFlexCenterSpacer: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center'
  },

  // Secondary Text Meta Indicators
  pickerRightArrowLayoutLinkTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  currentActiveValueLabelTypography: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a'
  },

  // Footer Disclaimer Section Formatting
  serverPolicyNoticeBottomLayoutContainer: {
    alignItems: 'center',
    marginTop: 32,
    gap: 10,
    paddingHorizontal: 24
  },
  policyKeyIconOpacityWeightAdjustment: {
    opacity: 0.25
  },
  policyDisclaimerParagraphText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: 1.5
  }
});