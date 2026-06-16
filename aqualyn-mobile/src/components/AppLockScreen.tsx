import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Lock, Fingerprint, Delete } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

export default function AppLockScreen() {
  const { appLockPin, setIsAppLocked, addToast } = useAppContext();
  const [pin, setPin] = useState('');

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin === appLockPin) {
        setTimeout(() => setIsAppLocked(false), 200);
      } else if (newPin.length === 4) {
        setTimeout(() => {
          addToast('Incorrect PIN', 'error');
          setPin('');
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.lockIconCircle}>
          <Lock size={40} color="#0057bd" />
        </View>
        <Text style={styles.titleText}>Aqualyn Locked</Text>
        <Text style={styles.subtitleText}>Enter your PIN to continue</Text>
      </View>

      {/* Code Dots Progress Display Indicator */}
      <View style={styles.dotsRow}>
        {[1, 2, 3, 4].map((i) => (
          <View 
            key={i} 
            style={[
              styles.dot,
              pin.length >= i ? styles.dotFilled : styles.dotEmpty
            ]}
          />
        ))}
      </View>

      {/* Numeric Grid Container Matrix */}
      <View style={styles.numpadGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <TouchableOpacity 
            key={num}
            onPress={() => handleNumberClick(num.toString())}
            style={styles.numpadBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.numpadBtnText}>{num}</Text>
          </TouchableOpacity>
        ))}
        
        {/* Row 4 elements */}
        <View style={styles.numpadBtnPlaceholder}>
          <Fingerprint size={32} color="#0057bd" />
        </View>
        <TouchableOpacity 
          onPress={() => handleNumberClick('0')}
          style={styles.numpadBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.numpadBtnText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleDelete}
          style={styles.numpadBtn}
          activeOpacity={0.7}
        >
          <Delete size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.forgotPinBtn}>
        <Text style={styles.forgotPinText}>Forgot PIN?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 32 },
  headerSection: { alignItems: 'center', marginBottom: 48 },
  lockIconCircle: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(0,87,189,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#0057bd', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 },
  titleText: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  subtitleText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 64 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  dotFilled: { backgroundColor: '#0057bd', borderColor: '#0057bd' },
  dotEmpty: { backgroundColor: 'transparent', borderColor: 'rgba(100,116,139,0.3)' },
  numpadGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 24, width: '100%', maxWidth: 320 },
  numpadBtn: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  numpadBtnText: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  numpadBtnPlaceholder: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  forgotPinBtn: { marginTop: 48 },
  forgotPinText: { color: '#0057bd', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }
});