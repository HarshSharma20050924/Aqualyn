/**
 * api.ts
 * API Configuration for Aqualyn tailored for React Native environments.
 * Switch between LOCAL (using machine IPs for physical devices) and PRODUCTION configurations.
 */

// In React Native, do not use 'localhost' when testing on a physical device;
// instead use your local development machine's private LAN IP address (e.g., http://192.168.1.X:5000)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || process.env.REACT_APP_API_URL || "https://aqualyn.onrender.com"; // Defaulting to production backend

// Endpoints mapping for easier maintenance
  export const ENDPOINTS = {
      AUTH_SYNC: `${API_BASE_URL}/api/auth/sync`,
      AUTH_SEND_OTP: `${API_BASE_URL}/api/auth/send-otp`,
      AUTH_VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
      AUTH_GOOGLE_SIGNIN: `${API_BASE_URL}/api/auth/google-signin`,
      USER_PROFILE: (id: string) => `${API_BASE_URL}/api/user/profile/${id}`,
      GET_FOLLOWERS: (id: string) => `${API_BASE_URL}/api/user/${id}/followers`,
      GET_FOLLOWING: (id: string) => `${API_BASE_URL}/api/user/${id}/following`,
      NOTIFICATIONS: `${API_BASE_URL}/api/user/notifications`,
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
      CALL_HISTORY: `${API_BASE_URL}/api/user/call-history`,
      CHATS: `${API_BASE_URL}/api/chats`,
      CHAT_MESSAGES: (id: string) => `${API_BASE_URL}/api/chats/${id}/messages`,
      MUTE_CHAT: (id: string) => `${API_BASE_URL}/api/chats/${id}/mute`,
      CHAT_MEDIA: (id: string) => `${API_BASE_URL}/api/chats/${id}/media`,
      CHAT_SETTINGS: (id: string) => `${API_BASE_URL}/api/chats/${id}/settings`,
      GROUP_INFO: (id: string) => `${API_BASE_URL}/api/groups/${id}/info`,
      GROUP_LEAVE: (id: string) => `${API_BASE_URL}/api/groups/${id}/leave`,
      GROUP_SETTINGS: (id: string) => `${API_BASE_URL}/api/groups/${id}/settings`,
      USER_SEARCH: (q: string) => `${API_BASE_URL}/api/users/search?q=${encodeURIComponent(q)}`,
      FEED: `${API_BASE_URL}/api/social/feed`,
      STORIES: `${API_BASE_URL}/api/social/stories`,
      CREATE_POST: `${API_BASE_URL}/api/social/post`,
      DELETE_POST: (id: string) => `${API_BASE_URL}/api/social/post/${id}`,
      CREATE_STORY: `${API_BASE_URL}/api/social/story`,
      DELETE_STORY: (id: string) => `${API_BASE_URL}/api/social/story/${id}`,
      LIKE_POST: (id: string) => `${API_BASE_URL}/api/social/post/${id}/like`,
      COMMENT_POST: (id: string) => `${API_BASE_URL}/api/social/post/${id}/comment`,
      USER_POSTS: (id: string) => `${API_BASE_URL}/api/user/${id}/posts`,
      USER_STORIES: (id: string) => `${API_BASE_URL}/api/user/${id}/stories`,
      UPDATE_PROFILE: `${API_BASE_URL}/api/user/profile`,
  };
