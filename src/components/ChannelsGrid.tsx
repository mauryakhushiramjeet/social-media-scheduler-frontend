import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { connectSocialAccount, disconnectSocialAccount, syncSocialAccounts } from '../store/socialSlice';
import { SUPPORTED_PLATFORMS } from '../constants/apiEndpoints';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  RefreshCw,
  CheckCircle2,
  Plus,
  ExternalLink,
  PowerOff,
  Search,
  Sparkles,
} from 'lucide-react';

interface ChannelsGridProps {
  compact?: boolean;
}

export const ChannelsGrid: React.FC<ChannelsGridProps> = ({ compact = false }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { accounts, loading, connectingPlatform } = useSelector((state: RootState) => state.social);
  const { executeWithAuth } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Map connected accounts by platform lowercase
  const connectedMap = new Map<string, (typeof accounts)[0]>();
  accounts.forEach((acc) => {
    if (acc.status === 'CONNECTED') {
      connectedMap.set(acc.platform.toLowerCase(), acc);
    }
  });

  const handleConnect = (platformId: string, platformName: string) => {
    executeWithAuth(
      async () => {
        if (platformId === 'instagram') {
          toast(
            'Instagram Note: Meta requires an Instagram Creator/Business account. When prompted to convert, click "Continue" or "Convert".',
            {
              icon: '📸',
              duration: 6000,
            }
          );
        }
        await dispatch(connectSocialAccount(platformId));
      },
      {
        mode: 'login',
        title: `Connect ${platformName}`,
        subtitle: `Sign in or create an account to link your ${platformName} channel and enable auto-publishing.`,
      }
    );
  };

  const handleDisconnect = (platformId: string, platformName: string) => {
    executeWithAuth(
      async () => {
        if (window.confirm(`Are you sure you want to disconnect ${platformName}?`)) {
          await dispatch(disconnectSocialAccount(platformId));
        }
      },
      {
        title: `Disconnect ${platformName}`,
        subtitle: 'Sign in to manage channel connections.',
      }
    );
  };

  const handleSyncAll = () => {
    executeWithAuth(
      async () => {
        setIsSyncing(true);
        try {
          await dispatch(syncSocialAccounts()).unwrap();
        } finally {
          setIsSyncing(false);
        }
      },
      {
        title: 'Sync Channels',
        subtitle: 'Sign in to synchronize all your social channel statuses.',
      }
    );
  };

  const filteredPlatforms = SUPPORTED_PLATFORMS.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const connectedCount = connectedMap.size;

  return (
    <div className="space-y-4">
      {/* Channels Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Connected Channels
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
              {connectedCount} of {SUPPORTED_PLATFORMS.length} Active
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Link your social networks for unified scheduling and cross-channel publishing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!compact && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search platforms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          <button
            onClick={handleSyncAll}
            disabled={isSyncing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer disabled:opacity-60"
            title="Refresh connection statuses"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Channels'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Platforms */}
      <div
        className={`grid gap-3 ${
          compact
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }`}
      >
        {filteredPlatforms.map((platform) => {
          const connectedAcc = connectedMap.get(platform.id.toLowerCase());
          const isConnected = !!connectedAcc;
          const isConnecting = connectingPlatform === platform.id;

          if (compact) {
            return (
              <div
                key={platform.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isConnected
                    ? 'bg-white dark:bg-zinc-900 border-indigo-200 dark:border-indigo-900/60 shadow-xs'
                    : 'bg-white/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl" role="img" aria-label={platform.name}>
                    {platform.icon}
                  </span>
                  {isConnected ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  )}
                </div>
                <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                  {platform.name}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                  {isConnected ? connectedAcc?.username || 'Connected' : 'Not linked'}
                </div>
                <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(platform.id, platform.name)}
                      className="w-full text-[11px] text-zinc-500 hover:text-rose-600 font-medium py-0.5 transition-colors cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(platform.id, platform.name)}
                      className="w-full inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 py-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Connect
                    </button>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div
              key={platform.id}
              className={`p-4 rounded-2xl border transition-all group relative flex flex-col justify-between ${
                isConnected
                  ? 'bg-white dark:bg-zinc-900 border-emerald-500/30 dark:border-emerald-500/20 shadow-xs shadow-emerald-500/5'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                      {platform.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                          {platform.name}
                        </h3>
                        {platform.id === 'instagram' && !isConnected && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                            Creator / Business
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {isConnected ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate inline-block max-w-[120px]">
                            @{connectedAcc?.username || connectedAcc?.displayName || 'linked'}
                          </span>
                        ) : platform.id === 'instagram' ? (
                          'Requires free Creator/Business account'
                        ) : (
                          'Ready to connect'
                        )}
                      </p>
                    </div>
                  </div>

                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full">
                      Offline
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                {isConnected ? (
                  <>
                    <span className="text-[10px] text-zinc-400">Auto-publish ON</span>
                    <button
                      onClick={() => handleDisconnect(platform.id, platform.name)}
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-rose-500 font-medium transition-colors cursor-pointer"
                    >
                      <PowerOff className="w-3 h-3" />
                      <span>Disconnect</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" /> 1-Click Link
                    </span>
                    <button
                      onClick={() => handleConnect(platform.id, platform.name)}
                      disabled={isConnecting}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-xs shadow-indigo-600/20 cursor-pointer disabled:opacity-60"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isConnecting ? 'Opening...' : 'Connect'}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
