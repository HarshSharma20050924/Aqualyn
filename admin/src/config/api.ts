// Admin API configuration
// In development, Vite proxy handles /api -> localhost:5000
// In production, set VITE_API_URL to your backend URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const ADMIN_ENDPOINTS = {
    SETUP: `${API_BASE_URL}/api/admin/setup`,
    LOGIN: `${API_BASE_URL}/api/admin/login`,
    STATS: `${API_BASE_URL}/api/admin/stats`,
    USERS: `${API_BASE_URL}/api/admin/users`,
    CHATS: `${API_BASE_URL}/api/admin/chats`,
    POSTS: `${API_BASE_URL}/api/admin/posts`,
    DELETE_USER: (id: string) => `${API_BASE_URL}/api/admin/users/${id}`,
    DELETE_CHAT: (id: string) => `${API_BASE_URL}/api/admin/chats/${id}`,
    DELETE_POST: (id: string) => `${API_BASE_URL}/api/admin/posts/${id}`,
    UPDATE_ROLE: (id: string) => `${API_BASE_URL}/api/admin/users/${id}/role`,
    BAN_USER: (id: string) => `${API_BASE_URL}/api/admin/users/${id}/ban`,
};
