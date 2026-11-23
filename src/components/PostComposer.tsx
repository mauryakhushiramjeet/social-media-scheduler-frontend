import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { createPost } from '../store/postSlice';
import { SUPPORTED_PLATFORMS, API_BASE_URL } from '../constants/apiEndpoints';
import { useAuth } from '../context/AuthContext';
import {
  Send,
  Calendar,
  Clock,
  Image as ImageIcon,
  Smile,
  Hash,
  X,
  Sparkles,
  Layers,
  Film,
  Compass,
  Check,
  Upload,
  FileVideo,
  PlayCircle,
  Video,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PostComposerProps {
  onPostCreated?: () => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ onPostCreated }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { creating } = useSelector((state: RootState) => state.posts);
  const { executeWithAuth, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [postType, setPostType] = useState<'FEED' | 'REEL' | 'STORY' | 'CAROUSEL'>('FEED');
  const [caption, setCaption] = useState<string>('');

  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false);

  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledAt, setScheduledAt] = useState<string>('');

  const charLimit = 280;
  const remainingChars = charLimit - caption.length;

  const selectPlatform = (id: string) => {
    if (postType === 'STORY' && id !== 'instagram') {
      toast.error('Stories can only be posted to Instagram.');
      return;
    }
    setSelectedPlatforms([id]);
  };

  const handlePostTypeChange = (type: 'FEED' | 'REEL' | 'STORY' | 'CAROUSEL') => {
    setPostType(type);
    if (type === 'REEL') {
      setIsVideo(true);
    }
    if (type === 'STORY') {
      setSelectedPlatforms(['instagram']);
    }
  };

  const insertEmoji = (emoji: string) => {
    setCaption((prev) => prev + ' ' + emoji);
  };

  const insertHashtag = (tag: string) => {
    setCaption((prev) => prev + ' ' + tag);
  };

  // Handle local file selection with immediate upload to backend & Zernio
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideoFile = file.type.startsWith('video/');
    setIsVideo(isVideoFile);
    setMediaFile(file);
    setIsUploadingMedia(true);

    const formData = new FormData();
    formData.append('file', file);

    const uploadToast = toast.loading(`Uploading ${isVideoFile ? 'video' : 'image'} to cloud storage...`);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/media/upload`, formData, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'multipart/form-data',
        },
      });

      // The real public HTTPS URL returned by backend & Zernio
      const publicUrl = response.data?.data?.url || response.data?.url;

      if (!publicUrl) {
        throw new Error('Upload succeeded but no public URL was returned');
      }

      // Store the real public HTTPS URL so it gets sent in mediaUrls
      setMediaUrl(publicUrl);
      setMediaPreview(publicUrl);
      toast.success(
        `${isVideoFile ? 'Video' : 'Image'} uploaded successfully!`,
        { id: uploadToast }
      );
    } catch (error: any) {
      console.error('Upload failed:', error);
      const errMsg = error.response?.data?.message || error.message || 'File upload failed';
      toast.error(errMsg, { id: uploadToast });
      handleRemoveMedia();
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setMediaUrl(url);
    if (url) {
      setMediaFile(null);
      setMediaPreview(url);
      const isVideoLink =
        url.endsWith('.mp4') ||
        url.endsWith('.mov') ||
        url.endsWith('.webm') ||
        url.includes('video') ||
        postType === 'REEL';
      setIsVideo(isVideoLink);
    } else {
      setMediaPreview('');
      setIsVideo(postType === 'REEL');
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
    setMediaUrl('');
    setIsVideo(postType === 'REEL');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPlatforms.length === 0) {
      toast.error('Please select a target channel.');
      return;
    }

    if (isUploadingMedia) {
      toast.error('Please wait for the media file to finish uploading.');
      return;
    }

    if (postType !== 'STORY' && !caption.trim()) {
      toast.error('Post caption cannot be empty.');
      return;
    }

    if ((postType === 'REEL' || postType === 'STORY') && !mediaUrl) {
      toast.error(
        postType === 'STORY'
          ? 'Please choose an image or video file for your Instagram Story.'
          : 'Please choose a video file or provide a video URL for your Reel.'
      );
      return;
    }

    if (isScheduled && !scheduledAt) {
      toast.error('Please specify a schedule date and time.');
      return;
    }

    // Intercept with Auth if guest without losing form values
    executeWithAuth(
      async () => {
        // Send only the real public HTTPS URL (never a blob: URL)
        const payload = {
          caption: postType === 'STORY' ? '' : caption.trim(),
          platforms: selectedPlatforms,
          postType,
          mediaUrls: mediaUrl.trim() ? [mediaUrl.trim()] : [],
          scheduledAt: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        };

        const resultAction = await dispatch(createPost(payload));
        if (createPost.fulfilled.match(resultAction)) {
          // Reset form
          setCaption('');
          handleRemoveMedia();
          setIsScheduled(false);
          setScheduledAt('');
          if (onPostCreated) onPostCreated();
        }
      },
      {
        title: isScheduled ? 'Schedule Your Post' : 'Publish Your Post',
        subtitle:
          'Sign in or register to dispatch your post to the selected channel. Your draft has been preserved.',
      }
    );
  };

  const isReelMode = postType === 'REEL';
  const isStoryMode = postType === 'STORY';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-xs">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                Post Composer
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                Single Channel
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Draft, choose media or reels, and publish or schedule to your selected channel.
            </p>
          </div>

          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 self-start sm:self-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>1 Account Selected</span>
          </div>
        </div>

        {/* 1. Target Platforms Selector (Single Account Selection) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Target Channel <span className="font-normal text-zinc-400 text-[11px]">(Select 1 account to share)</span>
            </label>
            {isStoryMode && (
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                📸 Stories only on Instagram
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_PLATFORMS.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.id);
              const isDisabled = isStoryMode && platform.id !== 'instagram';
              return (
                <button
                  type="button"
                  key={platform.id}
                  disabled={isDisabled}
                  onClick={() => selectPlatform(platform.id)}
                  title={isDisabled ? 'Stories are only supported on Instagram' : platform.name}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${isDisabled
                    ? 'opacity-35 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 cursor-not-allowed'
                    : isSelected
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30 ring-2 ring-indigo-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                >
                  <span>{platform.icon}</span>
                  <span>{platform.name}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5 opacity-90" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Post Format Tabs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Post Format
            </label>
            {isReelMode && (
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <PlayCircle className="w-3.5 h-3.5" /> Reel / Short Video Mode
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'FEED', label: 'Feed Post', icon: <Layers className="w-4 h-4" /> },
              { id: 'REEL', label: 'Reel / Short', icon: <Film className="w-4 h-4" /> },
              { id: 'STORY', label: 'Story', icon: <Compass className="w-4 h-4" /> },
              { id: 'CAROUSEL', label: 'Carousel', icon: <Sparkles className="w-4 h-4" /> },
            ].map((type) => (
              <button
                type="button"
                key={type.id}
                onClick={() => handlePostTypeChange(type.id as any)}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${postType === type.id
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800'
                  }`}
              >
                {type.icon}
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Caption Textarea (Hidden for Story mode) */}
        {isStoryMode ? (
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Compass className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                Instagram Story Mode (Media Only)
              </h4>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Instagram Stories are purely visual media. The Instagram Story API does not support text captions, so no caption is needed. Attach your photo or video below to publish directly to your Instagram Story!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-zinc-700 dark:text-zinc-300">Caption</label>
              <span
                className={`font-mono text-[11px] font-semibold ${remainingChars < 0 ? 'text-rose-500' : 'text-zinc-400'
                  }`}
              >
                {remainingChars} chars remaining
              </span>
            </div>

            <div className="relative">
              <textarea
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={
                  isReelMode
                    ? "Write a caption for your Reel / Short..."
                    : "What's happening? Write your post caption..."
                }
                className="w-full p-3.5 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
              />
            </div>

            {/* Quick Helper Chips (Hashtags & Emojis) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Tags:
                </span>
                {['#launch', '#growth', '#updates', '#tech', '#ai'].map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => insertHashtag(tag)}
                    className="px-2 py-0.5 text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                  <Smile className="w-3 h-3" /> Emojis:
                </span>
                {['🚀', '✨', '💡', '🔥', '📢'].map((em) => (
                  <button
                    type="button"
                    key={em}
                    onClick={() => insertEmoji(em)}
                    className="p-1 text-xs hover:scale-125 transition-transform cursor-pointer"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. Media & Reel Chooser (Simple & Direct) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {isReelMode
                ? 'Reel Video Attachment'
                : isStoryMode
                  ? 'Story Media Attachment (Photo or Video)'
                  : 'Media Attachment (Image or Video)'}
            </label>
            {mediaPreview && (
              <button
                type="button"
                onClick={handleRemoveMedia}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
              >
                Clear Attachment
              </button>
            )}
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={
              isReelMode
                ? 'video/mp4,video/quicktime,video/webm,video/*'
                : 'image/*,video/*'
            }
            className="hidden"
          />

          {/* Choose File Button & Direct URL Input */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <button
              type="button"
              disabled={isUploadingMedia}
              onClick={() => fileInputRef.current?.click()}
              className="sm:col-span-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer disabled:opacity-60"
            >
              {isUploadingMedia ? (
                <>
                  <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  <span>Uploading Media...</span>
                </>
              ) : isReelMode ? (
                <>
                  <FileVideo className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Choose Reel Video</span>
                </>
              ) : isStoryMode ? (
                <>
                  <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Choose Story Media</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Choose Media File</span>
                </>
              )}
            </button>

            <div className="sm:col-span-8 relative">
              {isReelMode ? (
                <Video className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              ) : (
                <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              )}
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={
                  isReelMode
                    ? 'Or paste Reel / Video URL (e.g. https://...video.mp4)'
                    : isStoryMode
                      ? 'Or paste Story Image / Video URL'
                      : 'Or paste Image / Video URL'
                }
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Reel / Media Preview */}
          {mediaPreview && (
            <div className="relative mt-3 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700/80 bg-zinc-950 p-2 space-y-2">
              <div className="flex items-center justify-between px-2 pt-1">
                <div className="flex items-center gap-2 text-white text-xs font-medium truncate">
                  {isVideo || isReelMode ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[11px] font-bold">
                      <Film className="w-3 h-3" /> Reel Video
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-bold">
                      <ImageIcon className="w-3 h-3" /> Image
                    </span>
                  )}
                  {mediaFile ? (
                    <span className="text-zinc-300 text-[11px] truncate">
                      {mediaFile.name} ({(mediaFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </span>
                  ) : (
                    <span className="text-zinc-400 text-[11px] truncate">URL Attached</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Video Player or Image Viewer */}
              {isVideo || isReelMode ? (
                <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-72">
                  <video
                    src={mediaPreview}
                    controls
                    className="max-h-72 w-full object-contain rounded-xl"
                  />
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden max-h-60 flex items-center justify-center bg-zinc-900">
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="max-h-60 w-full object-contain rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Scheduling Options */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Dispatch Mode
              </span>
            </div>

            <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setIsScheduled(false)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${!isScheduled
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
                  }`}
              >
                Instant Publish
              </button>
              <button
                type="button"
                onClick={() => setIsScheduled(true)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${isScheduled
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
                  }`}
              >
                Schedule Later
              </button>
            </div>
          </div>

          {isScheduled && (
            <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3.5 h-3.5" /> Target Time:
              </span>
              <input
                type="datetime-local"
                value={scheduledAt}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="text-xs px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-zinc-400">
                Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </span>
            </div>
          )}
        </div>

        {/* Submit Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {!isAuthenticated && (
              <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Draft is saved in live memory. Sign in will dispatch instantly.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={creating || isUploadingMedia}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/25 cursor-pointer disabled:opacity-60"
          >
            {creating ? (
              <span>Publishing...</span>
            ) : isUploadingMedia ? (
              <span>Uploading Media...</span>
            ) : isScheduled ? (
              <>
                <Calendar className="w-4 h-4" />
                <span>Schedule {isReelMode ? 'Reel' : isStoryMode ? 'Story' : 'Post'}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Publish {isReelMode ? 'Reel' : isStoryMode ? 'Story' : 'Post'} Now</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
