import axios from 'axios';

const DEFAULT_SERVER_BASE_URL = 'http://localhost:5000';

export const SERVER_BASE_URL =
  process.env.REACT_APP_SERVER_URL ||
  process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, '') ||
  DEFAULT_SERVER_BASE_URL;

export const API_BASE_URL =
  process.env.REACT_APP_API_URL || `${SERVER_BASE_URL}/api`;

export const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL || SERVER_BASE_URL;

export const buildServerUrl = (path = '') => {
  if (!path) return SERVER_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SERVER_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  loginWithGoogle: (data) => api.post('/auth/google', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getAllStaff: () => api.get('/auth/staff'),
  getAllUsers: () => api.get('/auth/users'),
};

// Slot APIs
export const slotAPI = {
  getMySlots: () => api.get('/slots/my-slots'),
  getSlotByLink: (linkId) => api.get(`/slots/link/${linkId}`),
  joinSlot: (linkId) => api.post(`/slots/join/${linkId}`),
  confirmSlot: (slotId) => api.put(`/slots/${slotId}/confirm`),
};

// Doubt APIs
export const doubtAPI = {
  createDoubt: (data) => api.post('/doubts', data),
  getMyDoubts: () => api.get('/doubts/student'),
};

// Chat APIs
export const chatAPI = {
  sendMessage: (data) =>
    api.post('/chat/send', data, data instanceof FormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : undefined),
  getChatHistory: (userId) => api.get(`/chat/history/${userId}`),
  getChats: () => api.get('/chat/list'),
  getChatbotResponse: (payload) =>
    api.post(
      '/chat/chatbot',
      typeof payload === 'string' ? { message: payload } : payload
    ),
  clearChatHistory: (userId) => api.delete(`/chat/history/${userId}`),
  getUnreadCounts: () => api.get('/chat/unread'),
  markAsRead: (senderId) => api.put(`/chat/read/${senderId}`),
};

// Material APIs
export const materialAPI = {
  getAllMaterials: () => api.get('/materials'),
  getStaffMaterials: () => api.get('/materials/staff'),
};

export default api;
