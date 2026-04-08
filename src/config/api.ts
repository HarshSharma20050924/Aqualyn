/**
 * API Configuration for Aqualyn.
 * Switch between LOCAL and PRODUCTION IPs here.
 */
// export const API_BASE_URL = "http://localhost:5000";
export const API_BASE_URL = "http://3.122.179.214";

// Endpoints mapping for easier maintenance
export const ENDPOINTS = {
    AUTH_SYNC: `${API_BASE_URL}/api/auth/sync`,
    USER_PROFILE: (id: string) => `${API_BASE_URL}/api/user/profile/${id}`,
    NOTIFICATIONS: `${API_BASE_URL}/api/user/notifications`,
    FOLLOW: `${API_BASE_URL}/api/user/follow`,
    UNFOLLOW: `${API_BASE_URL}/api/user/unfollow`,
    CHATS: `${API_BASE_URL}/api/chats`,
    CHAT_MESSAGES: (id: string) => `${API_BASE_URL}/api/chats/${id}/messages`,
    USER_SEARCH: (q: string) => `${API_BASE_URL}/api/users/search?q=${encodeURIComponent(q)}`,
};
