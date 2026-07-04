/**
 * api.ts
 * API Configuration for Aqualyn tailored for React Native environments.
 * Switch between LOCAL (using machine IPs for physical devices) and PRODUCTION configurations.
 */

// In React Native, do not use 'localhost' when testing on a physical device;
// instead use your local development machine's private LAN IP address (e.g., http://192.168.1.X:5000)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || process.env.REACT_APP_API_URL || "https://aqualyn.onrender.com"; // Defaulting to production backend

// Endpoints mapping for easier maintenance — synced with frontend
export const ENDPOINTS = {
    // Auth
    AUTH_SYNC: `${API_BASE_URL}/api/auth/sync`,
    AUTH_SYNC_TOKEN: `${API_BASE_URL}/api/auth/sync-token`,
    AUTH_SEND_OTP: `${API_BASE_URL}/api/auth/send-otp`,
    AUTH_VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,

    // User
    USER_PROFILE: (id: string) => `${API_BASE_URL}/api/user/profile/${id}`,
    NOTIFICATIONS: `${API_BASE_URL}/api/user/notifications`,
    ACTIVITY_FEED: `${API_BASE_URL}/api/user/activity`, // From original mobile
    FOLLOW: `${API_BASE_URL}/api/user/follow`,
    UNFOLLOW: `${API_BASE_URL}/api/user/unfollow`,
    BLOCK_USER: `${API_BASE_URL}/api/user/block`,
    REPORT_USER: `${API_BASE_URL}/api/user/report`,
    BLOCKED_USERS: `${API_BASE_URL}/api/user/blocked`,
    SETTINGS: `${API_BASE_URL}/api/user/settings`,
    SESSIONS: `${API_BASE_URL}/api/user/sessions`,
    STORAGE_USAGE: `${API_BASE_URL}/api/user/storage-usage`,
    EXPORT_DATA: `${API_BASE_URL}/api/user/export`,
    CONTACT_SYNC: `${API_BASE_URL}/api/user/contacts/sync`,
    UPDATE_PROFILE: `${API_BASE_URL}/api/user/profile`, // From original mobile
    CALL_HISTORY: `${API_BASE_URL}/api/user/call-history`,
    UPDATE_SETTINGS: `${API_BASE_URL}/api/user/settings`,
    UPLOAD_AVATAR: `${API_BASE_URL}/api/user/upload-avatar`,

    // Chats
    CHATS: `${API_BASE_URL}/api/chats`,
    CHAT_MESSAGES: (id: string) => `${API_BASE_URL}/api/chats/${id}/messages`,
    MUTE_CHAT: (id: string) => `${API_BASE_URL}/api/chats/${id}/mute`,
    CHAT_MEDIA: (id: string) => `${API_BASE_URL}/api/chats/${id}/media`,
    CHAT_SETTINGS: (id: string) => `${API_BASE_URL}/api/chats/${id}/settings`,

    // Groups
    GROUP_INFO: (id: string) => `${API_BASE_URL}/api/groups/${id}/info`,
    GROUP_LEAVE: (id: string) => `${API_BASE_URL}/api/groups/${id}/leave`,
    GROUP_SETTINGS: (id: string) => `${API_BASE_URL}/api/groups/${id}/settings`,

    // Search
    USER_SEARCH: (q: string) => `${API_BASE_URL}/api/users/search?q=${encodeURIComponent(q)}`,

    // Social / Feed
    FEED: `${API_BASE_URL}/api/social/feed`,
    STORIES: `${API_BASE_URL}/api/social/stories`,
    CREATE_POST: `${API_BASE_URL}/api/social/post`,
    DELETE_POST: (id: string) => `${API_BASE_URL}/api/social/post/${id}`,
    CREATE_STORY: `${API_BASE_URL}/api/social/story`,
    DELETE_STORY: (id: string) => `${API_BASE_URL}/api/social/story/${id}`,
    LIKE_POST: (id: string) => `${API_BASE_URL}/api/social/post/${id}/like`,
    COMMENT_POST: (id: string) => `${API_BASE_URL}/api/social/post/${id}/comment`,
    DELETE_COMMENT: (id: string) => `${API_BASE_URL}/api/social/comment/${id}`,
    GET_FOLLOWERS: (userId: string) => `${API_BASE_URL}/api/user/${userId}/followers`,
    GET_FOLLOWING: (userId: string) => `${API_BASE_URL}/api/user/${userId}/following`,
    USER_POSTS: (userId: string) => `${API_BASE_URL}/api/social/user/${userId}/posts`,
    USER_STORIES: (userId: string) => `${API_BASE_URL}/api/social/user/${userId}/stories`,

    // Channels
    CHANNELS: `${API_BASE_URL}/api/channels`,
    CHANNEL_JOIN: (id: string) => `${API_BASE_URL}/api/channels/${id}/join`,
    CHANNEL_LEAVE: (id: string) => `${API_BASE_URL}/api/channels/${id}/leave`,
    CHANNEL_INFO: (id: string) => `${API_BASE_URL}/api/channels/${id}`,
    CHANNEL_POSTS: (id: string) => `${API_BASE_URL}/api/channels/${id}/posts`,

    // AI
    AI_INITIATE_CHAT: `${API_BASE_URL}/api/ai/chat/initiate`,
    AI_SMART_REPLY: `${API_BASE_URL}/api/ai/smart-reply`,
    AI_SUMMARIZE: `${API_BASE_URL}/api/ai/summarize`,
    AI_SEARCH: `${API_BASE_URL}/api/ai/search`,
    AI_CONTACT: `${API_BASE_URL}/api/ai/contact`,
    AI_DRAFT: `${API_BASE_URL}/api/ai/draft`,
    AI_DISCOVER: `${API_BASE_URL}/api/ai/discover`,
    LYN_SETTINGS: `${API_BASE_URL}/api/ai/settings`,
    LYN_SETTINGS_UPDATE: `${API_BASE_URL}/api/ai/settings`,
};
