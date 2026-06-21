import { API_BASE_URL } from '../config/api';

/**
 * A professional fetch wrapper that automatically handles:
 * 1. Base URL prefixing (if needed)
 * 2. HttpOnly cookies via 'credentials: include'
 * 3. Default JSON headers
 */
// Persistent caching using localStorage
const CACHE_PREFIX = '@api_cache:';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function apiFetch(url: string, options: RequestInit & { cache?: boolean; skipCacheRead?: boolean } = {}) {
    const headers: Record<string, string> = { ...((options.headers as any) || {}) };
    
    // Auto-detect Content-Type: if body is NOT FormData, default to JSON
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    
    const targetUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const cacheKey = `${CACHE_PREFIX}${targetUrl}|${JSON.stringify(options)}`;

    // Handle caching for GET requests
    const isGetRequest = options.method?.toUpperCase() === 'GET' || !options.method;
    const useCache = isGetRequest && (options.cache ?? false);
    
    if (useCache && !options.skipCacheRead) {
        try {
            const cachedStr = localStorage.getItem(cacheKey);
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
            console.error('[apiFetch] Error reading from localStorage cache:', e);
        }
    }

    const response = await fetch(targetUrl, {
        ...options,
        headers,
        credentials: 'include',
    });

    if (response.status === 401) {
        // Handle session expiry globally
        // Note: we can't easily trigger AppContext logout from here without a circular dep or event bus
        // but the next bootstrap/sync will catch it.
    }
    
    // Cache successful GET responses persistently
    if (useCache && response.ok && isGetRequest) {
        try {
            const clone = response.clone();
            const data = await clone.json();
            localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
        } catch (e) {
            console.error('[apiFetch] Error saving to localStorage cache:', e);
        }
    }

    return response;
}
