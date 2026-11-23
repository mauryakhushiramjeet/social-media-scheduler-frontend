import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import {
  fetchSocialAccounts,
  connectSocialAccount,
  disconnectSocialAccount,
  syncSocialAccounts,
} from '../store/socialSlice';
import { SUPPORTED_PLATFORMS } from '../constants/apiEndpoints';
import { Navbar } from '../components/Navbar';
import {
  CheckCircle2,
  Plus,
  Unlink,
  RefreshCw,
  Layers,
} from 'lucide-react';

export const AccountsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { accounts, loading, connectingPlatform } = useSelector(
    (state: RootState) => state.social
  );

  useEffect(() => {
    dispatch(fetchSocialAccounts());
  }, [dispatch]);

  const handleConnect = (platformId: string) => {
    dispatch(connectSocialAccount(platformId));
  };

  const handleDisconnect = (platformId: string) => {
    dispatch(disconnectSocialAccount(platformId));
  };

  const handleSync = () => {
    dispatch(syncSocialAccounts());
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header with Title and Sync Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Social Accounts Management
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Connect or disconnect your social channels for direct multi-network publishing
            </p>
          </div>

          <button
            onClick={handleSync}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Accounts</span>
          </button>
        </div>

        {/* Grid of Supported Platforms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SUPPORTED_PLATFORMS.map((platform) => {
            // Check if this platform is currently connected in accounts array
            const connectedAccount = accounts.find(
              (acc) => acc.platform.toLowerCase() === platform.id.toLowerCase()
            );
            const isConnected = Boolean(connectedAccount && connectedAccount.status === 'CONNECTED');
            const isConnecting = connectingPlatform === platform.id;

            return (
              <div
                key={platform.id}
                className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-sm ${
                  isConnected ? 'border-emerald-200/90' : 'border-slate-200/80'
                }`}
              >
                {/* Top Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{platform.icon}</span>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{platform.name}</h3>
                        <span className="text-[10px] text-slate-400 font-mono capitalize">
                          {platform.id}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge: 🟢 Connected or ⚪ Not Connected */}
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                        Not Connected
                      </span>
                    )}
                  </div>

                  {/* Connected Details */}
                  {isConnected && connectedAccount && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5 text-xs">
                      {connectedAccount.username && (
                        <p className="font-semibold text-slate-800 font-mono truncate">
                          @{connectedAccount.username}
                        </p>
                      )}
                      {connectedAccount.displayName && (
                        <p className="text-[11px] text-slate-500 truncate">
                          {connectedAccount.displayName}
                        </p>
                      )}
                      {connectedAccount.connectedAt && (
                        <p className="text-[10px] text-slate-400">
                          Linked on {new Date(connectedAccount.connectedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Action Button */}
                <div className="pt-4 mt-2 border-t border-slate-100">
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(platform.id)}
                      disabled={loading}
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(platform.id)}
                      disabled={isConnecting}
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      <span>Connect</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default AccountsPage;
