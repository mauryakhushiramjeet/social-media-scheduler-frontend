import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { deletePost, updatePost } from '../store/postSlice';
import type { Post } from '../store/postSlice';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Trash2,
  Edit3,
  Filter,
  List,
  CalendarDays,
  Plus,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PostsFeedProps {
  onComposeClick?: () => void;
  statusFilter?: string;
  setStatusFilter?: (status: string) => void;
  compact?: boolean;
}

export const PostsFeed: React.FC<PostsFeedProps> = ({
  onComposeClick,
  statusFilter = 'ALL',
  setStatusFilter,
  compact = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { posts, loading } = useSelector((state: RootState) => state.posts);
  const { executeWithAuth } = useAuth();

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [internalStatusFilter, setInternalStatusFilter] = useState<string>('ALL');
  const [postTypeFilter, setPostTypeFilter] = useState<string>('ALL');

  // Edit / Reschedule Modal State
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editCaption, setEditCaption] = useState<string>('');
  const [editScheduledAt, setEditScheduledAt] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const activeStatus = setStatusFilter ? statusFilter : internalStatusFilter;
  const handleStatusChange = (st: string) => {
    if (setStatusFilter) setStatusFilter(st);
    else setInternalStatusFilter(st);
  };

  const filteredPosts = posts.filter((post) => {
    if (activeStatus !== 'ALL' && post.status !== activeStatus) return false;
    if (postTypeFilter !== 'ALL' && post.postType !== postTypeFilter) return false;
    return true;
  });

  const handleDelete = (id: string) => {
    executeWithAuth(
      async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
          await dispatch(deletePost(id));
        }
      },
      {
        title: 'Delete Post',
        subtitle: 'Sign in to confirm deleting this post from your schedule.',
      }
    );
  };

  const openEditModal = (post: Post) => {
    if (post.status === 'PUBLISHED') {
      toast.error('Cannot edit a post that has already been published.');
      return;
    }
    executeWithAuth(
      () => {
        setEditingPost(post);
        setEditCaption(post.caption);
        setEditScheduledAt(post.scheduledAt ? post.scheduledAt.slice(0, 16) : '');
      },
      {
        title: 'Edit & Reschedule',
        subtitle: 'Sign in to modify your scheduled post.',
      }
    );
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    setIsUpdating(true);
    try {
      await dispatch(
        updatePost({
          id: editingPost.id,
          data: {
            caption: editCaption,
            scheduledAt: editScheduledAt ? new Date(editScheduledAt).toISOString() : undefined,
          },
        })
      ).unwrap();
      setEditingPost(null);
    } catch {
      // Handled by api interceptor
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <Clock className="w-3 h-3" /> Scheduled
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-3 h-3" /> Published
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            <FileText className="w-3 h-3" /> Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-400 font-bold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {['ALL', 'SCHEDULED', 'PUBLISHED', 'DRAFT', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => handleStatusChange(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                activeStatus === st
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Post Type Dropdown */}
          <select
            value={postTypeFilter}
            onChange={(e) => setPostTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-semibold focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="FEED">Feed</option>
            <option value="REEL">Reel</option>
            <option value="STORY">Story</option>
            <option value="CAROUSEL">Carousel</option>
          </select>

          {/* View Toggle */}
          {!compact && (
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
                title="Calendar Timeline View"
              >
                <CalendarDays className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center text-xs text-zinc-400">
          Fetching dispatch queue...
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredPosts.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            No posts in queue
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            {activeStatus === 'ALL'
              ? 'You have not drafted or scheduled any posts yet. Start composing to see them here!'
              : `There are currently no posts with status "${activeStatus}".`}
          </p>
          {onComposeClick && (
            <div className="pt-2">
              <button
                onClick={onComposeClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer shadow-xs shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Compose New Post</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Posts List View */}
      {!loading && filteredPosts.length > 0 && viewMode === 'list' && (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge(post.status)}
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {post.postType}
                  </span>
                  {post.platforms && post.platforms.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span>to</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {post.platforms.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  {post.scheduledAt ? (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{new Date(post.scheduledAt).toLocaleString()}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Created {new Date(post.createdAt).toLocaleDateString()}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body: Caption & Media */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap flex-1">
                  {post.caption}
                </p>

                {post.mediaUrls && post.mediaUrls.length > 0 && post.mediaUrls[0] && (
                  <div className="w-24 h-24 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0">
                    <img
                      src={post.mediaUrls[0]}
                      alt="Media attachment"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Card Footer: Action Buttons */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-400">
                  Post ID: <span className="font-mono">{post.id.slice(0, 8)}...</span>
                </span>

                <div className="flex items-center gap-2">
                  {post.status !== 'PUBLISHED' && (
                    <button
                      onClick={() => openEditModal(post)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(post.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Posts Calendar / Timeline View */}
      {!loading && filteredPosts.length > 0 && viewMode === 'calendar' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              Upcoming Schedule Timeline
            </h3>
          </div>

          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
            {filteredPosts.map((post) => (
              <div key={post.id} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-zinc-900" />

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.scheduledAt
                        ? new Date(post.scheduledAt).toLocaleString()
                        : 'Immediate Dispatch'}
                    </span>
                    {getStatusBadge(post.status)}
                  </div>

                  <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2">
                    {post.caption}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-400">
                    <span>
                      Target:{' '}
                      <strong className="text-zinc-600 dark:text-zinc-300">
                        {post.platforms?.join(', ') || 'All linked channels'}
                      </strong>
                    </span>

                    <button
                      onClick={() => openEditModal(post)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit / Reschedule Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Edit Scheduled Post
                </h3>
              </div>
              <button
                onClick={() => setEditingPost(null)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Caption
                </label>
                <textarea
                  rows={4}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Scheduled Time
                </label>
                <input
                  type="datetime-local"
                  value={editScheduledAt}
                  onChange={(e) => setEditScheduledAt(e.target.value)}
                  className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer disabled:opacity-60 shadow-xs shadow-indigo-600/20"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
