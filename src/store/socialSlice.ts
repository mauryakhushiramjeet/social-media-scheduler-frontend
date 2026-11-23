import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import toast from 'react-hot-toast';

export interface SocialAccount {
  id: string;
  platform: string;
  username?: string;
  displayName?: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  connectedAt?: string;
}

interface SocialState {
  accounts: SocialAccount[];
  loading: boolean;
  connectingPlatform: string | null;
}

const initialState: SocialState = {
  accounts: [],
  loading: false,
  connectingPlatform: null,
};

// Async Thunk: List Connected Accounts (GET /api/social/accounts)
export const fetchSocialAccounts = createAsyncThunk(
  'social/fetchAccounts',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return [];
      const response: any = await api.get(API_ENDPOINTS.SOCIAL.ACCOUNTS);
      return response.data || [];
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// Async Thunk: Connect Account (POST /api/social/connect)
export const connectSocialAccount = createAsyncThunk(
  'social/connect',
  async (platform: string, { rejectWithValue }) => {
    try {
      const response: any = await api.post(API_ENDPOINTS.SOCIAL.CONNECT, { platform });
      const authUrl = response.data?.url;
      if (authUrl) {
        // Open authorization link in a new window/popup
        window.open(authUrl, '_blank', 'width=600,height=700');
        toast.success(`Redirecting to ${platform} authorization...`);
      }
      return { platform, url: authUrl };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// Async Thunk: Disconnect Account (DELETE /api/social/disconnect/:platform)
export const disconnectSocialAccount = createAsyncThunk(
  'social/disconnect',
  async (platform: string, { rejectWithValue }) => {
    try {
      await api.delete(API_ENDPOINTS.SOCIAL.DISCONNECT(platform));
      toast.success(`${platform} disconnected successfully`);
      return platform;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// Async Thunk: Sync Accounts (POST /api/social/sync)
export const syncSocialAccounts = createAsyncThunk(
  'social/sync',
  async (_, { rejectWithValue }) => {
    try {
      const response: any = await api.post(API_ENDPOINTS.SOCIAL.SYNC);
      toast.success('Social accounts synchronized successfully');
      return response.data || [];
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const socialSlice = createSlice({
  name: 'social',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchSocialAccounts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSocialAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload;
      })
      .addCase(fetchSocialAccounts.rejected, (state) => {
        state.loading = false;
      })
      // Connect
      .addCase(connectSocialAccount.pending, (state, action) => {
        state.connectingPlatform = action.meta.arg;
      })
      .addCase(connectSocialAccount.fulfilled, (state) => {
        state.connectingPlatform = null;
      })
      .addCase(connectSocialAccount.rejected, (state) => {
        state.connectingPlatform = null;
      })
      // Disconnect
      .addCase(disconnectSocialAccount.fulfilled, (state, action) => {
        state.accounts = state.accounts.filter(
          (acc) => acc.platform.toLowerCase() !== action.payload.toLowerCase()
        );
      })
      // Sync
      .addCase(syncSocialAccounts.fulfilled, (state, action) => {
        if (Array.isArray(action.payload)) {
          state.accounts = action.payload;
        }
      });
  },
});

export default socialSlice.reducer;
