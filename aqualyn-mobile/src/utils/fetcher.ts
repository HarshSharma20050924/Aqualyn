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
// Persistent caching using AsyncStorage
const CACHE_PREFIX = '@api_cache:';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function apiFetch(url: string, options: RequestInit & { cache?: boolean; skipCacheRead?: boolean } = {}) {
    const headers: Record<string, string> = { ...((options.headers as any) || {}) };
    
    // React Native FormData objects require skipping the standard application/json Content-Type 
    // header so the underlying native networking layer can inject the multipart boundary string.
    const isFormData = options.body && typeof options.body === 'object' && 'append' in options.body;
    const isGetRequest = options.method?.toUpperCase() === 'GET' || !options.method;
    const useCache = isGetRequest && (options.cache ?? true);

    if (!isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const targetUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const cacheKey = `${CACHE_PREFIX}${targetUrl}|${JSON.stringify(options)}`;

    // Handle persistent caching for GET requests
    if (useCache && !options.skipCacheRead) {
        try {
            const cachedStr = await AsyncStorage.getItem(cacheKey);
            if (cachedStr) {
                const cached = JSON.parse(cachedStr);
                if (Date.now() - cached.timestamp < CACHE_TTL) {
                    return new Response(JSON.stringify(cached.data), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
        } catch (e) {
            console.error('[apiFetch] Error reading from cache:', e);
        }
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

    const response = await fetch(targetUrl, {
        ...options,
        headers,
        credentials: 'include',
    });

    if (response.status === 401) {
        console.warn('[apiFetch] Unauthorised 401 response detected.');
        try {
            await AsyncStorage.removeItem('auth_token');
        } catch (e) {
            console.error('[apiFetch] Error clearing auth token on 401:', e);
        }
    }
    
    // Cache successful GET responses persistently
    if (useCache && response.ok && isGetRequest) {
        try {
            const clone = response.clone();
            const data = await clone.json();
            await AsyncStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
        } catch (e) {
            console.error('[apiFetch] Error saving to cache:', e);
        }
    }

    return response;
}
