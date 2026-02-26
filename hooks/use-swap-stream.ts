"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { TitanClient, SwapQuoteRequest } from "@/lib/titan/native-types";
import { useLogStore } from "./use-log-store";
import { useMetricsStore } from "./use-metrics-store";
import { useComparisonStore } from "./use-comparison-store";

interface SwapStreamState {
  isActive: boolean;
  streamId: number | null;
  routes: any[];
  sequenceNumber: number;
  contextSlot: number;
  error?: string;
}

export function useSwapStream(client: TitanClient | null) {
  const [streamState, setStreamState] = useState<SwapStreamState>({
    isActive: false,
    streamId: null,
    routes: [],
    sequenceNumber: 0,
    contextSlot: 0,
  });
  const addLog = useLogStore((state) => state.addLog);
  const readerRef = useRef<ReadableStreamDefaultReader<any> | null>(null);
  const lastReadTimeRef = useRef<number>(0);

  const clearLogs = useLogStore((state) => state.clearLogs);
  const metricsStore = useMetricsStore();
  const comparisonStore = useComparisonStore();

  const startStream = useCallback(
    async (request: SwapQuoteRequest) => {
      if (!client) {
        setStreamState((prev) => ({
          ...prev,
          error: "Client not connected",
        }));
        return;
      }

      // Clear any previous errors, reset state, and clear logs for fresh start
      setStreamState({
        isActive: false,
        streamId: null,
        routes: [],
        sequenceNumber: 0,
        contextSlot: 0,
      });
      clearLogs(); // Clear all protocol logs from previous stream

      // Cancel any existing reader before starting new stream
      if (readerRef.current) {
        try {
          await readerRef.current.cancel();
        } catch (e) {
          // Ignore errors from canceling stale reader
        }
        readerRef.current = null;
      }

      try {
        addLog({ type: "request", data: { action: "newSwapQuoteStream", request } });

        // newSwapQuoteStream returns { response, stream }
        const result = await client.newSwapQuoteStream(request);
        const streamId = result.response.id;

        addLog({
          type: "stream_start",
          data: { action: "newSwapQuoteStream", response: result.response },
        });

        setStreamState({
          isActive: true,
          streamId,
          routes: [],
          sequenceNumber: 0,
          contextSlot: 0,
        });

        // Start reading from the stream
        const reader = result.stream.getReader();
        readerRef.current = reader;

        metricsStore.setStreamStartedAt(Date.now());
        lastReadTimeRef.current = Date.now();

        // Process stream data in background
        (async () => {
          try {
            while (true) {
              const readStart = Date.now();
              const { done, value } = await reader.read();
              const readEnd = Date.now();

              if (done) {
                addLog({ type: "stream_end", data: { streamId } });

                // Clean up references when stream ends naturally
                readerRef.current = null;

                setStreamState((prev) => ({
                  ...prev,
                  isActive: false,
                  streamId: null, // Clear streamId so stopStream won't try to stop an ended stream
                }));
                break;
              }

              // value is SwapQuotes - contains quotes object keyed by provider name
              addLog({ type: "stream_data", data: value });

              // Record metrics
              const latencyMs = readEnd - lastReadTimeRef.current;
              if (lastReadTimeRef.current > 0) {
                metricsStore.recordLatency(latencyMs);
              }
              metricsStore.recordMessage();
              lastReadTimeRef.current = readEnd;

              // DEBUG: Check if transaction field exists in any quote
              if (value.quotes && typeof value.quotes === 'object') {
                Object.entries(value.quotes).forEach(([provider, quote]: [string, any]) => {
                  const debugInfo = {
                    provider,
                    hasTransaction: quote.transaction !== undefined,
                    transactionValue: quote.transaction,
                    hasInstructions: quote.instructions !== undefined,
                    instructionsCount: quote.instructions?.length,
                    hasAddressLookupTables: quote.addressLookupTables !== undefined,
                    addressLookupTablesCount: quote.addressLookupTables?.length,
                    allQuoteKeys: Object.keys(quote),
                  };

                  console.log(`[DEBUG] Provider: ${provider}`);
                  console.log(`[DEBUG] Has transaction field: ${quote.transaction !== undefined}`);
                  console.log(`[DEBUG] Transaction value:`, quote.transaction);
                  console.log(`[DEBUG] Has instructions: ${quote.instructions !== undefined} (length: ${quote.instructions?.length})`);
                  console.log(`[DEBUG] Has addressLookupTables: ${quote.addressLookupTables !== undefined} (length: ${quote.addressLookupTables?.length})`);
                  console.log(`[DEBUG] Quote keys:`, Object.keys(quote));

                  // Also add to UI logs
                  addLog({ type: "stream_data", data: { DEBUG_TRANSACTION_CHECK: debugInfo } });
                });
              }

              // Transform quotes object to routes array
              let routes: any[] = [];
              if (value.quotes && typeof value.quotes === 'object') {
                routes = Object.entries(value.quotes).map(([provider, quote]: [string, any]) => ({
                  ...quote,
                  provider,
                  // API doesn't provide priceImpactPct, so we don't set it
                  // Map the fields to match what the UI expects
                  marketInfos: quote.steps?.map((step: any) => {
                    // Calculate LP fee percentage from feeAmount and inAmount
                    // Convert BigInt to Number for calculations
                    const lpFeeAmount = typeof step.feeAmount === 'bigint' ? Number(step.feeAmount) : (step.feeAmount || 0);
                    const inAmount = typeof step.inAmount === 'bigint' ? Number(step.inAmount) : step.inAmount;
                    const lpFeePct = inAmount > 0 ? (lpFeeAmount / inAmount) * 100 : 0;

                    return {
                      id: step.ammKey,
                      label: step.label,
                      inputMint: step.inputMint,
                      outputMint: step.outputMint,
                      notEnoughLiquidity: false,
                      inAmount: step.inAmount,
                      outAmount: step.outAmount,
                      priceImpactPct: 0,
                      lpFee: {
                        amount: lpFeeAmount.toString(),
                        mint: step.feeMint || step.inputMint,
                        pct: lpFeePct
                      },
                      platformFee: quote.platformFee ? {
                        amount: quote.platformFee.amount?.toString() || "0",
                        mint: step.inputMint,
                        pct: quote.platformFee.fee_bps ? quote.platformFee.fee_bps / 100 : 0
                      } : { amount: "0", mint: step.inputMint, pct: 0 },
                    };
                  }) || [],
                  // Add swapInfo for transaction inspector
                  swapInfo: {
                    instructions: quote.instructions,
                    addressLookupTableAddresses: quote.addressLookupTables,
                  },
                }));

                // Sort by outAmount descending (best first)
                routes.sort((a, b) => {
                  // Convert BigInt/string to Number for comparison
                  const aOut = typeof a.outAmount === 'bigint' ? Number(a.outAmount) :
                              (typeof a.outAmount === 'string' ? parseFloat(a.outAmount) : a.outAmount);
                  const bOut = typeof b.outAmount === 'bigint' ? Number(b.outAmount) :
                              (typeof b.outAmount === 'string' ? parseFloat(b.outAmount) : b.outAmount);
                  return bOut - aOut;
                });
              }

              // Record comparison data
              if (value.quotes && typeof value.quotes === 'object') {
                comparisonStore.recordUpdate(value.quotes);
              }

              setStreamState((prev) => ({
                ...prev,
                routes,
                sequenceNumber: prev.sequenceNumber + 1,
                contextSlot: value.contextSlot || prev.contextSlot,
              }));
            }
          } catch (error) {
            if (error instanceof Error && error.message !== "Stream cancelled") {
              const errorMessage = error.message || "Stream read failed";
              addLog({ type: "error", data: { action: "streamRead", error: errorMessage } });
              setStreamState((prev) => ({
                ...prev,
                error: errorMessage,
                isActive: false,
              }));
            }
          }
        })();

      } catch (error) {
        // Handle SDK bug where it tries to close with invalid code 1002
        let errorMessage = error instanceof Error ? error.message : "Stream start failed";
        if (errorMessage.includes("close code must be either 1000") || errorMessage.includes("InvalidAccessError")) {
          errorMessage = "Server rejected the request (protocol error). Check the Logs tab for details.";
        }
        addLog({ type: "error", data: { action: "newSwapQuoteStream", error: errorMessage, errorObj: error } });
        setStreamState((prev) => ({
          ...prev,
          error: errorMessage,
          isActive: false,
        }));
      }
    },
    [client, addLog, clearLogs]
  );

  const stopStream = useCallback(async () => {
    if (!client || streamState.streamId === null) {
      return;
    }

    const currentStreamId = streamState.streamId;

    try {
      addLog({ type: "request", data: { action: "stopStream", streamId: currentStreamId } });

      // Cancel the reader if still active
      if (readerRef.current) {
        try {
          await readerRef.current.cancel();
        } catch (e) {
          // Reader might already be cancelled/closed, that's ok
        }
        readerRef.current = null;
      }

      // Stop the stream on the server
      // This might fail if stream already ended naturally
      try {
        await client.stopStream(currentStreamId);
        addLog({
          type: "response",
          data: { action: "stopStream", streamId: currentStreamId },
        });
      } catch (e) {
        // Stream might already be stopped
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Stream stop failed";
      addLog({ type: "error", data: { action: "stopStream", error: errorMessage } });
    } finally {
      // Always reset state and clear logs, even if there was an error
      setStreamState({
        isActive: false,
        streamId: null,
        routes: [],
        sequenceNumber: 0,
        contextSlot: 0,
      });
      metricsStore.setStreamStartedAt(null);
      clearLogs(); // Clear all protocol logs
    }
  }, [client, streamState.streamId, addLog, clearLogs, metricsStore]);

  // Cleanup on unmount and handle SDK WebSocket close bug
  useEffect(() => {
    // Global error handler to catch SDK bug with WebSocket close code 1002
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      const message = error?.message || "";

      // Check for the SDK WebSocket close bug
      if (
        error?.name === "InvalidAccessError" ||
        message.includes("close code must be either 1000") ||
        message.includes("1002 is neither")
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const message = error?.message || "";

      // Also catch as unhandled promise rejection
      if (
        error?.name === "InvalidAccessError" ||
        message.includes("close code must be either 1000") ||
        message.includes("1002 is neither")
      ) {
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener("error", handleError, true); // Use capture phase
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      if (readerRef.current) {
        readerRef.current.cancel().catch(() => {});
      }
    };
  }, []);

  // DEBUG: Function to trigger the SDK bug with a malformed request
  const triggerSDKBug = useCallback(async () => {
    if (!client) {
      return;
    }

    addLog({ type: "request", data: { action: "triggerBug", note: "Sending malformed request" } });

    try {
      // Send a completely malformed request that will cause decode error
      const badRequest: any = {
        swap: {
          inputMint: "INVALID_NOT_UINT8ARRAY", // Wrong type
          outputMint: "ALSO_INVALID", // Wrong type
          amount: "not_a_number", // Wrong type
        },
        // Missing required transaction field
      };

      await client.newSwapQuoteStream(badRequest);
    } catch (error) {
      addLog({ type: "error", data: { action: "triggerBug", error: error instanceof Error ? error.message : String(error) } });
    }
  }, [client, addLog]);

  return {
    streamState,
    startStream,
    stopStream,
    triggerSDKBug, // DEBUG function
  };
}
