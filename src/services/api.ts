import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../constants/apiEndpoints';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format Data & Centralized Toast Error Notification
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    // If 401 Unauthorized, clear stale token
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } else {
      // Show toast notification for errors
      toast.error(message);
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
