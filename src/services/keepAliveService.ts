import { supabase } from '@/integrations/supabase/client';

export interface KeepAliveStats {
  lastPingTime: string | null;
  lastPingStatus: 'success' | 'error' | 'idle';
  latencyMs: number | null;
  errorMessage?: string;
}

const STORAGE_KEY_TIME = 'supabase_keepalive_last_time';
const STORAGE_KEY_STATUS = 'supabase_keepalive_last_status';
const STORAGE_KEY_LATENCY = 'supabase_keepalive_last_latency';

/**
 * Triggers a real, lightweight query to Supabase backend to keep the database active
 * and prevent Supabase free tier inactivity pause (7-day rule).
 */
export const sendKeepAlivePing = async (): Promise<KeepAliveStats> => {
  const startTime = performance.now();
  try {
    // Lightweight query fetching 1 record from news or checking server time
    const { error } = await supabase.from('news').select('id').limit(1);
    const latencyMs = Math.round(performance.now() - startTime);

    if (error) {
      throw error;
    }

    const nowIso = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_TIME, nowIso);
    localStorage.setItem(STORAGE_KEY_STATUS, 'success');
    localStorage.setItem(STORAGE_KEY_LATENCY, String(latencyMs));

    return {
      lastPingTime: nowIso,
      lastPingStatus: 'success',
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMsg = err?.message || 'Failed to ping Supabase backend';
    
    localStorage.setItem(STORAGE_KEY_STATUS, 'error');
    return {
      lastPingTime: localStorage.getItem(STORAGE_KEY_TIME),
      lastPingStatus: 'error',
      latencyMs,
      errorMessage: errorMsg,
    };
  }
};

/**
 * Returns the recorded keep alive stats from localStorage
 */
export const getKeepAliveStats = (): KeepAliveStats => {
  return {
    lastPingTime: localStorage.getItem(STORAGE_KEY_TIME),
    lastPingStatus: (localStorage.getItem(STORAGE_KEY_STATUS) as any) || 'idle',
    latencyMs: localStorage.getItem(STORAGE_KEY_LATENCY) ? Number(localStorage.getItem(STORAGE_KEY_LATENCY)) : null,
  };
};

/**
 * Automatically initializes in-app ping if more than 24 hours have passed since last ping
 */
export const initAutoKeepAlive = () => {
  try {
    const lastTimeStr = localStorage.getItem(STORAGE_KEY_TIME);
    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    if (!lastTimeStr || now - new Date(lastTimeStr).getTime() > ONE_DAY_MS) {
      // Fire quietly in the background without blocking render
      setTimeout(() => {
        sendKeepAlivePing().catch((e) => console.debug('Auto keep-alive ping note:', e));
      }, 3000);
    }
  } catch {
    // ignore localStorage errors in private browsing
  }
};
