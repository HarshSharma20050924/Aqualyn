/**
 * contactsService.ts
 * Handles device contact syncing and Aqualyn user matching.
 * Supports native Capacitor path (Android/iOS) and web fallback.
 */

import { ENDPOINTS } from '../config/api';
import { apiFetch } from './fetcher';

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
 * Strips all non-digit characters and keeps country code if present.
 */
function normalisePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

/**
 * Detect if we're running inside a Capacitor native shell.
 */
function isNativePlatform(): boolean {
  return typeof (window as any).Capacitor !== 'undefined' &&
    (window as any).Capacitor?.isNativePlatform?.() === true;
}

/**
 * Read device contacts using the Capacitor Contacts plugin.
 * Returns an empty array on any permission denial or error.
 */
async function readNativeContacts(): Promise<DeviceContact[]> {
  try {
    // Dynamic import so the web bundle doesn't fail if the plugin isn't installed
    const { Contacts, 'PhoneType': PhoneType } = await import(
      '@capacitor-community/contacts' as any
    );

    const permission = await Contacts.requestPermissions();
    if (permission.contacts !== 'granted') {
      console.warn('[ContactsService] Permission denied');
      return [];
    }

    const result = await Contacts.getContacts({
      projection: { name: true, phones: true },
    });

    return (result.contacts || [])
      .filter((c: any) => c.phones && c.phones.length > 0)
      .map((c: any) => ({
        name: c.name?.display || c.name?.given || 'Unknown',
        phones: (c.phones as any[]).map((p: any) => normalisePhone(p.number || '')).filter(Boolean),
      }));
  } catch (e) {
    console.error('[ContactsService] Native read error:', e);
    return [];
  }
}

/**
 * POST phone numbers to the backend for server-side matching.
 * Returns matched Aqualyn users.
 */
async function matchPhonesOnServer(phones: string[]): Promise<AqualynContact[]> {
  if (phones.length === 0) return [];
  try {
    const res = await apiFetch(ENDPOINTS.CONTACT_SYNC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  /** Aqualyn users found from the device contacts */
  onAqualyn: AqualynContact[];
  /** Raw phone numbers that didn't match any Aqualyn user */
  toInvite: DeviceContact[];
  /** Whether native contacts were available */
  wasNative: boolean;
}

/**
 * Main sync function.
 * On native: reads device contacts and matches against server.
 * On web: returns wasNative=false so the caller can show a manual-search prompt.
 */
export async function syncContacts(): Promise<SyncResult> {
  if (!isNativePlatform()) {
    return { onAqualyn: [], toInvite: [], wasNative: false };
  }

  const deviceContacts = await readNativeContacts();
  if (deviceContacts.length === 0) {
    return { onAqualyn: [], toInvite: [], wasNative: true };
  }

  const allPhones = [...new Set(deviceContacts.flatMap(c => c.phones))];
  const matched = await matchPhonesOnServer(allPhones);
  const matchedPhones = new Set(matched.map(m => m.phone).filter(Boolean));

  const toInvite = deviceContacts.filter(c =>
    c.phones.every(p => !matchedPhones.has(p))
  );

  return { onAqualyn: matched, toInvite, wasNative: true };
}

/**
 * Search Aqualyn users by phone number manually (web fallback).
 */
export async function searchByPhone(phone: string): Promise<AqualynContact[]> {
  return matchPhonesOnServer([normalisePhone(phone)]);
}
