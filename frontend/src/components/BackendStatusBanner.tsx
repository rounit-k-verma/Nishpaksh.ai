"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { checkBackendHealth } from "@/lib/api";

const DEFAULT_POLL_MS = 15000;
const MIN_POLL_MS = 2000;

function resolvePollMs() {
  const raw = process.env.NEXT_PUBLIC_HEALTH_POLL_MS;
  if (!raw) return DEFAULT_POLL_MS;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return DEFAULT_POLL_MS;
  return Math.max(MIN_POLL_MS, parsed);
}

export function BackendStatusBanner() {
  const [connected, setConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const [secondsSinceCheck, setSecondsSinceCheck] = useState(0);
  const pollMs = useMemo(resolvePollMs, []);

  const runCheck = useCallback(async (showRefreshAnimation = false) => {
    if (showRefreshAnimation) setIsRefreshing(true);
    try {
      const ok = await checkBackendHealth();
      setConnected(ok);
      setIsChecking(false);
      setLastCheckedAt(Date.now());
    } finally {
      if (showRefreshAnimation) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    runCheck();
    const intervalId = window.setInterval(() => {
      runCheck();
    }, pollMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [pollMs, runCheck]);

  useEffect(() => {
    if (!lastCheckedAt) return;
    const timerId = window.setInterval(() => {
      const next = Math.max(0, Math.floor((Date.now() - lastCheckedAt) / 1000));
      setSecondsSinceCheck(next);
    }, 1000);
    return () => {
      window.clearInterval(timerId);
    };
  }, [lastCheckedAt]);

  const statusClass = isChecking
    ? "border-slate-200 bg-white text-slate-500"
    : connected
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-100"
      : "border-rose-200 bg-rose-50 text-rose-700 shadow-rose-100";

  const dotClass = isChecking
    ? "bg-slate-400"
    : connected
      ? "bg-emerald-500"
      : "bg-rose-500";

  const label = isChecking ? "Checking backend..." : connected ? "Backend connected" : "Backend disconnected";

  return (
    <div
      className={`group relative inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm transition-all duration-300 ease-out ${statusClass}`}
      aria-live="polite"
    >
      <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${dotClass}`} />
      <span>{label}</span>
      <button
        type="button"
        onClick={() => runCheck(true)}
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-current/70 transition hover:bg-black/5 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        aria-label="Retry backend connection check"
        title="Retry backend connection check"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : "transition-transform duration-300 hover:rotate-45"}`}
        >
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
      </button>
      <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-[11px] font-medium text-slate-600 opacity-0 shadow-sm backdrop-blur transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
        {lastCheckedAt ? `Last checked ${secondsSinceCheck} seconds ago` : "Last checked just now"}
      </div>
    </div>
  );
}
