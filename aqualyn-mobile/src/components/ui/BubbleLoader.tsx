import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

export default function BubbleLoader({ size = 100 }: { size?: number }) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LottieView
        source={require('../../../assets/bubbles.json')}
        autoPlay
        loop
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
