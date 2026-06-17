import React from 'react';
import Lottie from 'lottie-react';
import bubbleAnimation from '../../../public/bubbles.json';

export default function BubbleLoader({ width = 100, height = 100 }: { width?: number; height?: number }) {
  return (
    <div style={{ width, height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Lottie animationData={bubbleAnimation} loop={true} />
    </div>
  );
}
