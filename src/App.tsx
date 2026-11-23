import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import type { AppDispatch } from './store';
import { fetchCurrentUser, setInitialCheckDone } from './store/authSlice';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { DashboardPage } from './pages/DashboardPage';

export default function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(fetchCurrentUser());
    } else {
      dispatch(setInitialCheckDone());
    }
  }, [dispatch]);

  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Centralized Toaster Notification for Success & Errors */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#09090b',
              color: '#f4f4f5',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '16px',
              padding: '12px 18px',
              border: '1px solid #27272a',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#6366f1',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#ffffff',
              },
            },
          }}
        />

        {/* Global Frosted-Glass Auth Gatekeeper Modal */}
        <AuthModal />

        <Routes>
          {/* Guest-First Main Dashboard (Fully accessible immediately!) */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/accounts" element={<DashboardPage />} />
          <Route path="/posts" element={<DashboardPage />} />
          <Route path="/posts/new" element={<DashboardPage />} />
          <Route path="/settings" element={<DashboardPage />} />

          {/* Standalone Authentication & OAuth Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/social/callback" element={<OAuthCallbackPage />} />

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
