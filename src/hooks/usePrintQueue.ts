import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export type JobStatus = 'queued' | 'running' | 'done' | 'error';

export interface PrintJob {
  id: string;
  label: string;
  status: JobStatus;
  error?: string;
}

type JobFn = () => Promise<void>;

interface QueuedJob {
  id: string;
  label: string;
  fn: JobFn;
}

let jobCounter = 0;
function nextId() {
  return `job_${++jobCounter}_${Date.now()}`;
}

export function usePrintQueue() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Internal queue — not state, so mutations don't cause re-renders
  const queue = useRef<QueuedJob[]>([]);
  const processing = useRef(false);
  // Pause queue while app is backgrounded
  const paused = useRef(false);

  // ── AppState: pause when backgrounded, resume when foregrounded ────────────
  const appState = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') {
        paused.current = false;
        // Kick the processor in case jobs were waiting
        processNext();
      } else if (next.match(/inactive|background/)) {
        paused.current = true;
      }
      appState.current = next;
    });
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update a single job's status in state ─────────────────────────────────
  function updateJob(id: string, patch: Partial<PrintJob>) {
    setJobs(prev => prev.map(j => (j.id === id ? { ...j, ...patch } : j)));
  }

  // ── Core processor — runs one job at a time ────────────────────────────────
  const processNext = useCallback(async () => {
    if (processing.current || paused.current) return;
    const next = queue.current.shift();
    if (!next) {
      processing.current = false;
      setIsProcessing(false);
      return;
    }

    processing.current = true;
    setIsProcessing(true);
    updateJob(next.id, { status: 'running' });

    try {
      await next.fn();
      updateJob(next.id, { status: 'done' });
    } catch (e: any) {
      const msg: string = e?.message ?? 'Unknown error';
      updateJob(next.id, { status: 'error', error: friendlyError(msg) });
    } finally {
      processing.current = false;
      // Process next job after a short yield so state can flush
      setTimeout(processNext, 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Public: enqueue a job ──────────────────────────────────────────────────
  const enqueue = useCallback(
    (label: string, fn: JobFn): string => {
      const id = nextId();
      queue.current.push({ id, label, fn });
      setJobs(prev => [...prev, { id, label, status: 'queued' }]);
      processNext();
      return id;
    },
    [processNext],
  );

  // ── Public: clear completed/errored jobs from the visible list ─────────────
  const clearHistory = useCallback(() => {
    setJobs(prev => prev.filter(j => j.status === 'queued' || j.status === 'running'));
  }, []);

  // ── Public: cancel all pending (queued, not yet running) jobs ──────────────
  const cancelPending = useCallback(() => {
    const runningIds = new Set(
      jobs.filter(j => j.status === 'running').map(j => j.id),
    );
    queue.current = queue.current.filter(q => runningIds.has(q.id));
    setJobs(prev =>
      prev.map(j =>
        j.status === 'queued' ? { ...j, status: 'error', error: 'Cancelled' } : j,
      ),
    );
  }, [jobs]);

  return { jobs, isProcessing, enqueue, clearHistory, cancelPending };
}

// ── Map raw Java/SDK error messages to user-friendly strings ─────────────────
function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('socket closed') || m.includes('broken pipe')) {
    return 'Printer disconnected mid-print. Reconnect and try again.';
  }
  if (m.includes('service discovery failed')) {
    return 'Printer is unreachable or turned off.';
  }
  if (m.includes('device or resource busy') || m.includes('already connected')) {
    return 'Printer is connected to another device.';
  }
  if (m.includes('printer not connected') || m.includes('null')) {
    return 'No printer connected. Go to Setup and connect first.';
  }
  if (m.includes('could not decode') || m.includes('failed to decode')) {
    return 'File could not be read. Ensure it is a valid image.';
  }
  if (m.includes('permission')) {
    return 'Bluetooth permission denied. Check app permissions.';
  }
  return msg;
}
