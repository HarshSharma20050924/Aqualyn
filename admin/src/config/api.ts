// Admin API configuration
// In development, Vite proxy handles /api -> localhost:5000
// In production, set VITE_API_URL to your backend URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const ADMIN_ENDPOINTS = {
    SETUP: `${API_BASE_URL}/api/admin/setup`,
    LOGIN: `${API_BASE_URL}/api/admin/login`,
    STATS: `${API_BASE_URL}/api/admin/stats`,
    ANALYTICS: `${API_BASE_URL}/api/admin/analytics`,
    OBSERVABILITY: `${API_BASE_URL}/api/admin/observability`,
    USERS: `${API_BASE_URL}/api/admin/users`,
    // CHATS endpoint returns metadata only (counts) — no message content (E2E encrypted).
    CHATS: `${API_BASE_URL}/api/admin/chats`,
    POSTS: `${API_BASE_URL}/api/admin/posts`,
    DELETE_USER: (id: string) => `${API_BASE_URL}/api/admin/users/${id}`,
    DELETE_CHAT: (id: string) => `${API_BASE_URL}/api/admin/chats/${id}`,
    DELETE_POST: (id: string) => `${API_BASE_URL}/api/admin/posts/${id}`,
    UPDATE_ROLE: (id: string) => `${API_BASE_URL}/api/admin/users/${id}/role`,
    BAN_USER: (id: string) => `${API_BASE_URL}/api/admin/users/${id}/ban`,
    // NOTE: USER_CHATS removed — browsing per-user chats violates E2E privacy.
    // NOTE: CHAT_MESSAGES removed — message content is E2E encrypted, never exposed to admin.
    // NOTE: DELETE_MESSAGE removed — individual message ops violate E2E guarantees.
};
