import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';

// Instantiate the core C++ backed storage engine for native
export const storage = Platform.OS !== 'web' ? new MMKV({
  id: 'aqualyn-storage',
  encryptionKey: 'aqualyn-secure-encryption-key-todo' 
}) : null;

/**
 * Storage Wrapper Interface
 * Executes synchronously in C++ on Native, falls back to async wrapper on Web
 */
export const Storage = {
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      AsyncStorage.setItem(key, value);
    } else {
      storage?.set(key, value);
    }
  },

  getItem: (key: string): string | null => {
    // Note: On Web this synchronous getter will not work for AsyncStorage
    // For full web support, we'd need async methods, but for native performance
    // we use synchronous. Web users will need async fallbacks in production.
    if (Platform.OS === 'web') {
       // Mock for now to prevent crashes on web simulator
       return null; 
    }
    return storage?.getString(key) ?? null;
  },

  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      AsyncStorage.removeItem(key);
    } else {
      storage?.delete(key);
    }
  },

  multiRemove: (keys: string[]) => {
    if (Platform.OS === 'web') {
      AsyncStorage.multiRemove(keys);
    } else {
      keys.forEach(key => storage?.delete(key));
    }
  },

  clear: () => {
    if (Platform.OS === 'web') {
      AsyncStorage.clear();
    } else {
      storage?.clearAll();
    }
  },

  setObject: <T>(key: string, value: T) => {
    const val = JSON.stringify(value);
    if (Platform.OS === 'web') {
      AsyncStorage.setItem(key, val);
    } else {
      storage?.set(key, val);
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
    if (Platform.OS === 'web') {
      AsyncStorage.setItem(key, value ? '1' : '0');
    } else {
      storage?.set(key, value);
    }
  },

  getBoolean: (key: string): boolean | null => {
    if (Platform.OS === 'web') return null;
    if (!storage?.contains(key)) return null;
    return storage.getBoolean(key);
  },
};
