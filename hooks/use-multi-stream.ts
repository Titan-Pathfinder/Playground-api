"use client";

import { useState, useCallback, useRef } from "react";
import type { TitanClient, SwapQuoteRequest } from "@/lib/titan/native-types";
import { buildSwapQuoteRequest } from "@/lib/titan/request-builder";

export interface StreamSlot {
  id: number;
  config: {
    inputMint: string;
    outputMint: string;
    amount: string;
    slippageBps: string;
    intervalMs: string;
  };
  isActive: boolean;
  routes: any[];
  sequenceNumber: number;
  error?: string;
}

const DEFAULT_CONFIG = {
  inputMint: "So11111111111111111111111111111111111111112",
  outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  amount: "1",
  slippageBps: "50",
  intervalMs: "1000",
};

export function useMultiStream(client: TitanClient | null) {
  const [slots, setSlots] = useState<StreamSlot[]>([
    { id: 1, config: { ...DEFAULT_CONFIG }, isActive: false, routes: [], sequenceNumber: 0 },
    { id: 2, config: { ...DEFAULT_CONFIG, inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", outputMint: "So11111111111111111111111111111111111111112" }, isActive: false, routes: [], sequenceNumber: 0 },
  ]);

  const readersRef = useRef<Map<number, ReadableStreamDefaultReader<any>>>(new Map());
  const streamIdsRef = useRef<Map<number, number>>(new Map());

  const updateSlot = useCallback((slotId: number, update: Partial<StreamSlot>) => {
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, ...update } : s)));
  }, []);

  const updateSlotConfig = useCallback((slotId: number, config: Partial<StreamSlot["config"]>) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId ? { ...s, config: { ...s.config, ...config } } : s
      )
    );
  }, []);

  const startSlotStream = useCallback(
    async (slotId: number) => {
      if (!client) return;
      const slot = slots.find((s) => s.id === slotId);
      if (!slot) return;

      updateSlot(slotId, { isActive: false, error: undefined, routes: [], sequenceNumber: 0 });

      try {
        const request = buildSwapQuoteRequest({
          inputMint: slot.config.inputMint,
          outputMint: slot.config.outputMint,
          amount: Math.floor(parseFloat(slot.config.amount || "1") * 1e9),
          userPublicKey: "GjphYQvBcDacc51fJFwk5Hf4X9JwN7SXpqw8vXfJk9gL",
          slippageBps: parseInt(slot.config.slippageBps) || 50,
          intervalMs: parseInt(slot.config.intervalMs) || 1000,
          numQuotes: 100,
        });

        const result = await client.newSwapQuoteStream(request);
        streamIdsRef.current.set(slotId, result.response.id);

        const reader = result.stream.getReader();
        readersRef.current.set(slotId, reader);
        updateSlot(slotId, { isActive: true });

        (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                updateSlot(slotId, { isActive: false });
                break;
              }

              let routes: any[] = [];
              if (value.quotes && typeof value.quotes === "object") {
                routes = Object.entries(value.quotes).map(([provider, quote]: [string, any]) => ({
                  ...quote,
                  provider,
                }));
                routes.sort((a, b) => {
                  const aOut = typeof a.outAmount === "bigint" ? Number(a.outAmount) : Number(a.outAmount);
                  const bOut = typeof b.outAmount === "bigint" ? Number(b.outAmount) : Number(b.outAmount);
                  return bOut - aOut;
                });
              }

              setSlots((prev) =>
                prev.map((s) =>
                  s.id === slotId
                    ? { ...s, routes, sequenceNumber: s.sequenceNumber + 1 }
                    : s
                )
              );
            }
          } catch (error) {
            if (error instanceof Error && error.message !== "Stream cancelled") {
              updateSlot(slotId, {
                error: error.message,
                isActive: false,
              });
            }
          }
        })();
      } catch (error) {
        updateSlot(slotId, {
          error: error instanceof Error ? error.message : "Stream failed",
          isActive: false,
        });
      }
    },
    [client, slots, updateSlot]
  );

  const stopSlotStream = useCallback(
    async (slotId: number) => {
      const reader = readersRef.current.get(slotId);
      if (reader) {
        try { await reader.cancel(); } catch {}
        readersRef.current.delete(slotId);
      }

      const streamId = streamIdsRef.current.get(slotId);
      if (streamId !== undefined && client) {
        try { await client.stopStream(streamId); } catch {}
        streamIdsRef.current.delete(slotId);
      }

      updateSlot(slotId, { isActive: false, routes: [], sequenceNumber: 0 });
    },
    [client, updateSlot]
  );

  const addSlot = useCallback(() => {
    if (slots.length >= 3) return;
    const newId = Math.max(...slots.map((s) => s.id)) + 1;
    setSlots((prev) => [
      ...prev,
      { id: newId, config: { ...DEFAULT_CONFIG }, isActive: false, routes: [], sequenceNumber: 0 },
    ]);
  }, [slots]);

  const removeSlot = useCallback(
    async (slotId: number) => {
      await stopSlotStream(slotId);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    },
    [stopSlotStream]
  );

  return {
    slots,
    updateSlotConfig,
    startSlotStream,
    stopSlotStream,
    addSlot,
    removeSlot,
  };
}
