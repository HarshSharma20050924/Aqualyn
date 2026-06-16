import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../../src/utils/fetcher';
import { ENDPOINTS, API_BASE_URL } from '../../src/config/api';
import { useAppContext } from '../../src/context/AppContext';
import { Theme } from '../../src/config/theme';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { setCurrentUser, addToast } = useAppContext();
  const router = useRouter();

  const handleRegister = async () => {
    if (!displayName || !dob) {
      setError('Display Name and Date of Birth are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ displayName, username, dob })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      await AsyncStorage.setItem('auth_token', data.token);
      setCurrentUser(data.user);
      addToast('Welcome to Aqualyn!', 'success');
      router.replace('/(tabs)');
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
        <Text style={styles.title}>Complete Profile</Text>
        <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Display Name *"
          placeholderTextColor={Theme.colors.onSurfaceVariant}
          value={displayName}
          onChangeText={setDisplayName}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Username (Optional)"
          placeholderTextColor={Theme.colors.onSurfaceVariant}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Date of Birth (YYYY-MM-DD) *"
          placeholderTextColor={Theme.colors.onSurfaceVariant}
          value={dob}
          onChangeText={setDob}
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Theme.colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Complete Registration</Text>
          )}
        </TouchableOpacity>
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
    fontSize: 28,
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
    marginBottom: Theme.spacing.md,
  },
  button: {
    width: '100%',
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.md,
    borderRadius: Theme.radii.md,
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  buttonText: {
    color: Theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: Theme.colors.error,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  }
});
