# components/settings/VisualPreferences.tsx

## File Location
`frontend/src/components/settings/VisualPreferences.tsx`

## Purpose
See implementation below for details.

## Implementation

```typescript
import React, { useCallback, useEffect, useRef } from 'react';
import { Palette, Check, SlidersHorizontal } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function VisualPreferences() {
  const { aquaIntensity, setAquaIntensity, theme, setTheme, updateSettings } = useAppContext();
  const intensityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    persistVisualSettings(newTheme);
  };

  const handleIntensityChange = (val: number) => {
    setAquaIntensity(val);
    
    if (intensityTimeoutRef.current) clearTimeout(intensityTimeoutRef.current);
    intensityTimeoutRef.current = setTimeout(() => {
      persistVisualSettings({ ...theme, aquaIntensity: val });
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (intensityTimeoutRef.current) clearTimeout(intensityTimeoutRef.current);
    };
  }, []);

  return (
    <section className="space-y-4">
      <h3 className="font-headline font-bold text-lg text-on-surface px-2 flex items-center gap-2">
        <Palette className="w-5 h-5 text-secondary" />
        Visual Preferences
      </h3>
      <div className="glass-card rounded-[2rem] p-6 border border-white/40 shadow-sm space-y-6">
        <div>
          <label className="font-semibold text-on-surface mb-3 block">Theme Mode</label>
          <div className="grid grid-cols-2 gap-3">
            {themeModes.map((t, i) => (
              <button 
                key={i} 
                onClick={() => handleThemeChange(t.value as 'light' | 'dark')}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${theme.mode === t.value ? 'border-secondary bg-secondary/5 shadow-sm' : 'border-outline-variant/30 hover:bg-white/40'}`}
              >
                <span className={`font-medium ${theme.mode === t.value ? 'text-secondary' : 'text-on-surface-variant'}`}>{t.label}</span>
                {theme.mode === t.value && <Check className="w-4 h-4 text-secondary" />}
              </button>
            ))}
          </div>
        </div>
        
        <div className="pt-4 border-t border-white/20">
          <div className="flex justify-between items-center mb-4">
            <label className="font-semibold text-on-surface flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-on-surface-variant" />
              Aqua Intensity
            </label>
            <span className="text-sm font-bold text-secondary">{aquaIntensity}%</span>
          </div>
          <input 
            type="range" 
            min="0" max="100" 
            value={aquaIntensity}
            onChange={(e) => handleIntensityChange(Number(e.target.value))}
            className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer custom-slider" 
          />
          <p className="text-xs text-on-surface-variant mt-2">Adjusts the blur and opacity of glassmorphism elements.</p>
        </div>
      </div>
    </section>
  );
}
```
