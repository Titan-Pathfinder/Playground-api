"use client";

import { create } from "zustand";

interface ProviderStats {
  name: string;
  winCount: number;
  totalQuotes: number;
  bestOutAmount: number;
  worstOutAmount: number;
  avgOutAmount: number;
  totalOutAmount: number;
  lastOutAmount: number;
  avgSteps: number;
  totalSteps: number;
}

interface ComparisonState {
  providers: Record<string, ProviderStats>;
  updateCount: number;
  recordUpdate: (quotes: Record<string, any>) => void;
  reset: () => void;
}

export const useComparisonStore = create<ComparisonState>((set) => ({
  providers: {},
  updateCount: 0,

  recordUpdate: (quotes: Record<string, any>) =>
    set((state) => {
      const providers = { ...state.providers };
      const entries = Object.entries(quotes);

      // Determine winner (highest outAmount)
      let bestProvider = "";
      let bestAmount = -1;

      for (const [name, quote] of entries) {
        const outAmount =
          typeof quote.outAmount === "bigint"
            ? Number(quote.outAmount)
            : typeof quote.outAmount === "string"
            ? parseFloat(quote.outAmount)
            : quote.outAmount || 0;

        if (outAmount > bestAmount) {
          bestAmount = outAmount;
          bestProvider = name;
        }

        const existing = providers[name];
        const steps = quote.steps?.length || 0;

        if (existing) {
          const totalQuotes = existing.totalQuotes + 1;
          const totalOut = existing.totalOutAmount + outAmount;
          const totalSteps = existing.totalSteps + steps;
          providers[name] = {
            ...existing,
            totalQuotes,
            bestOutAmount: Math.max(existing.bestOutAmount, outAmount),
            worstOutAmount: Math.min(existing.worstOutAmount, outAmount),
            avgOutAmount: totalOut / totalQuotes,
            totalOutAmount: totalOut,
            lastOutAmount: outAmount,
            avgSteps: totalSteps / totalQuotes,
            totalSteps,
          };
        } else {
          providers[name] = {
            name,
            winCount: 0,
            totalQuotes: 1,
            bestOutAmount: outAmount,
            worstOutAmount: outAmount,
            avgOutAmount: outAmount,
            totalOutAmount: outAmount,
            lastOutAmount: outAmount,
            avgSteps: steps,
            totalSteps: steps,
          };
        }
      }

      // Increment win count for the winner
      if (bestProvider && providers[bestProvider]) {
        providers[bestProvider] = {
          ...providers[bestProvider],
          winCount: providers[bestProvider].winCount + 1,
        };
      }

      return { providers, updateCount: state.updateCount + 1 };
    }),

  reset: () => set({ providers: {}, updateCount: 0 }),
}));
