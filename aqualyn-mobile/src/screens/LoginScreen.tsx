import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal
} from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInRight, 
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Droplet, 
  ArrowRight, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  Check, 
  Shield, 
  Globe, 
  Headset,
  Mail
} from 'lucide-react-native';

// Custom component placeholder - replace with your actual native picker sheet/module
import GlassyDatePicker from '../components/GlassyDatePicker';

import { auth, googleProvider } from '../config/firebase';
import { useAppContext } from '../context/AppContext';
import { ENDPOINTS } from '../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COUNTRIES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
];

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { setCurrentUser, currentUser } = useAppContext() || { setCurrentUser: () => {}, currentUser: null };
  
  const [step, setStep] = useState<'intro' | 'phone' | 'email' | 'otp' | 'profile'>('intro');
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Auth States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [activeIdentifier, setActiveIdentifier] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  
  // OTP Timer
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Profile States
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('');
  const [showBirthday, setShowBirthday] = useState(true);
  const [phoneInput, setPhoneInput] = useState('');

  // Reanimated Shared Value for Custom Switch Toggle Animation
  const switchTranslate = useSharedValue(showBirthday ? 22 : 2);

  useEffect(() => {
    switchTranslate.value = withSpring(showBirthday ? 22 : 2, { damping: 25, stiffness: 200 });
  }, [showBirthday]);

  const toggleSwitchStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: switchTranslate.value }]
  }));

  // Ref tracking array for programmatically shifting focus inside native OTP inputs
  const otpRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let interval: any;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  useEffect(() => {
    if (currentUser && !currentUser.id) {
       setStep('profile');
       if (currentUser.displayName) setDisplayName(currentUser.displayName);
       if (currentUser.email) setEmail(currentUser.email);
       if (currentUser.phone) setPhoneNumber(currentUser.phone.replace(/\D/g, ''));
    }
  }, [currentUser]);

  const handleSendOtp = async () => {
    setIsLoading(true);
    try {
      let identifier = activeIdentifier;
      if (step === 'phone') {
          identifier = `${selectedCountry.code}${phoneNumber}`;
          setActiveIdentifier(identifier);
      } else if (step === 'email') {
          identifier = email;
          setActiveIdentifier(identifier);
      }

      const res = await fetch(ENDPOINTS.AUTH_SEND_OTP, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier })
      });
      if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to send OTP');
      }
      const data = await res.json();
      setIsExistingUser(data.isExisting);

      // On Mobile applications, handle OTP alerts via native modal modules or background services
      alert(`Verification Code Received: ${data.otp}`);

      setStep('otp');
      setResendTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);
    
    if (cleanValue && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    const code = otp.join('');
    const identifier = activeIdentifier;
    try {
      const res = await fetch(ENDPOINTS.AUTH_VERIFY_OTP, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, otp: code })
      });
      if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to verify OTP');
      }
      await syncProfileWithBackend({});
    } catch (error: any) {
      alert("Invalid OTP or connection issue");
    } finally {
      setIsLoading(false);
    }
  };

  const syncProfileWithBackend = async (data: any) => {
    setIsLoading(true);
    try {
      const payload = { ...data };
      if (!payload.phone && phoneNumber) {
          payload.phone = `${selectedCountry.code}${phoneNumber}`;
      }

      const res = await fetch(ENDPOINTS.AUTH_SYNC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));

      if (res.status === 401) {
          setStep('intro');
          return;
      }

      if (!res.ok) {
        throw new Error(resData.error || resData.details || 'Sync failed');
      }

      if (resData.status === 'needs_profile') {
          setStep('profile');
          if (resData.user?.displayName) setDisplayName(resData.user.displayName);
          return;
      }

      if (resData.user) {
          setCurrentUser(resData.user);
          if (resData.user.dob && resData.user.displayName) {
              onLogin();
          } else {
              setStep('profile');
          }
      }
    } catch (error: any) {
      alert(`${error.message || 'Server error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSetup = () => {
    if (displayName.trim()) {
      syncProfileWithBackend({ displayName, dob, showBirthday, phone: phoneInput });
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    if (isLoading || isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      // Integration Stub: Hook your native Firebase Auth provider workflow here
      // For instance: using `@react-native-google-signin/google-signin`
      alert("Google Sign In workflow needs your native credentials configuration.");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsGoogleLoading(false);
    }
  }, [isLoading, isGoogleLoading]);

  const GoogleIcon = () => (
    <Animated.View style={styles.googleIconWrapper}>
      {/* Fallback layout drawing matching original branding vectors */}
      <View style={[styles.googleBarItem, { backgroundColor: '#4285F4', top: 0, left: 4, width: 12, height: 4 }]} />
      <View style={[styles.googleBarItem, { backgroundColor: '#34A853', bottom: 0, left: 4, width: 12, height: 4 }]} />
      <View style={[styles.googleBarItem, { backgroundColor: '#FBBC05', left: 0, top: 4, width: 4, height: 12 }]} />
      <View style={[styles.googleBarItem, { backgroundColor: '#EA4335', right: 0, top: 4, width: 4, height: 12 }]} />
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.viewportBaseFrame}
    >
      <ScrollView 
        contentContainerStyle={[styles.mainScrollStack, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Dynamic Abstract Blur Background Outposts */}
        <View style={styles.blurTopCircleBg} />
        <View style={styles.blurBottomCircleBg} />

        <Animated.View style={styles.centralInteractiveShellDeck}>
          {step === 'intro' && (
            <Animated.View 
              entering={SlideInRight.springify().damping(22)} 
              exiting={FadeOut}
              style={styles.stepAlignerCenter}
            >
              <View style={styles.logoBadgeContainerFrame}>
                <View style={styles.logoBadgeInnerGlowCard}>
                  <Droplet size={54} color="#0057bd" fill="#0057bd" />
                </View>
              </View>
              
              <Text style={styles.brandingHeaderAccentHeadline}>Aqualyn</Text>
              <Text style={styles.brandingSubtitleHeadlineText}>India's Best Messaging App</Text>
              <Text style={styles.brandingParagraphBodyText}>
                Experience crystal clear, fluid communication designed for the modern world.
              </Text>

              <TouchableOpacity style={styles.mainActionStadiumButton} onPress={() => setStep('phone')}>
                <Text style={styles.mainActionStadiumButtonLabelText}>Get Started</Text>
                <ArrowRight size={20} color="#ffffff" />
              </TouchableOpacity>
            </Animated.View>
          )}

          {(step === 'phone' || step === 'email') && (
            <Animated.View 
              entering={SlideInRight.springify().damping(22)} 
              exiting={FadeOut}
              style={styles.glassFormWrapperCard}
            >
              <Text style={styles.formHeaderTitleTypography}>
                {isExistingUser === true ? 'Welcome Back' : 'Join Aqualyn'}
              </Text>
              <Text style={styles.formSupportingDescriptionParagraph}>
                 {isExistingUser === true 
                   ? 'Sign in to continue your conversations.' 
                   : "Create an account to experience India's best messaging app."}
              </Text>

              <View style={styles.formFieldsInputsStackVerticalGap}>
                {step === 'phone' ? (
                  <View style={styles.inputFieldFormGroup}>
                    <Text style={styles.inputFieldMinimalTopLabel}>Phone Number</Text>
                    <View style={styles.phoneCompositeHorizontalFieldsRow}>
                      <TouchableOpacity 
                        onPress={() => setIsCountryDropdownOpen(true)}
                        style={styles.countryPickerTriggerInteractiveBox}
                      >
                        <Text style={styles.countryPickerFlagTextValue}>{selectedCountry.flag}</Text>
                        <Text style={styles.countryPickerCodeTextValue}>{selectedCountry.code}</Text>
                        <ChevronDown size={14} color="#64748b" />
                      </TouchableOpacity>

                      <TextInput 
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={(t) => setPhoneNumber(t.replace(/\D/g, ''))}
                        placeholder="000 000 0000" 
                        placeholderTextColor="rgba(15,23,42,0.3)"
                        style={styles.primaryTextInputFieldNativeElement}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.inputFieldFormGroup}>
                    <Text style={styles.inputFieldMinimalTopLabel}>Email Address</Text>
                    <View style={styles.iconicInputAbsoluteFormRowWrapper}>
                      <Mail size={18} color="#64748b" style={styles.absoluteInputLeftAlignedIconAccessor} />
                      <TextInput 
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="name@example.com" 
                        placeholderTextColor="rgba(15,23,42,0.3)"
                        style={[styles.primaryTextInputFieldNativeElement, { paddingLeft: 44 }]}
                      />
                    </View>
                  </View>
                )}

                <TouchableOpacity 
                  onPress={handleSendOtp} 
                  disabled={step === 'phone' ? (!phoneNumber || isLoading) : (!email || isLoading)}
                  style={[styles.mainActionStadiumButton, (step === 'phone' ? !phoneNumber : !email) && styles.disabledButtonStateOpacity]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.mainActionStadiumButtonLabelText}>Continue</Text>
                      <ArrowRight size={20} color="#ffffff" />
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.formDividersActionHorizontalTrack}>
                  <View style={styles.formDividerHorizontalVectorLine} />
                  <Text style={styles.formDividerCentralLabelCapsTypographyText}>OR</Text>
                  <View style={styles.formDividerHorizontalVectorLine} />
                </View>

                <TouchableOpacity 
                  onPress={handleGoogleSignIn}
                  disabled={isLoading || isGoogleLoading}
                  style={styles.secondaryGlassOutlineActionButton}
                >
                  {isGoogleLoading ? (
                    <ActivityIndicator size="small" color="#0057bd" />
                  ) : (
                    <>
                      <GoogleIcon />
                      <Text style={styles.secondaryGlassOutlineActionButtonLabelText}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setStep(step === 'phone' ? 'email' : 'phone')}
                  style={styles.inlineFormSwitchAlternativeLinkTrigger}
                >
                  <Text style={styles.inlineFormSwitchAlternativeLinkTriggerLabel}>
                    {step === 'phone' ? 'Use email instead' : 'Use phone number instead'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {step === 'otp' && (
            <Animated.View 
              entering={SlideInRight.springify().damping(22)} 
              exiting={FadeOut}
              style={styles.glassFormWrapperCard}
            >
              <Text style={styles.formHeaderTitleTypography}>Verify it's you</Text>
              <Text style={styles.formSupportingDescriptionParagraph}>
                We sent a 6-digit code to{' '}
                <Text style={styles.boldFormHighlightedRecipientText}>
                  {email || `${selectedCountry.code} ${phoneNumber}`}
                </Text>
              </Text>

              <View style={styles.otpHorizontalBlocksInputRowTrack}>
                {otp.map((digit, i) => (
                  <TextInput 
                    key={i} 
                    ref={(el) => { otpRefs.current[i] = el; }}
                    keyboardType="number-pad"
                    maxLength={1} 
                    value={digit}
                    onChangeText={(val) => handleOtpChange(i, val)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                    style={styles.otpSquareBoxInputNativeElement}
                  />
                ))}
              </View>

              <View style={{ gap: 14, marginTop: 24 }}>
                <TouchableOpacity 
                  onPress={handleVerifyOtp} 
                  disabled={otp.some(d => !d) || isLoading}
                  style={[styles.mainActionStadiumButton, otp.some(d => !d) && styles.disabledButtonStateOpacity]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.mainActionStadiumButtonLabelText}>Verify & Enter</Text>
                      <ArrowRight size={20} color="#ffffff" />
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={handleSendOtp}
                  disabled={!canResend}
                  style={styles.inlineFormSwitchAlternativeLinkTrigger}
                >
                  <Text style={[styles.resendCodeTypographyLabel, !canResend && styles.disabledResendCodeTypographyLabel]}>
                    {canResend ? 'Resend Code' : `Resend Code in 00:${resendTimer.toString().padStart(2, '0')}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {step === 'profile' && (
            <Animated.View 
              entering={SlideInRight.springify().damping(22)} 
              exiting={FadeOut}
              style={styles.glassFormWrapperCard}
            >
              <Text style={styles.formHeaderTitleTypography}>Complete Profile</Text>
              <Text style={styles.formSupportingDescriptionParagraph}>Just a few details to get you started.</Text>

              <View style={styles.formFieldsInputsStackVerticalGap}>
                <View style={styles.inputFieldFormGroup}>
                  <Text style={styles.inputFieldMinimalTopLabel}>Display Name</Text>
                  <TextInput 
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="e.g. Alex Rivero" 
                    placeholderTextColor="rgba(15,23,42,0.3)"
                    style={styles.primaryTextInputFieldNativeElement}
                  />
                </View>

                <View style={styles.inputFieldFormGroup}>
                  <Text style={styles.inputFieldMinimalTopLabel}>Date of Birth</Text>
                  <GlassyDatePicker value={dob} onChange={setDob} />
                </View>

                <View style={styles.toggleRowGlassCardWrapper}>
                  <View style={styles.toggleRowLeftMetadataBlock}>
                    {showBirthday ? <Eye size={20} color="#0057bd" /> : <EyeOff size={20} color="#64748b" />}
                    <View>
                      <Text style={styles.toggleRowTitleHeadlineText}>Show Birthday</Text>
                      <Text style={styles.toggleRowSubtitleSupportingParagraph}>Let friends know it's your special day</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => setShowBirthday(!showBirthday)}
                    style={[styles.customToggleTrackFrame, showBirthday ? styles.toggleTrackActiveBg : styles.toggleTrackInactiveBg]}
                  >
                    <Animated.View style={[styles.customToggleCircleThumbElement, toggleSwitchStyle]} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  onPress={handleCompleteSetup} 
                  disabled={!displayName.trim() || !dob || isLoading}
                  style={[styles.mainActionStadiumButton, (!displayName.trim() || !dob) && styles.disabledButtonStateOpacity, { marginTop: 16 }]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.mainActionStadiumButtonLabelText}>Complete Setup</Text>
                      <Check size={20} color="#ffffff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </Animated.View>

        {step !== 'intro' && (
          <View style={styles.footerGlobalActionSystemShortcutsDeck}>
            {[Globe, Shield, Headset].map((Icon, i) => (
              <TouchableOpacity key={i} style={styles.footerGlobalShortcutGlassSquareBtn}>
                <Icon size={20} color="#64748b" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Persistent Absolute Footprint Network Secure Status Bar */}
      <View style={[styles.absoluteFootprintStatusBarContainer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.secureNetworkPillIndicatorPulseDot} />
        <Text style={styles.secureNetworkTypographyLabelCapsText}>Network Secure</Text>
      </View>

      {/* Country Selection Picker Sheet Native Modal Layer */}
      <Modal visible={isCountryDropdownOpen} transparent animationType="slide">
        <View style={styles.modalViewportContainerCenteringShield}>
          <TouchableOpacity activeOpacity={1} onPress={() => setIsCountryDropdownOpen(false)} style={styles.modalViewportAbsoluteBackgroundDimDismissal} />
          <View style={styles.modalBottomSheetContentCardTrack}>
            <View style={styles.modalBottomSheetCapsuleHandleBarIndicator} />
            <Text style={styles.modalBottomSheetHeaderTitleTypographyLabel}>Select Country</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
              {COUNTRIES.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[styles.modalInteractiveOptionLineItemRow, selectedCountry.code === country.code && styles.modalActiveOptionLineItemBackgroundValueTint]}
                  onPress={() => {
                    setSelectedCountry(country);
                    setIsCountryDropdownOpen(false);
                  }}
                >
                  <Text style={styles.modalFlagTypographySymbolLabel}>{country.flag}</Text>
                  <Text style={styles.modalMainCountryNameLabelText}>{country.name}</Text>
                  <Text style={styles.modalCountryDialCodeSupportingLabelText}>{country.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  viewportBaseFrame: { flex: 1, backgroundColor: '#f8fafc' },
  mainScrollStack: { flexGrow: 1, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },

  // Abstract Background Blurs Components 
  blurTopCircleBg: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(0,87,189,0.06)', zIndex: -1 },
  blurBottomCircleBg: { position: 'absolute', bottom: -50, right: -50, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(8,145,178,0.06)', zIndex: -1 },
  
  centralInteractiveShellDeck: { width: '100%', maxWidth: 400, justifyContent: 'center' },
  stepAlignerCenter: { alignItems: 'center', width: '100%' },

  // Brand Logo Layout Geometric Parameters
  logoBadgeContainerFrame: { width: 112, height: 112, marginBottom: 32, position: 'relative' },
  logoBadgeInnerGlowCard: { width: '100%', height: '100%', backgroundColor: '#ffffff', borderRadius: 36, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0057bd', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  brandingHeaderAccentHeadline: { fontSize: 44, fontWeight: '900', color: '#0057bd', textAlign: 'center', letterSpacing: -1.5 },
  brandingSubtitleHeadlineText: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginTop: 8, textAlign: 'center', letterSpacing: -0.4 },
  brandingParagraphBodyText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 12, marginBottom: 40, paddingHorizontal: 20, lineHeight: 20, fontWeight: '500' },

  // Standard Forms Framing Containers Configurations
  glassFormWrapperCard: { width: '100%', backgroundColor: '#ffffff', borderRadius: 36, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 24, elevation: 4 },
  formHeaderTitleTypography: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  boldFormHighlightedRecipientText: { fontWeight: '700', color: '#0057bd' },
  formSupportingDescriptionParagraph: { fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 24, lineHeight: 18, fontWeight: '500' },
  formFieldsInputsStackVerticalGap: { gap: 16 },

  // Form Inputs Base Assembly Elements Design
  inputFieldFormGroup: { gap: 6 },
  inputFieldMinimalTopLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginLeft: 2 },
  phoneCompositeHorizontalFieldsRow: { flexDirection: 'row', gap: 8, width: '100%' },
  countryPickerTriggerInteractiveBox: { height: 52, paddingHorizontal: 12, backgroundColor: '#f1f5f9', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 6 },
  countryPickerFlagTextValue: { fontSize: 18 },
  countryPickerCodeTextValue: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  primaryTextInputFieldNativeElement: { flex: 1, height: 52, backgroundColor: '#f1f5f9', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 14, fontWeight: '600', color: '#0f172a', paddingHorizontal: 16 },
  
  iconicInputAbsoluteFormRowWrapper: { position: 'relative', justifyContent: 'center', width: '100%' },
  absoluteInputLeftAlignedIconAccessor: { position: 'absolute', left: 16, zIndex: 5 },

  // Interactive Buttons Layout Framework Elements
  mainActionStadiumButton: { height: 52, width: '100%', backgroundColor: '#0057bd', borderRadius: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#0057bd', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  mainActionStadiumButtonLabelText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  disabledButtonStateOpacity: { opacity: 0.5 },

  // Form Custom Operational Vector Lines
  formDividersActionHorizontalTrack: { flexDirection: 'row', alignItems: 'center', marginVertical: 8, width: '100%' },
  formDividerHorizontalVectorLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  formDividerCentralLabelCapsTypographyText: { fontSize: 10, fontWeight: '800', color: '#94a3b8', marginHorizontal: 12 },

  secondaryGlassOutlineActionButton: { height: 52, width: '100%', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  secondaryGlassOutlineActionButtonLabelText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  inlineFormSwitchAlternativeLinkTrigger: { width: '100%', paddingVertical: 4, alignItems: 'center' },
  inlineFormSwitchAlternativeLinkTriggerLabel: { fontSize: 13, fontWeight: '700', color: '#0057bd' },

  // Native Vector Mock Components Drawing Layout parameters
  googleIconWrapper: { width: 18, height: 18, position: 'relative' },
  googleBarItem: { position: 'absolute', borderRadius: 1 },

  // OTP Custom Grid Elements Assemblies Properties
  otpHorizontalBlocksInputRowTrack: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 6 },
  otpSquareBoxInputNativeElement: { width: (SCREEN_WIDTH - 88) / 6, maxWidth: 52, height: 52, backgroundColor: '#f1f5f9', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#0057bd' },
  resendCodeTypographyLabel: { fontSize: 13, fontWeight: '700', color: '#0057bd' },
  disabledResendCodeTypographyLabel: { color: '#94a3b8' },

  // Profile Specific Switching Complex Box Models Configurations
  toggleRowGlassCardWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#f1f5f9', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', width: '100%' },
  toggleRowLeftMetadataBlock: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 },
  toggleRowTitleHeadlineText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  toggleRowSubtitleSupportingParagraph: { fontSize: 11, color: '#64748b', marginTop: 1, lineHeight: 14 },

  customToggleTrackFrame: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  toggleTrackActiveBg: { backgroundColor: '#0057bd' },
  toggleTrackInactiveBg: { backgroundColor: '#cbd5e1' },
  customToggleCircleThumbElement: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff' },

  // Footprint Systems Blocks Rows Short Links
  footerGlobalActionSystemShortcutsDeck: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 32, width: '100%' },
  footerGlobalShortcutGlassSquareBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },

  absoluteFootprintStatusBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secureNetworkPillIndicatorPulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  secureNetworkTypographyLabelCapsText: { fontSize: 9, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },

  // Cross-Platform Modal Sheets Core Layout Architectural Blueprint
  modalViewportContainerCenteringShield: { flex: 1, justifyContent: 'flex-end' },
  modalViewportAbsoluteBackgroundDimDismissal: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,23,42,0.2)' },
  modalBottomSheetContentCardTrack: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: 350, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10 },
  modalBottomSheetCapsuleHandleBarIndicator: { width: 36, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalBottomSheetHeaderTitleTypographyLabel: { fontSize: 14, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 12 },
  modalInteractiveOptionLineItemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 12, width: '100%' },
  modalActiveOptionLineItemBackgroundValueTint: { backgroundColor: 'rgba(0,87,189,0.06)' },
  modalFlagTypographySymbolLabel: { fontSize: 18 },
  modalMainCountryNameLabelText: { fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1 },
  modalCountryDialCodeSupportingLabelText: { fontSize: 13, fontWeight: '600', color: '#64748b' }
});