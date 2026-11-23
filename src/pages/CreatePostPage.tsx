import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { createPost } from '../store/postSlice';
import { fetchSocialAccounts } from '../store/socialSlice';
import { Navbar } from '../components/Navbar';
import {
  Send,
  Image as ImageIcon,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react';

export const CreatePostPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { accounts } = useSelector((state: RootState) => state.social);
  const { creating } = useSelector((state: RootState) => state.posts);

  const [scheduleType, setScheduleType] = useState<'NOW' | 'LATER'>('NOW');
  const [mediaUrlInput, setMediaUrlInput] = useState('');

  useEffect(() => {
    dispatch(fetchSocialAccounts());
  }, [dispatch]);

  // Connected platforms available for selection
  const connectedPlatforms = accounts.filter((a) => a.status === 'CONNECTED');

  const validationSchema = Yup.object({
    caption: Yup.string().test(
      'caption-required',
      'Caption is required',
      function (val) {
        const { postType } = this.parent;
        if (postType === 'STORY') return true;
        return Boolean(val && val.trim().length > 0);
      }
    ),
    platforms: Yup.array()
      .of(Yup.string())
      .min(1, 'Select a platform')
      .max(1, 'You can select only one account at a time'),
    postType: Yup.string()
      .oneOf(['FEED', 'REEL', 'STORY', 'CAROUSEL'])
      .required('Post format type is required'),
    mediaUrls: Yup.array().of(Yup.string().url('Must be a valid URL')).test(
      'media-requirements',
      'Media URL is required for REEL/STORY and at least 2 for CAROUSEL',
      function (mediaUrls) {
        const { postType } = this.parent;
        const count = mediaUrls ? mediaUrls.length : 0;
        if (postType === 'REEL' || postType === 'STORY') {
          return count >= 1;
        }
        if (postType === 'CAROUSEL') {
          return count >= 2;
        }
        return true;
      }
    ),
    scheduledAt: Yup.string().test(
      'schedule-required',
      'Scheduled date and time is required when scheduling for later',
      function (val) {
        if (scheduleType === 'LATER') {
          return Boolean(val);
        }
        return true;
      }
    ),
  });

  const formik = useFormik({
    initialValues: {
      caption: '',
      platforms: connectedPlatforms.length > 0 ? [connectedPlatforms[0].platform.toLowerCase()] : ['instagram'],
      postType: 'FEED' as 'FEED' | 'REEL' | 'STORY' | 'CAROUSEL',
      mediaUrls: [] as string[],
      scheduledAt: '',
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      const payload = {
        caption: values.postType === 'STORY' ? '' : values.caption.trim(),
        platforms: values.platforms,
        postType: values.postType,
        mediaUrls: values.mediaUrls,
        scheduledAt: scheduleType === 'LATER' && values.scheduledAt ? new Date(values.scheduledAt).toISOString() : null,
      };

      const result = await dispatch(createPost(payload));
      if (createPost.fulfilled.match(result)) {
        navigate('/dashboard');
      }
    },
  });

  const selectPlatform = (platformId: string) => {
    const id = platformId.toLowerCase();
    if (formik.values.postType === 'STORY' && id !== 'instagram') {
      return;
    }
    formik.setFieldValue('platforms', [id]);
  };

  const handlePostTypeChange = (type: 'FEED' | 'REEL' | 'STORY' | 'CAROUSEL') => {
    formik.setFieldValue('postType', type);
    if (type === 'STORY') {
      formik.setFieldValue('platforms', ['instagram']);
    }
  };

  const handleAddMediaUrl = () => {
    if (!mediaUrlInput.trim()) return;
    formik.setFieldValue('mediaUrls', [...formik.values.mediaUrls, mediaUrlInput.trim()]);
    setMediaUrlInput('');
  };

  const handleRemoveMediaUrl = (idx: number) => {
    const updated = formik.values.mediaUrls.filter((_, i) => i !== idx);
    formik.setFieldValue('mediaUrls', updated);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Create & Schedule Post
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Publish immediately or schedule for future delivery across your connected channels
            </p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-6">
            {/* 1. Platform Selector (Single Account Selection) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">
                  Select Target Account (Select 1 channel)
                </label>
                {formik.values.postType === 'STORY' && (
                  <span className="text-xs text-indigo-600 font-semibold">
                    Stories are only supported on Instagram
                  </span>
                )}
                {connectedPlatforms.length === 0 && (
                  <span className="text-xs text-amber-600 font-medium">
                    No connected platforms. Go to Accounts to connect channels.
                  </span>
                )}
              </div>

              {connectedPlatforms.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {connectedPlatforms.map((acc) => {
                    const id = acc.platform.toLowerCase();
                    const isSelected = formik.values.platforms.includes(id);
                    const isDisabled = formik.values.postType === 'STORY' && id !== 'instagram';
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => selectPlatform(id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                          isDisabled
                            ? 'opacity-40 bg-slate-100 text-slate-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                        }`}
                      >
                        <span className="capitalize">{id}</span>
                        {acc.username && (
                          <span className="text-[10px] opacity-80">@{acc.username}</span>
                        )}
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                  <span>Connect accounts like Instagram, X, or LinkedIn to publish.</span>
                  <button
                    type="button"
                    onClick={() => navigate('/accounts')}
                    className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                  >
                    Go to Accounts
                  </button>
                </div>
              )}

              {formik.touched.platforms && formik.errors.platforms && (
                <p className="mt-1 text-xs text-rose-600">{formik.errors.platforms as string}</p>
              )}
            </div>

            {/* 2. Post Format Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Post Format Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['FEED', 'REEL', 'STORY', 'CAROUSEL'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handlePostTypeChange(type)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                      formik.values.postType === type
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {formik.values.postType === 'FEED' && 'Standard text & image post.'}
                {formik.values.postType === 'REEL' && 'Video reel format (requires 1 video/media URL).'}
                {formik.values.postType === 'STORY' && 'Ephemeral story format (Instagram media only, no caption).'}
                {formik.values.postType === 'CAROUSEL' && 'Multi-slide album (requires ≥ 2 media URLs).'}
              </p>
            </div>

            {/* 3. Caption Textarea (Hidden for Story mode) */}
            {formik.values.postType === 'STORY' ? (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3">
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-indigo-950">
                    Instagram Story Mode (Media Only)
                  </h4>
                  <p className="text-indigo-800 leading-relaxed">
                    Instagram Stories are purely visual media. Captions are not supported on Stories, so no caption is needed. Please add your media URL below.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Caption Content</label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {formik.values.caption.length} characters
                  </span>
                </div>
                <textarea
                  id="caption"
                  name="caption"
                  rows={4}
                  placeholder="Write your post caption..."
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.caption}
                  className={`w-full p-3.5 bg-slate-50 border rounded-2xl text-sm transition-all focus:bg-white focus:outline-hidden ${
                    formik.touched.caption && formik.errors.caption
                      ? 'border-rose-300 focus:ring-2 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                  }`}
                />
                {formik.touched.caption && formik.errors.caption && (
                  <p className="mt-1 text-xs text-rose-600">{formik.errors.caption}</p>
                )}
              </div>
            )}

            {/* 4. Media URLs Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Media URLs (Images or Videos)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={mediaUrlInput}
                    onChange={(e) => setMediaUrlInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddMediaUrl}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add URL</span>
                </button>
              </div>

              {/* List of added media URLs */}
              {formik.values.mediaUrls.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  {formik.values.mediaUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <span className="font-mono text-slate-600 truncate max-w-md">{url}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMediaUrl(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formik.touched.mediaUrls && formik.errors.mediaUrls && (
                <p className="mt-1 text-xs text-rose-600">{formik.errors.mediaUrls as string}</p>
              )}
            </div>

            {/* 5. Scheduling Options: Publish Now vs Schedule for Later */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Publishing Options
              </label>

              <div className="flex gap-3 mb-3">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={scheduleType === 'NOW'}
                    onChange={() => setScheduleType('NOW')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Publish Immediately</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={scheduleType === 'LATER'}
                    onChange={() => setScheduleType('LATER')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Schedule for Later</span>
                </label>
              </div>

              {scheduleType === 'LATER' && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Target Date & Time
                  </label>
                  <input
                    id="scheduledAt"
                    name="scheduledAt"
                    type="datetime-local"
                    onChange={formik.handleChange}
                    value={formik.values.scheduledAt}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                  {formik.touched.scheduledAt && formik.errors.scheduledAt && (
                    <p className="text-xs text-rose-600">{formik.errors.scheduledAt}</p>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {creating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  {scheduleType === 'LATER' ? 'Schedule Post' : 'Publish Immediately'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreatePostPage;
