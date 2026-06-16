import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../../src/utils/fetcher';
import { ENDPOINTS } from '../../src/config/api';
import { useAppContext } from '../../src/context/AppContext';
import { Theme } from '../../src/config/theme';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { setCurrentUser, addToast } = useAppContext();
  const router = useRouter();

  const handleSendOtp = async () => {
    if (!identifier) {
      setError('Please enter your email or phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(ENDPOINTS.AUTH_SEND_OTP, {
        method: 'POST',
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      
      setStep('otp');
      addToast('OTP sent successfully', 'success');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(ENDPOINTS.AUTH_VERIFY_OTP, {
        method: 'POST',
        body: JSON.stringify({ identifier, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid OTP');
      
      await AsyncStorage.setItem('auth_token', data.token);
      
      // Fetch profile to see if registered
      const profileRes = await apiFetch(`${ENDPOINTS.USER_PROFILE('')}me`);
      if (profileRes.ok) {
        const user = await profileRes.json();
        setCurrentUser(user);
        router.replace('/(tabs)');
      } else {
        // Needs registration
        router.replace('/(auth)/register');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={[Theme.colors.secondary, Theme.colors.primaryContainer]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.glassCard}>
        <Text style={styles.title}>Aqualyn</Text>
        <Text style={styles.subtitle}>
          {step === 'input' ? 'Welcome back' : 'Verify your account'}
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {step === 'input' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email or Phone number"
              placeholderTextColor={Theme.colors.onSurfaceVariant}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Theme.colors.onPrimary} />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor={Theme.colors.onSurfaceVariant}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Theme.colors.onPrimary} />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => setStep('input')}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCard: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Theme.colors.primary,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: Theme.spacing.xl,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: Theme.colors.surfaceVariant,
    borderRadius: Theme.radii.md,
    padding: Theme.spacing.md,
    fontSize: 16,
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.lg,
  },
  button: {
    width: '100%',
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.md,
    borderRadius: Theme.radii.md,
    alignItems: 'center',
  },
  buttonText: {
    color: Theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    marginTop: Theme.spacing.md,
    padding: Theme.spacing.sm,
  },
  backButtonText: {
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  errorText: {
    color: Theme.colors.error,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  }
});
