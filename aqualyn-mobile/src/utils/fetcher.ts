/**
 * fetcher.ts
 * React Native optimized API fetch wrapper.
 * Automatically prefixes endpoints and manages content-type boundaries.
 */

import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A robust fetch wrapper tailored for React Native environments.
 * 1. Base URL prefixing (cross-platform target resolution)
 * 2. Token injection from AsyncStorage
 * 3. Conditional Content-Type payload configuration
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
    const headers: Record<string, string> = { ...((options.headers as any) || {}) };
    
    // React Native FormData objects require skipping the standard application/json Content-Type 
    // header so the underlying native networking layer can inject the multipart boundary string.
    const isFormData = options.body && typeof options.body === 'object' && 'append' in options.body;

    if (!isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    if (!headers['Authorization']) {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        } catch (e) {
            console.error('[apiFetch] Error reading auth token:', e);
        }
    }

    const targetUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    const response = await fetch(targetUrl, {
        ...options,
        headers,
        // 'credentials' is a web standard configuration. In React Native, authentication cookies
        // are stored and managed natively by the system's cookie manager automatically.
        // We preserve it for hybrid web environments if applicable.
        credentials: 'include',
    });

    if (response.status === 401) {
        // Global Session Expiry Hook
        // Tip: You can dispatch a global event or trigger your authentication store logout sequence here.
        console.warn('[apiFetch] Unauthorised 401 response detected.');
        try {
            await AsyncStorage.removeItem('auth_token');
        } catch (e) {
            console.error('[apiFetch] Error clearing auth token on 401:', e);
        }
    }

    return response;
}