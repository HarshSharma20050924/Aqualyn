import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Palette, Check, SlidersHorizontal } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useAppContext } from '../../context/AppContext';

export default function VisualPreferences() {
  const { aquaIntensity, setAquaIntensity, theme, setTheme, updateSettings } = useAppContext();
  const intensityTimeoutRef = useRef<any>(null);
  
  const themeModes = [
    { label: 'Liquid (Light)', value: 'light' },
    { label: 'Obsidian (Dark)', value: 'dark' }
  ];

  const persistVisualSettings = useCallback(async (newSettings: any) => {
    try {
      await updateSettings({ theme: newSettings });
    } catch (e) {
      console.error('Failed to persist visual settings', e);
    }
  }, [updateSettings]);

  const handleThemeChange = (mode: 'light' | 'dark') => {
    const newTheme = { ...theme, mode };
    setTheme(newTheme);
    persistVisualSettings(newTheme);
  };

  const handleIntensityChange = (val: number) => {
    const safeInt = Math.round(val);
    setAquaIntensity(safeInt);
    
    if (intensityTimeoutRef.current) clearTimeout(intensityTimeoutRef.current);
    intensityTimeoutRef.current = setTimeout(() => {
      persistVisualSettings({ ...theme, aquaIntensity: safeInt });
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (intensityTimeoutRef.current) clearTimeout(intensityTimeoutRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Palette size={20} color="#0284C7" />
        <Text style={styles.titleText}>Visual Preferences</Text>
      </View>

      <View style={styles.card}>
        <View>
          <Text style={styles.sectionTitle}>Theme Mode</Text>
          <View style={styles.row}>
            {themeModes.map((t, i) => {
              const isSelected = theme.mode === t.value;
              return (
                <TouchableOpacity 
                  key={i} 
                  onPress={() => handleThemeChange(t.value as 'light' | 'dark')}
                  style={[
                    styles.modeButton,
                    isSelected ? styles.modeButtonActive : styles.modeButtonInactive
                  ]}
                >
                  <Text style={[
                    styles.modeButtonText,
                    isSelected ? styles.modeButtonTextActive : styles.modeButtonTextInactive
                  ]}>
                    {t.label}
                  </Text>
                  {isSelected && <Check size={16} color="#0284C7" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        <View style={styles.intensitySection}>
          <View style={styles.intensityHeader}>
            <View style={styles.intensityTitleRow}>
              <SlidersHorizontal size={16} color="#64748b" />
              <Text style={styles.intensityTitle}>Aqua Intensity</Text>
            </View>
            <Text style={styles.intensityValue}>{aquaIntensity}%</Text>
          </View>

          <Slider
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={aquaIntensity}
            onValueChange={handleIntensityChange}
            minimumTrackTintColor="#0284C7"
            maximumTrackTintColor="#E2E8F0"
            thumbTintColor="#0284C7"
            style={styles.slider}
          />

          <Text style={styles.intensityDescription}>
            Adjusts the blur and opacity of glassmorphism elements.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    padding: 24,
    gap: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeButtonActive: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.05)',
  },
  modeButtonInactive: {
    borderColor: 'rgba(15, 23, 42, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#0284C7',
  },
  modeButtonTextInactive: {
    color: '#64748b',
  },
  intensitySection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  intensityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  intensityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intensityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  intensityValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0284C7',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  intensityDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
});