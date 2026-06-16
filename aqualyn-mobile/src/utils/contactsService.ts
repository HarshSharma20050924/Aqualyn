/**
 * contactsService.ts
 * Handles device contact syncing and Aqualyn user matching for React Native.
 * Supports iOS/Android contact reading with web fallbacks.
 */

import { ENDPOINTS } from '../config/api';
import { apiFetch } from './fetcher';
import { Platform } from 'react-native';

export interface DeviceContact {
  name: string;
  phones: string[];
}

export interface AqualynContact {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  phone?: string;
}

/**
 * Normalise a phone number to E.164-ish format for server-side matching.
 * Strips all non-digit characters.
 */
function normalisePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

/**
 * Detect if running on mobile application layers.
 */
function isNativePlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Read device contacts using native React Native modules.
 */
async function readNativeContacts(): Promise<DeviceContact[]> {
  try {
    // Graceful check for bare React Native or Expo runtime dependencies
    let ContactsModule: any;
    try {
      ContactsModule = require('react-native-contacts').default;
    } catch {
      ContactsModule = require('expo-contacts');
    }

    if (!ContactsModule) {
      console.warn('[ContactsService] No native contacts module resolved');
      return [];
    }

    // --- Bare React Native Path ---
    if (typeof ContactsModule.checkPermission === 'function') {
      const permission = await new Promise<string>((resolve) => {
        ContactsModule.checkPermission((err: any, perm: string) => resolve(perm));
      });

      if (permission === 'undefined' || permission === 'denied') {
        const request = await new Promise<string>((resolve) => {
          ContactsModule.requestPermission((err: any, perm: string) => resolve(perm));
        });
        if (request !== 'authorized') return [];
      } else if (permission !== 'authorized') {
        return [];
      }

      const nativeList = await new Promise<any[]>((resolve, reject) => {
        ContactsModule.getAll((err: any, contacts: any[]) => (err ? reject(err) : resolve(contacts)));
      });

      return nativeList.map((c) => {
        const givenName = c.givenName || '';
        const familyName = c.familyName || '';
        return {
          name: `${givenName} ${familyName}`.trim() || 'Unknown Contact',
          phones: (c.phoneNumbers || [])
            .map((p: any) => normalisePhone(p.number))
            .filter((num: string) => num.length >= 10),
        };
      });
    }

    // --- Expo Path ---
    if (typeof ContactsModule.requestPermissionsAsync === 'function') {
      const { status } = await ContactsModule.requestPermissionsAsync();
      if (status !== 'granted') return [];

      const { data } = await ContactsModule.getContactsAsync({
        fields: [ContactsModule.Fields.Name, ContactsModule.Fields.PhoneNumbers],
      });

      return data.map((c: any) => ({
        name: c.name || 'Unknown Contact',
        phones: (c.phoneNumbers || [])
          .map((p: any) => normalisePhone(p.number || p.digits))
          .filter((num: string) => num.length >= 10),
      }));
    }

    return [];
  } catch (e) {
    console.warn('[ContactsService] Failed to fetch device contacts book context:', e);
    return [];
  }
}

async function matchPhonesOnServer(phones: string[]): Promise<AqualynContact[]> {
  if (phones.length === 0) return [];
  try {
    const res = await apiFetch(ENDPOINTS.CONTACT_SYNC, {
      method: 'POST',
      body: JSON.stringify({ phones }),
    });
    if (!res.ok) throw new Error('Server match failed');
    return await res.json();
  } catch (e) {
    console.error('[ContactsService] Server match error:', e);
    return [];
  }
}

export interface SyncResult {
  onAqualyn: AqualynContact[];
  toInvite: DeviceContact[];
  wasNative: boolean;
}

/**
 * Main sync execution loop wrapper.
 */
export async function syncContacts(): Promise<SyncResult> {
  if (!isNativePlatform()) {
    return { onAqualyn: [], toInvite: [], wasNative: false };
  }

  const deviceContacts = await readNativeContacts();
  if (deviceContacts.length === 0) {
    return { onAqualyn: [], toInvite: [], wasNative: true };
  }

  const allPhones = [...new Set(deviceContacts.flatMap((c) => c.phones))];
  const matched = await matchPhonesOnServer(allPhones);
  const matchedPhones = new Set(matched.map((m) => m.phone).filter(Boolean));

  const toInvite = deviceContacts.filter((c) =>
    c.phones.every((p) => !matchedPhones.has(p))
  );

  return { onAqualyn: matched, toInvite, wasNative: true };
}

/**
 * Search Aqualyn users manually (Web/Manual search fallback).
 */
export async function searchContactManually(query: string): Promise<AqualynContact[]> {
  try {
    const res = await apiFetch(`${ENDPOINTS.CONTACT_SYNC}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('[ContactsService] Manual lookup failed', e);
    return [];
  }
}