import { collection, addDoc, getDocs, query, where, orderBy, limit, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { SystemLog } from './types';

export type LogCategory = 'cloudinary' | 'firebase' | 'intasend' | 'server' | 'auth' | 'ui' | 'system';
export type LogLevel = 'info' | 'warn' | 'error';

/**
 * Persists a log entry to Firestore `system_logs` collection and notifies backend.
 */
export async function logSystemError(
  category: LogCategory,
  message: string,
  metadata?: any,
  level: LogLevel = 'error'
): Promise<void> {
  const now = new Date();
  const entry: Omit<SystemLog, 'id'> = {
    timestamp: now.toISOString(),
    epochMs: now.getTime(),
    level,
    category,
    source: 'client',
    message: String(message || 'Unknown error').slice(0, 10000),
    metadata: metadata ? sanitizeMetadata(metadata) : null
  };

  try {
    // 1. Persist to Firestore system_logs
    if (db) {
      await addDoc(collection(db, 'system_logs'), entry);
    }
  } catch (firestoreErr) {
    console.warn('[LoggingService] Failed writing log to Firestore:', firestoreErr);
  }

  try {
    // 2. Also stream to backend /api/logs for console aggregator
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message: `[${category.toUpperCase()}] ${entry.message}`,
        metadata: { category, ...entry.metadata }
      })
    }).catch(() => {});
  } catch {
    // ignore fetch issues
  }
}

function sanitizeMetadata(data: any): any {
  try {
    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
        stack: data.stack ? data.stack.slice(0, 3000) : undefined
      };
    }
    // Deep clone safe serialization
    return JSON.parse(JSON.stringify(data, (key, value) => {
      if (typeof value === 'function') return '[Function]';
      if (value instanceof Error) return { message: value.message, name: value.name };
      return value;
    }));
  } catch {
    return { summary: String(data).slice(0, 500) };
  }
}

/**
 * Fetch logs within a specific timeframe and filters from Firestore.
 */
export async function fetchSystemLogs(options?: {
  timeframeHours?: number; // e.g. 1, 24, 168 (7d), 720 (30d)
  startDate?: Date;
  endDate?: Date;
  category?: LogCategory | 'all';
  level?: LogLevel | 'all';
  maxItems?: number;
}): Promise<SystemLog[]> {
  if (!db) return [];

  try {
    const logsRef = collection(db, 'system_logs');
    const constraints: any[] = [];

    // Timeframe calculation
    if (options?.startDate && options?.endDate) {
      constraints.push(where('epochMs', '>=', options.startDate.getTime()));
      constraints.push(where('epochMs', '<=', options.endDate.getTime()));
    } else if (options?.timeframeHours && options.timeframeHours > 0) {
      const cutoff = Date.now() - (options.timeframeHours * 60 * 60 * 1000);
      constraints.push(where('epochMs', '>=', cutoff));
    }

    if (options?.category && options.category !== 'all') {
      constraints.push(where('category', '==', options.category));
    }

    if (options?.level && options.level !== 'all') {
      constraints.push(where('level', '==', options.level));
    }

    // Limit to prevent excessive reads
    constraints.push(limit(options?.maxItems || 300));

    const q = query(logsRef, ...constraints);
    const snap = await getDocs(q);
    
    const results: SystemLog[] = [];
    snap.forEach((d) => {
      const data = d.data();
      results.push({
        id: d.id,
        timestamp: data.timestamp || new Date(data.epochMs || Date.now()).toISOString(),
        epochMs: data.epochMs || (data.timestamp ? new Date(data.timestamp).getTime() : Date.now()),
        level: data.level || 'error',
        category: data.category || 'system',
        source: data.source || 'client',
        message: data.message || '',
        metadata: data.metadata || null
      });
    });

    // Sort newest first
    results.sort((a, b) => b.epochMs - a.epochMs);
    return results;
  } catch (err: any) {
    console.error('[LoggingService] Error fetching system logs from Firestore:', err);
    // If index is required or query fails, fall back to getting recent logs without complex filter
    try {
      const fallbackSnap = await getDocs(query(collection(db, 'system_logs'), limit(150)));
      const fallbackResults: SystemLog[] = [];
      fallbackSnap.forEach((d) => {
        const data = d.data();
        fallbackResults.push({
          id: d.id,
          timestamp: data.timestamp || new Date().toISOString(),
          epochMs: data.epochMs || Date.now(),
          level: data.level || 'error',
          category: data.category || 'system',
          source: data.source || 'client',
          message: data.message || '',
          metadata: data.metadata || null
        });
      });
      fallbackResults.sort((a, b) => b.epochMs - a.epochMs);
      return fallbackResults;
    } catch {
      return [];
    }
  }
}

/**
 * Clear a specific log or purge old logs
 */
export async function deleteSystemLog(logId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'system_logs', logId));
}

/**
 * Initialize global unhandled error interceptor to guarantee all errors are logged
 */
let isListenerAttached = false;
export function initGlobalErrorListeners(): void {
  if (isListenerAttached || typeof window === 'undefined') return;
  isListenerAttached = true;

  window.addEventListener('error', (event) => {
    const rawMsg = event.message || '';
    // Ignore benign resize/browser noise and Vite development HMR WebSocket disconnections
    if (
      rawMsg.includes('ResizeObserver') || 
      rawMsg.includes('Script error') ||
      rawMsg.includes('WebSocket closed without opened') ||
      rawMsg.includes('@vite/client') ||
      rawMsg.includes('vite:ws')
    ) {
      return;
    }

    logSystemError(
      'ui',
      rawMsg || 'Unhandled Client Exception',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || event.error?.message
      },
      'error'
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || 'Unhandled Promise Rejection');
    
    // Ignore harmless Vite HMR reconnects in iframe preview sandbox
    if (
      msg.includes('WebSocket closed without opened') ||
      msg.includes('@vite/client') ||
      msg.includes('vite:ws')
    ) {
      return;
    }

    // Categorize Cloudinary vs Firebase vs IntaSend
    let category: LogCategory = 'ui';
    if (msg.toLowerCase().includes('cloudinary') || msg.toLowerCase().includes('upload')) {
      category = 'cloudinary';
    } else if (msg.toLowerCase().includes('firestore') || msg.toLowerCase().includes('firebase') || msg.toLowerCase().includes('permission')) {
      category = 'firebase';
    } else if (msg.toLowerCase().includes('intasend') || msg.toLowerCase().includes('mpesa') || msg.toLowerCase().includes('payment')) {
      category = 'intasend';
    }

    logSystemError(
      category,
      msg,
      {
        reason: reason?.stack || reason?.message || reason
      },
      'error'
    );
  });
}
