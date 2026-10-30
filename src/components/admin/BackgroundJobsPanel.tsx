import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, CheckCircle2, X, ArrowRight, Eye, ShieldCheck, RefreshCw } from 'lucide-react';
import { CatalogBatchJob } from '../../services/types';

interface BackgroundJobsPanelProps {
  onOpenJobReview: (job: CatalogBatchJob) => void;
  onRefreshProducts?: () => void;
}

export function BackgroundJobsPanel({ onOpenJobReview, onRefreshProducts }: BackgroundJobsPanelProps) {
  const [jobs, setJobs] = useState<CatalogBatchJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/catalog/jobs/active');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      }
    } catch {
      // offline or silent error
    }
  };

  useEffect(() => {
    fetchJobs();
    // Poll every 3.5s if there is an active or processing job, otherwise every 12s
    const hasActive = jobs.some(j => j.status === 'queued' || j.status === 'processing' || j.status === 'uploading');
    const intervalTime = hasActive ? 3500 : 12000;
    const timer = setInterval(fetchJobs, intervalTime);
    return () => clearInterval(timer);
  }, [jobs]);

  const handleDismiss = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    setDismissingId(jobId);
    try {
      await fetch(`/api/catalog/jobs/${jobId}/dismiss`, { method: 'POST' });
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch {
      // ignore
    } finally {
      setDismissingId(null);
    }
  };

  const handleReviewClick = async (jobSummary: CatalogBatchJob) => {
    setIsLoading(true);
    try {
      // Fetch full job with all products
      const res = await fetch(`/api/catalog/jobs/${jobSummary.id}`);
      const data = await res.json();
      if (data.success && data.job) {
        onOpenJobReview(data.job);
      } else {
        onOpenJobReview(jobSummary);
      }
    } catch {
      onOpenJobReview(jobSummary);
    } finally {
      setIsLoading(false);
    }
  };

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const isProcessing = job.status === 'processing' || job.status === 'queued' || job.status === 'uploading';
        const isCompleted = job.status === 'completed';

        return (
          <div
            key={job.id}
            className={`relative overflow-hidden rounded-3xl border p-4 sm:p-5 transition-all shadow-md ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200 shadow-emerald-500/10'
                : 'bg-gradient-to-r from-orange-50 via-amber-50 to-white border-orange-200 shadow-orange-500/10'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Left Column: Status info */}
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 animate-pulse'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {isCompleted
                        ? 'Batch AI Sorting Complete'
                        : job.status === 'uploading'
                        ? 'Receiving Photo Chunks'
                        : 'AI Background Sorting in Progress'}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      Store: {job.sellerName || 'Nick'}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-zinc-900 mt-0.5">
                    {isCompleted ? (
                      <span>
                        {job.totalPhotos} photos sorted into {job.productsCount || job.products?.length || 0} authentic shoes!
                      </span>
                    ) : (
                      <span>
                        Sorting {job.totalPhotos} Photos ({job.processedPhotos || 0}/{job.totalPhotos} processed)
                      </span>
                    )}
                  </h4>

                  <p className="text-xs text-zinc-600 font-medium line-clamp-1 mt-0.5">
                    {job.statusMessage || (isCompleted ? 'Ready for your side-by-side review.' : 'Sorting in background...')}
                  </p>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                {isProcessing && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur rounded-xl border border-orange-200 text-orange-700 text-xs font-bold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                    <span>Device can go offline</span>
                  </div>
                )}

                {isCompleted && (
                  <button
                    onClick={() => handleReviewClick(job)}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/25 active:scale-95 cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    <span>Review & Publish</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={(e) => handleDismiss(e, job.id)}
                  disabled={dismissingId === job.id}
                  className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-black/5 rounded-xl transition-colors cursor-pointer"
                  title="Dismiss job notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Bar for active jobs */}
            {isProcessing && (
              <div className="mt-3.5 pt-3 border-t border-orange-100">
                <div className="flex justify-between items-center text-[11px] font-bold text-zinc-500 mb-1.5">
                  <span>Paced AI sorting at 2s intervals (prevents timeouts & 503s)</span>
                  <span className="text-orange-600 font-black">{job.progressPercent || 0}%</span>
                </div>
                <div className="w-full h-2.5 bg-orange-100/70 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(4, Math.min(100, job.progressPercent || 0))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
