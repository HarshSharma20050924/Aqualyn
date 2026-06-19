import { API_BASE_URL } from '../config/api';

/**
 * A professional fetch wrapper that automatically handles:
 * 1. Base URL prefixing (if needed)
 * 2. HttpOnly cookies via 'credentials: include'
 * 3. Default JSON headers
 */
// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function apiFetch(url: string, options: RequestInit & { cache?: boolean } = {}) {
    const headers: Record<string, string> = { ...((options.headers as any) || {}) };
    
    // Auto-detect Content-Type: if body is NOT FormData, default to JSON
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    
    // Handle caching for GET requests
    const isGetRequest = options.method?.toUpperCase() === 'GET' || !options.method;
    const useCache = isGetRequest && (options.cache ?? false);
    
    if (useCache) {
        const cacheKey = `${url}|${JSON.stringify(options)}`;
        const cached = cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return new Response(JSON.stringify(cached.data), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    const response = await fetch(url.startsWith('http') ? url : `${API_BASE_URL}${url}`, {
        ...options,
        headers,
        credentials: 'include',
    });

    if (response.status === 401) {
        // Handle session expiry globally
        // Note: we can't easily trigger AppContext logout from here without a circular dep or event bus
        // but the next bootstrap/sync will catch it.
    }
    
    // Cache successful GET responses
    if (useCache && response.ok && isGetRequest) {
        const cacheKey = `${url}|${JSON.stringify(options)}`;
        const data = await response.clone().json();
        cache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return response;
}
