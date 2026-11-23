import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { syncSocialAccounts } from '../store/socialSlice';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const OAuthCallbackPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    const handleSync = async () => {
      // Check for OAuth cancellation or error params in URL
      const searchParams = new URLSearchParams(window.location.search);
      const errorMsg =
        searchParams.get('error_description') ||
        searchParams.get('error') ||
        searchParams.get('message');

      if (errorMsg) {
        toast.error(`Authorization canceled: ${errorMsg}`);
        navigate('/accounts', { replace: true });
        return;
      }

      try {
        await dispatch(syncSocialAccounts()).unwrap();
        toast.success('Social account connected and synchronized!');
      } catch (err: any) {
        toast.error(err?.message || 'Sync after authorization failed');
      } finally {
        navigate('/accounts', { replace: true });
      }
    };

    handleSync();
  }, [dispatch, navigate]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center antialiased">
      <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm max-w-sm w-full space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Synchronizing Account...</h2>
        <p className="text-xs text-slate-500">
          Completing authorization and pulling your connected handles into your dashboard.
        </p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
