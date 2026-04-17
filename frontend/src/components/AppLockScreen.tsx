import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Fingerprint, Delete } from 'lucide-react';
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
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-background flex flex-col items-center justify-center p-8"
    >
      <div className="flex flex-col items-center mb-12">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-6 aqua-glow">
          <Lock className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black font-headline text-on-surface mb-2">Aqualyn Locked</h1>
        <p className="text-on-surface-variant font-medium">Enter your PIN to continue</p>
      </div>

      <div className="flex gap-4 mb-16">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
              pin.length >= i 
                ? 'bg-primary border-primary scale-125 shadow-[0_0_12px_rgba(8,145,178,0.5)]' 
                : 'border-on-surface-variant/30'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button 
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-on-surface hover:bg-surface-container transition-colors active:scale-90"
          >
            {num}
          </button>
        ))}
        <div className="w-20 h-20 flex items-center justify-center text-primary">
          <Fingerprint className="w-8 h-8" />
        </div>
        <button 
          onClick={() => handleNumberClick('0')}
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-on-surface hover:bg-surface-container transition-colors active:scale-90"
        >
          0
        </button>
        <button 
          onClick={handleDelete}
          className="w-20 h-20 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors active:scale-90"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      <button className="mt-12 text-primary font-bold text-sm uppercase tracking-widest hover:text-primary-dim transition-colors">
        Forgot PIN?
      </button>
    </motion.div>
  );
}
