import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMMKV } from 'react-native-mmkv';

// Instantiate the core C++ backed storage engine for native.
// In Expo Go, createMMKV() doesn't throw — it returns a broken object with undefined methods.
// So we validate the returned object actually has working methods before using it.
let storage: ReturnType<typeof createMMKV> | null = null;
try {
  if (Platform.OS !== 'web') {
    const mmkv = createMMKV({
      id: 'aqualyn-storage',
      encryptionKey: 'aqualyn-secure-encryption-key-todo'
    });
    // Validate the native module is fully functional (not a broken Expo Go stub)
    // Expo Go returns a partial object where some methods exist but others (like delete) don't
    if (
      mmkv &&
      typeof mmkv.set === 'function' &&
      typeof mmkv.getString === 'function' &&
      typeof (mmkv as any).delete === 'function' &&
      typeof mmkv.clearAll === 'function' &&
      typeof mmkv.contains === 'function'
    ) {
      storage = mmkv;
    } else {
      console.warn('[Storage] MMKV returned a broken object — running in Expo Go? Falling back to AsyncStorage.');
    }
  }
} catch (e) {
  console.warn('[Storage] MMKV not available, falling back to AsyncStorage.', e);
}
export { storage };

// Helper: returns true only when MMKV is fully available
const hasMMKV = () => storage !== null;


/**
 * Storage Wrapper Interface
 * Executes synchronously in C++ on Native, falls back to async wrapper on Web
 */
export const Storage = {
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web' || !storage) {
      AsyncStorage.setItem(key, value);
    } else {
      storage.set(key, value);
    }
  },

  getItem: (key: string): string | null => {
    if (Platform.OS === 'web' || !storage) {
      // MMKV unavailable (web or Expo Go) — synchronous read not possible
      return null;
    }
    return storage.getString(key) ?? null;
  },

  removeItem: (key: string) => {
    if (Platform.OS === 'web' || !storage) {
      AsyncStorage.removeItem(key);
    } else {
      (storage as any).delete(key);
    }
  },

  multiRemove: (keys: string[]) => {
    if (Platform.OS === 'web' || !storage) {
      AsyncStorage.multiRemove(keys);
    } else {
      keys.forEach(key => (storage as any).delete(key));
    }
  },

  clear: () => {
    if (Platform.OS === 'web' || !storage) {
      AsyncStorage.clear();
    } else {
      storage.clearAll();
    }
  },

  setObject: <T>(key: string, value: T) => {
    const val = JSON.stringify(value);
    if (Platform.OS === 'web' || !storage) {
      AsyncStorage.setItem(key, val);
    } else {
      storage.set(key, val);
    }
  },

  getObject: <T>(key: string): T | null => {
    if (Platform.OS === 'web') return null;
    const value = storage?.getString(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      return null;
    }
  },

  setBoolean: (key: string, value: boolean) => {
    if (Platform.OS === 'web' || !storage) {
      AsyncStorage.setItem(key, value ? '1' : '0');
    } else {
      storage.set(key, value);
    }
  },

  getBoolean: (key: string): boolean | null => {
    if (Platform.OS === 'web' || !storage) return null;
    if (!storage.contains(key)) return null;
    return storage.getBoolean(key) ?? null;
  },
};
