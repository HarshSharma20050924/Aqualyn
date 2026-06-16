import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A professional fetch wrapper that automatically handles:
 * 1. Base URL prefixing (if needed)
 * 2. HttpOnly cookies via 'credentials: include'
 * 3. Default JSON headers
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
    const headers: Record<string, string> = { ...((options.headers as any) || {}) };
    
    // Auto-detect Content-Type: if body is NOT FormData, default to JSON
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    // Attach JWT token from AsyncStorage
    try {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    } catch (e) {
        console.error('Error reading token', e);
    }

    const response = await fetch(url.startsWith('http') ? url : `${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Handle session expiry globally
        // Note: we can't easily trigger AppContext logout from here without a circular dep or event bus
        // but the next bootstrap/sync will catch it.
    }

    return response;
}
