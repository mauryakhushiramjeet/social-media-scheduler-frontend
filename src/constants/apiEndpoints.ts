export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085';

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    ME: '/api/auth/me',
  },
  SOCIAL: {
    ACCOUNTS: '/api/social/accounts',
    CONNECT: '/api/social/connect',
    SYNC: '/api/social/sync',
    DISCONNECT: (platform: string) => `/api/social/disconnect/${platform}`,
  },
  POSTS: {
    BASE: '/api/posts',
    GET_ONE: (id: string) => `/api/posts/${id}`,
    UPDATE: (id: string) => `/api/posts/${id}`,
    DELETE: (id: string) => `/api/posts/${id}`,
  },
} as const;

export const SUPPORTED_PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'twitter', name: 'X / Twitter', icon: '🐦' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'youtube', name: 'YouTube', icon: '▶️' },
  { id: 'pinterest', name: 'Pinterest', icon: '📌' },
  { id: 'reddit', name: 'Reddit', icon: '🤖' },
  { id: 'threads', name: 'Threads', icon: '🧵' },
  { id: 'bluesky', name: 'Bluesky', icon: '🦋' },
  { id: 'snapchat', name: 'Snapchat', icon: '👻' },
  { id: 'telegram', name: 'Telegram', icon: '✈️' },
  { id: 'googlebusiness', name: 'Google Business', icon: '🏪' },
] as const;
