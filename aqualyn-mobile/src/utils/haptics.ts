/**
 * haptics.ts
 * No-op shim for expo-haptics.
 * Replace all `import * as Haptics from 'expo-haptics'` with this file
 * to globally disable all vibrations without touching each call site.
 */
export const impactAsync = (..._args: any[]) => Promise.resolve();
export const selectionAsync = () => Promise.resolve();
export const notificationAsync = (..._args: any[]) => Promise.resolve();
export const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy' } as const;
export const NotificationFeedbackType = { Success: 'success', Warning: 'warning', Error: 'error' } as const;
