"use client";

import { create } from "zustand";

const ROLLING_WINDOW = 50;

interface MetricsState {
  latencies: number[];
  messageCount: number;
  connectedAt: number | null;
  lastQuoteAt: number | null;
  streamStartedAt: number | null;

  // Actions
  recordLatency: (ms: number) => void;
  recordMessage: () => void;
  setConnectedAt: (ts: number | null) => void;
  setStreamStartedAt: (ts: number | null) => void;
  reset: () => void;

  // Derived (computed in component)
}

export const useMetricsStore = create<MetricsState>((set) => ({
  latencies: [],
  messageCount: 0,
  connectedAt: null,
  lastQuoteAt: null,
  streamStartedAt: null,

  recordLatency: (ms: number) =>
    set((state) => ({
      latencies:
        state.latencies.length >= ROLLING_WINDOW
          ? [...state.latencies.slice(1), ms]
          : [...state.latencies, ms],
    })),

  recordMessage: () =>
    set((state) => ({
      messageCount: state.messageCount + 1,
      lastQuoteAt: Date.now(),
    })),

  setConnectedAt: (ts) => set({ connectedAt: ts }),

  setStreamStartedAt: (ts) =>
    set({
      streamStartedAt: ts,
      ...(ts === null ? { messageCount: 0, latencies: [], lastQuoteAt: null } : {}),
    }),

  reset: () =>
    set({
      latencies: [],
      messageCount: 0,
      connectedAt: null,
      lastQuoteAt: null,
      streamStartedAt: null,
    }),
}));

export function computeMetrics(state: MetricsState) {
  const { latencies, messageCount, connectedAt, lastQuoteAt } = state;

  const avg =
    latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const min = latencies.length > 0 ? Math.min(...latencies) : 0;
  const max = latencies.length > 0 ? Math.max(...latencies) : 0;

  const uptimeMs = connectedAt ? Date.now() - connectedAt : 0;
  const freshnessMs = lastQuoteAt ? Date.now() - lastQuoteAt : 0;

  return { avg, min, max, messageCount, uptimeMs, freshnessMs };
}
