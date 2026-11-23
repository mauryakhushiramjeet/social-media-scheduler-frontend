import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  initialCheckDone: boolean;
}

const savedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
const savedUser =
  typeof window !== 'undefined' && localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user') || 'null')
    : null;

const initialState: AuthState = {
  user: savedUser,
  token: savedToken,
  isAuthenticated: Boolean(savedToken),
  loading: false,
  initialCheckDone: false,
};

// Async Thunk: Register
export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    userData: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response: any = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      const { user, token } = response.data;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      return { user, token };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Registration failed');
    }
  }
);

// Async Thunk: Login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response: any = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      const { user, token } = response.data;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      return { user, token };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Login failed');
    }
  }
);

// Async Thunk: Get Logged-In User (/api/auth/me)
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const response: any = await api.get(API_ENDPOINTS.AUTH.ME);
      const user = response.data.user || response.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (err: any) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return rejectWithValue(err.message || 'Session expired');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    setAuth: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    setInitialCheckDone: (state) => {
      state.initialCheckDone = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state) => {
        state.loading = false;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state) => {
        state.loading = false;
      })
      // Fetch Current User
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initialCheckDone = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.initialCheckDone = true;
      });
  },
});

export const { logout, setInitialCheckDone, setAuth } = authSlice.actions;
export default authSlice.reducer;
