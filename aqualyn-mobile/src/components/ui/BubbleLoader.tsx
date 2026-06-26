import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';

export default function BubbleLoader({ size = 100, showWakeText = false }: { size?: number; showWakeText?: boolean }) {
  const [percentage, setPercentage] = useState(0);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (!showWakeText) return;
    
    // Only show text after 1.5 seconds to avoid flashing on fast connections
    const timeout = setTimeout(() => setShowText(true), 1500);
    
    const startTime = Date.now();
    const duration = 45000; // 45 seconds to reach 99%

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setPercentage(Math.floor(easeOut * 99));
    }, 100);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [showWakeText]);

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <LottieView
          source={require('../../../assets/bubbles.json')}
          autoPlay
          loop
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      {showText && showWakeText && (
        <Text style={styles.loadingText}>
          Waking up server... {percentage}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#06b6d4',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'monospace',
  }
});
