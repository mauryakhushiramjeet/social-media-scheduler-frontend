import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { fetchSocialAccounts } from '../store/socialSlice';
import { fetchPosts } from '../store/postSlice';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { ChannelsGrid } from '../components/ChannelsGrid';
import { PostComposer } from '../components/PostComposer';
import { PostsFeed } from '../components/PostsFeed';
import { SUPPORTED_PLATFORMS } from '../constants/apiEndpoints';
import {
  Layers,
  CalendarClock,
  CheckCircle2,
  Share2,
  User,
  Shield,
  Key,
  LogOut,
  Mail,
  Zap,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { accounts } = useSelector((state: RootState) => state.social);
  const { posts } = useSelector((state: RootState) => state.posts);

  const [activeSection, setActiveSection] = useState<
    'overview' | 'composer' | 'calendar' | 'channels' | 'settings'
  >('overview');

  useEffect(() => {
    // Only fetch protected data if user is authenticated or has active token
    const token = localStorage.getItem('token');
    if (isAuthenticated || token) {
      dispatch(fetchSocialAccounts());
      dispatch(fetchPosts(undefined));
    }
  }, [dispatch, isAuthenticated]);

  const connectedChannels = accounts.filter((a) => a.status === 'CONNECTED');
  const scheduledPosts = posts.filter((p) => p.status === 'SCHEDULED');
  const publishedPosts = posts.filter((p) => p.status === 'PUBLISHED');

  return (
    <DashboardLayout
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      onNewPostClick={() => setActiveSection('composer')}
    >
      {/* 1. OVERVIEW SECTION */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Connected Channels
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                    {connectedChannels.length}
                  </h3>
                  <span className="text-[11px] text-zinc-400">/ {SUPPORTED_PLATFORMS.length} networks</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Scheduled Queue
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                    {scheduledPosts.length}
                  </h3>
                  <span className="text-[11px] text-zinc-400">queued</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <CalendarClock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Dispatched All-Time
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                    {publishedPosts.length}
                  </h3>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    published
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Quick Publish
                </p>
                <button
                  onClick={() => setActiveSection('composer')}
                  className="mt-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" /> Open Composer
                </button>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Quick Channels Strip */}
          <ChannelsGrid compact={true} />

          {/* Main Workspace Split: Post Composer & Queue Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Post Composer Column */}
            <div className="lg:col-span-7">
              <PostComposer onPostCreated={() => dispatch(fetchPosts(undefined))} />
            </div>

            {/* Upcoming Queue Preview Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Upcoming Queue ({scheduledPosts.length})
                </h3>
                <button
                  onClick={() => setActiveSection('calendar')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <PostsFeed
                compact={true}
                statusFilter="SCHEDULED"
                onComposeClick={() => setActiveSection('composer')}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. DEDICATED COMPOSER SECTION */}
      {activeSection === 'composer' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <PostComposer
            onPostCreated={() => {
              dispatch(fetchPosts(undefined));
              setActiveSection('calendar');
            }}
          />
        </div>
      )}

      {/* 3. DEDICATED CALENDAR / QUEUE SECTION */}
      {activeSection === 'calendar' && (
        <div className="space-y-6">
          <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Scheduled Queue & Timeline
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Track, reschedule, and manage scheduled posts across all your active channels.
              </p>
            </div>
          </div>

          <PostsFeed onComposeClick={() => setActiveSection('composer')} />
        </div>
      )}

      {/* 4. CHANNELS MANAGEMENT SECTION */}
      {activeSection === 'channels' && (
        <div className="space-y-6">
          <ChannelsGrid compact={false} />
        </div>
      )}

      {/* 5. SETTINGS SECTION */}
      {activeSection === 'settings' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                    {isAuthenticated ? user?.name : 'Guest User'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {isAuthenticated ? user?.email : 'Exploring in Guest Mode'}
                  </p>
                </div>
              </div>

              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer shadow-xs shadow-indigo-600/20"
                >
                  Sign In / Register
                </button>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                Account & Security Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                  <span className="text-zinc-400 flex items-center gap-1.5 font-medium mb-1">
                    <Shield className="w-3.5 h-3.5" /> Session Status
                  </span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {isAuthenticated ? 'Active Session' : 'Guest Session'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                  <span className="text-zinc-400 flex items-center gap-1.5 font-medium mb-1">
                    <Key className="w-3.5 h-3.5" /> Connected Channels
                  </span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {connectedChannels.length} Linked
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 sm:col-span-2">
                  <span className="text-zinc-400 flex items-center gap-1.5 font-medium mb-1">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </span>
                  <span className="font-mono text-zinc-800 dark:text-zinc-200">
                    {isAuthenticated ? user?.email : 'Unregistered'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
