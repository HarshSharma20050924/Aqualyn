import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import bubbleAnimation from '../../../public/bubbles.json';

export default function BubbleLoader({ width = 100, height = 100 }: { width?: number; height?: number }) {
  const [percentage, setPercentage] = useState(0);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Only show text after 1.5 seconds to avoid flashing on fast connections
    const timeout = setTimeout(() => setShowText(true), 1500);
    
    const startTime = Date.now();
    const duration = 45000; // 45 seconds to reach 99%

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out for natural slow down towards 99%
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setPercentage(Math.floor(easeOut * 99));
    }, 100);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width, height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Lottie animationData={bubbleAnimation} loop={true} />
      </div>
      {showText && (
        <div style={{ marginTop: 10, color: '#06b6d4', fontWeight: 'bold', fontFamily: 'monospace', fontSize: 14 }} className="animate-pulse">
          Waking up server... {percentage}%
        </div>
      )}
    </div>
  );
}
