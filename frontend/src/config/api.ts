/**
 * API Configuration for Aqualyn.
 * Switch between LOCAL and PRODUCTION IPs here.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
    FEED: `${API_BASE_URL}/api/social/feed`,
    STORIES: `${API_BASE_URL}/api/social/stories`,
    CREATE_POST: `${API_BASE_URL}/api/social/post`,
    CREATE_STORY: `${API_BASE_URL}/api/social/story`,
    LIKE_POST: (id: string) => `${API_BASE_URL}/api/social/post/${id}/like`,
    COMMENT_POST: (id: string) => `${API_BASE_URL}/api/social/post/${id}/comment`,
};
