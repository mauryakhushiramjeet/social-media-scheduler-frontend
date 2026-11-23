import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import toast from 'react-hot-toast';

export interface Post {
  id: string;
  userId?: string;
  caption: string;
  postType: 'FEED' | 'REEL' | 'STORY' | 'CAROUSEL';
  mediaUrls: string[];
  platforms?: string[];
  scheduledAt?: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  createdAt: string;
}

interface PostState {
  posts: Post[];
  selectedPost: Post | null;
  loading: boolean;
  creating: boolean;
}

const initialState: PostState = {
  posts: [],
  selectedPost: null,
  loading: false,
  creating: false,
};

// Async Thunk: Get All Posts (GET /api/posts)
export const fetchPosts = createAsyncThunk(
  'posts/fetchAll',
  async (filters: { status?: string; postType?: string } | undefined, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return [];
      const url = API_ENDPOINTS.POSTS.BASE;
      const response: any = await api.get(url, { params: filters });
      return response.data || [];
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// Async Thunk: Create Post (POST /api/posts)
export const createPost = createAsyncThunk(
  'posts/create',
  async (
    postData: {
      caption: string;
      platforms: string[];
      postType: 'FEED' | 'REEL' | 'STORY' | 'CAROUSEL';
      mediaUrls?: string[];
      scheduledAt?: string | null;
    },
    { rejectWithValue }
  ) => {
    try {
      const response: any = await api.post(API_ENDPOINTS.POSTS.BASE, postData);
      toast.success(response.message || 'Post created successfully!');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// Async Thunk: Update / Reschedule Post (PATCH /api/posts/:id)
export const updatePost = createAsyncThunk(
  'posts/update',
  async (
    { id, data }: { id: string; data: { caption?: string; scheduledAt?: string } },
    { rejectWithValue }
  ) => {
    try {
      const response: any = await api.patch(API_ENDPOINTS.POSTS.UPDATE(id), data);
      toast.success('Post updated successfully!');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// Async Thunk: Delete Post (DELETE /api/posts/:id)
export const deletePost = createAsyncThunk(
  'posts/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(API_ENDPOINTS.POSTS.DELETE(id));
      toast.success('Post deleted successfully');
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setSelectedPost: (state, action) => {
      state.selectedPost = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload;
      })
      .addCase(fetchPosts.rejected, (state) => {
        state.loading = false;
      })
      // Create
      .addCase(createPost.pending, (state) => {
        state.creating = true;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.creating = false;
        state.posts.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state) => {
        state.creating = false;
      })
      // Update
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
      })
      // Delete
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p.id !== action.payload);
      });
  },
});

export const { setSelectedPost } = postSlice.actions;
export default postSlice.reducer;
