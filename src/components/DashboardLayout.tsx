import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { SUPPORTED_PLATFORMS } from '../constants/apiEndpoints';
import {
  Share2,
  LayoutDashboard,
  PenTool,
  CalendarClock,
  Layers,
  Settings,
  LogOut,
  LogIn,
  Plus,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Radio,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeSection: 'overview' | 'composer' | 'calendar' | 'channels' | 'settings';
  setActiveSection: (sec: 'overview' | 'composer' | 'calendar' | 'channels' | 'settings') => void;
  onNewPostClick: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeSection,
  setActiveSection,
  onNewPostClick,
}) => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { accounts } = useSelector((state: RootState) => state.social);
  const { posts } = useSelector((state: RootState) => state.posts);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const connectedCount = accounts.filter((a) => a.status === 'CONNECTED').length;
  const scheduledCount = posts.filter((p) => p.status === 'SCHEDULED').length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex antialiased">
      {/* 1. Left Sidebar (Collapsible) */}
      <aside
        className={`bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between sticky top-0 h-screen z-30 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
            <div
              onClick={() => setActiveSection('overview')}
              className="flex items-center gap-3 cursor-pointer overflow-hidden"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-500/25">
                <Share2 className="w-5 h-5" />
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-white">
                      PulseSocial
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      SaaS
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium truncate">
                    Multi-Network Studio
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors hidden sm:flex cursor-pointer"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveSection('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeSection === 'overview'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Dashboard</span>}
            </button>

            <button
              onClick={() => setActiveSection('composer')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeSection === 'composer'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                }`}
            >
              <PenTool className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Post Composer</span>}
            </button>

            <button
              onClick={() => setActiveSection('calendar')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeSection === 'calendar'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                }`}
            >
              <div className="flex items-center gap-3">
                <CalendarClock className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Queue / Calendar</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono">
                  {scheduledCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection('channels')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeSection === 'channels'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Connected Channels</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono">
                  {connectedCount}/{SUPPORTED_PLATFORMS.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeSection === 'settings'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Settings</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800">
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                {!isSidebarCollapsed && (
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate leading-tight">{user.name}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                )}
              </div>

              {!isSidebarCollapsed && (
                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                  Guest Mode
                </span>
              </div>
              {!isSidebarCollapsed && (
                <>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                    Explore and compose posts freely. Authenticate to sync and publish.
                  </p>
                  <button
                    onClick={() => openAuthModal({ mode: 'login' })}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* 2. Main Workspace Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-6 py-3.5 sticky top-0 z-20 flex items-center justify-between gap-4">
          {/* Breadcrumbs / Page Title */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                  PulseSocial
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">/</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                  {activeSection === 'overview'
                    ? 'Social Hub'
                    : activeSection === 'composer'
                      ? 'Post Composer'
                      : activeSection === 'calendar'
                        ? 'Scheduled Queue'
                        : activeSection === 'channels'
                          ? 'Connected Channels'
                          : 'Workspace Settings'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Pill & Right Actions */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Stats Pill */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                    <span>{connectedCount} Accounts</span>
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">|</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    ⏱️ {scheduledCount} Queued
                  </span>
                </div>

                {/* If GUEST: Show Sign In button in navbar (Opens Auth Modal directly, no separate page) */}
                {!isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => openAuthModal({ mode: 'login' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/80 active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Sign In</span>
                  </button>
                )}

                {/* If LOGGED IN: Show user profile & logout (DO NOT show Sign In button) */}
                {isAuthenticated && user && (
                  <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 hidden sm:inline max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <button
                      type="button"
                      onClick={logout}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Sign Out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* High-visibility Action: + New Post */}
                <button
                  onClick={onNewPostClick}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-600/25 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Post</span>
                </button>
              </div>
            </header>

            {/* Content Body */}
            <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
              {children}
            </main>
          </div>
      </div>
      );
};

      export default DashboardLayout;
