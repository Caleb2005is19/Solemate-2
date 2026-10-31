import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Terminal, 
  StopCircle, 
  ArrowRight, 
  Clock, 
  Layers, 
  Eye, 
  RefreshCw 
} from 'lucide-react';
import { CatalogBatchJob } from '../../types';

interface BatchProgressBannerProps {
  onOpenJobReview: (job: CatalogBatchJob) => void;
  onRefreshProducts?: () => void;
}

export function BatchProgressBanner({ onOpenJobReview, onRefreshProducts }: BatchProgressBannerProps) {
  const [jobs, setJobs] = useState<CatalogBatchJob[]>([]);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const fetchActiveJobs = async () => {
    try {
      const res = await fetch('/api/catalog/jobs/active');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      }
    } catch {
      // silent offline or background error
    }
  };

  useEffect(() => {
    fetchActiveJobs();
    // Poll every 2.5s if there is any actively uploading, queued or processing job; otherwise every 12s
    const hasActiveJob = jobs.some(j => j.status === 'uploading' || j.status === 'queued' || j.status === 'processing');
    const interval = setInterval(fetchActiveJobs, hasActiveJob ? 2500 : 12000);
    return () => clearInterval(interval);
  }, [jobs]);

  // Find the primary job to display in the sticky banner
  // Priority: 1. Processing/Queued/Uploading, 2. Newly Completed (ready for review), 3. Failed/Cancelled
  const activeJob = jobs.find(j => j.status === 'processing' || j.status === 'queued' || j.status === 'uploading')
    || jobs.find(j => j.status === 'completed')
    || jobs[0];

  if (!activeJob) return null;

  const total = activeJob.totalPhotos || activeJob.photos?.length || 0;
  const processed = activeJob.processedPhotos || 0;
  const pending = Math.max(0, total - processed);
  const percent = activeJob.progressPercent || Math.min(100, total > 0 ? Math.round((processed / total) * 100) : 0);
  const isCompleted = activeJob.status === 'completed';
  const isCancelled = activeJob.status === 'cancelled';
  const isFailed = activeJob.status === 'failed';
  const isBusy = activeJob.status === 'processing' || activeJob.status === 'queued' || activeJob.status === 'uploading';

  // Format estimated time remaining
  const formatTimeRemaining = (seconds?: number) => {
    if (typeof seconds !== 'number' || seconds <= 0) return null;
    if (seconds < 60) return `~${seconds}s remaining`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `~${mins}m ${secs > 0 ? `${secs}s` : ''} remaining`;
  };

  const handleCancelJob = async (jobId: string) => {
    setCancellingId(jobId);
    try {
      const res = await fetch(`/api/catalog/jobs/${jobId}/cancel`, { method: 'POST' });
      if (res.ok) {
        await fetchActiveJobs();
        setConfirmCancelId(null);
      }
    } catch (err) {
      console.error('Error cancelling job:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const handleDismissJob = async (jobId: string) => {
    setDismissingId(jobId);
    try {
      const res = await fetch(`/api/catalog/jobs/${jobId}/dismiss`, { method: 'POST' });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== jobId));
      }
    } catch (err) {
      console.error('Error dismissing job:', err);
    } finally {
      setDismissingId(null);
    }
  };

  const handleOpenReview = async (job: CatalogBatchJob) => {
    // If products array is empty on the summary item, fetch the full job
    if (!job.products || job.products.length === 0) {
      try {
        const res = await fetch(`/api/catalog/jobs/${job.id}`);
        const data = await res.json();
        if (data.success && data.job) {
          onOpenJobReview(data.job);
          return;
        }
      } catch (err) {
        console.error('Error loading full job details for review:', err);
      }
    }
    onOpenJobReview(job);
  };

  return (
    <div className="sticky top-0 z-40 mb-6 w-full animate-in slide-in-from-top-4 duration-300">
      <div className="bg-zinc-950 text-white rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden ring-1 ring-white/10">
        
        {/* Main Bar */}
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Status Icon & Details */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isCompleted 
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                : isCancelled
                ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                : isFailed
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
            }`}>
              {isBusy && <Loader2 className="w-5 h-5 animate-spin text-orange-400" />}
              {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isCancelled && <StopCircle className="w-5 h-5 text-zinc-400" />}
              {isFailed && <AlertCircle className="w-5 h-5 text-rose-400" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-black uppercase tracking-wider ${
                  isCompleted 
                    ? 'text-emerald-400' 
                    : isCancelled
                    ? 'text-zinc-400'
                    : isFailed
                    ? 'text-rose-400'
                    : 'text-orange-400'
                }`}>
                  {isCompleted
                    ? 'AI Sorting Complete'
                    : isCancelled
                    ? 'Processing Cancelled'
                    : isFailed
                    ? 'Processing Failed'
                    : activeJob.status === 'uploading'
                    ? 'Receiving Photo Chunks'
                    : 'AI Asynchronous Footwear Sorting'}
                </span>
                <span className="text-zinc-600 text-xs">•</span>
                <span className="text-xs text-zinc-400 font-medium">
                  Store: <strong className="text-zinc-200">{activeJob.sellerName || 'Nairobi Hub'}</strong>
                </span>
                {activeJob.estimatedSecondsRemaining && activeJob.estimatedSecondsRemaining > 0 && isBusy && (
                  <>
                    <span className="text-zinc-600 text-xs">•</span>
                    <span className="inline-flex items-center gap-1 text-xs text-amber-300 font-mono tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTimeRemaining(activeJob.estimatedSecondsRemaining)}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <h4 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                  <span>{activeJob.statusMessage || 'Processing batch in background...'}</span>
                </h4>
              </div>
            </div>
          </div>

          {/* Center / Metrics Block: Processed vs Pending with Tabular Figures */}
          <div className="flex items-center gap-4 sm:gap-6 bg-zinc-900/80 px-4 py-2.5 rounded-xl border border-zinc-800/80 shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Processed</span>
              <span className="text-base sm:text-lg font-black font-mono tabular-nums text-white">
                {processed} <span className="text-xs text-zinc-500 font-normal">/ {total}</span>
              </span>
            </div>

            <div className="h-8 w-px bg-zinc-800" />

            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Pending</span>
              <span className={`text-base sm:text-lg font-black font-mono tabular-nums ${pending > 0 && isBusy ? 'text-amber-400' : 'text-zinc-500'}`}>
                {pending}
              </span>
            </div>

            <div className="h-8 w-px bg-zinc-800" />

            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Completion</span>
              <span className="text-base sm:text-lg font-black font-mono tabular-nums text-orange-400">
                {percent}%
              </span>
            </div>
          </div>

          {/* Right: Actions (Review, Logs, Cancel/Dismiss) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            {/* Review Button */}
            {(isCompleted || (activeJob.products && activeJob.products.length > 0)) && (
              <button
                onClick={() => handleOpenReview(activeJob)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Review {activeJob.productsCount || activeJob.products?.length || 0} Shoes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Toggle Logs Drawer */}
            <button
              onClick={() => setIsLogsOpen(!isLogsOpen)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                isLogsOpen 
                  ? 'bg-zinc-800 text-zinc-200 border-zinc-600' 
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
              }`}
              title="Inspect step-by-step AI recognition logs"
            >
              <Terminal className="w-3.5 h-3.5 text-orange-400" />
              <span>Logs</span>
              {activeJob.logs && activeJob.logs.length > 0 && (
                <span className="bg-zinc-800 text-zinc-300 font-mono text-[10px] px-1.5 py-0.5 rounded-md">
                  {activeJob.logs.length}
                </span>
              )}
              {isLogsOpen ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            {/* Cancel or Dismiss Button */}
            {isBusy ? (
              confirmCancelId === activeJob.id ? (
                <div className="flex items-center gap-1.5 bg-rose-950/40 p-1 rounded-xl border border-rose-800/60">
                  <span className="text-[11px] text-rose-300 font-bold px-1.5">Cancel job?</span>
                  <button
                    onClick={() => handleCancelJob(activeJob.id)}
                    disabled={cancellingId === activeJob.id}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-black transition-colors"
                  >
                    {cancellingId === activeJob.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Stop'}
                  </button>
                  <button
                    onClick={() => setConfirmCancelId(null)}
                    className="text-zinc-400 hover:text-white px-2 py-1.5 text-xs font-semibold"
                  >
                    Back
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmCancelId(activeJob.id)}
                  className="flex items-center gap-1.5 bg-zinc-900 hover:bg-rose-950/30 hover:border-rose-900/50 hover:text-rose-400 text-zinc-400 border border-zinc-800 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                  title="Pause or stop processing remaining queue"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  <span>Pause/Cancel</span>
                </button>
              )
            ) : (
              <button
                onClick={() => handleDismissJob(activeJob.id)}
                disabled={dismissingId === activeJob.id}
                className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                title="Dismiss banner"
              >
                {dismissingId === activeJob.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="relative w-full h-1.5 bg-zinc-900 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${
              isCompleted
                ? 'bg-emerald-500'
                : isCancelled
                ? 'bg-zinc-600'
                : isFailed
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Collapsible Live Activity Logs Drawer */}
        {isLogsOpen && (
          <div className="border-t border-zinc-800/80 bg-zinc-900/90 p-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Live Asynchronous Activity Log ({activeJob.logs?.length || 0} events)
                </span>
              </div>
              <button
                onClick={fetchActiveJobs}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 font-medium"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar font-mono text-xs text-zinc-300 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
              {(!activeJob.logs || activeJob.logs.length === 0) ? (
                <div className="text-zinc-500 py-3 text-center">
                  No log entries recorded yet. AI background worker will post updates here as each shoe is inspected.
                </div>
              ) : (
                activeJob.logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="text-zinc-500 shrink-0 text-[11px] tabular-nums select-none">
                      [{log.timestamp}]
                    </span>
                    <span className={`flex-1 ${
                      log.type === 'success' 
                        ? 'text-emerald-400' 
                        : log.type === 'warn'
                        ? 'text-amber-400'
                        : log.type === 'gemini'
                        ? 'text-orange-300'
                        : 'text-zinc-300'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
