"use client";

import { useState } from "react";
import { ConnectionPanel } from "./components/connection-panel";
import { SwapForm, type SwapFormParams } from "./components/swap-form";
import { StreamControls } from "./components/stream-controls";
import { QuotesTable } from "./components/quotes-table";
import { RouteDetails } from "./components/route-details";
import { TxInspector } from "./components/tx-inspector";
import { RawLogPanel } from "./components/raw-log-panel";
import { useTitanConnection } from "@/hooks/use-titan-connection";
import { useSwapStream } from "@/hooks/use-swap-stream";
import { buildSwapQuoteRequest } from "@/lib/titan/request-builder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PlaygroundPage() {
  const { connectionState, serverInfo, client, clientMode, setClientMode, connect, disconnect } = useTitanConnection();
  const { streamState, startStream, stopStream, triggerSDKBug } = useSwapStream(client);

  const [swapParams, setSwapParams] = useState<SwapFormParams>({
    inputMint: "So11111111111111111111111111111111111111112",
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    amount: 1000000000,
    userPublicKey: "GjphYQvBcDacc51fJFwk5Hf4X9JwN7SXpqw8vXfJk9gL",
    slippageBps: 50,
    swapMode: "ExactIn",
    onlyDirectRoutes: false,
    intervalMs: 1000,
    numQuotes: 3,
  });

  const [selectedRoute, setSelectedRoute] = useState<{ route: any; index: number } | null>(null);
  const [validationError, setValidationError] = useState<string>("");

  const handleStartStream = () => {
    // Validate token addresses (must be 32-44 characters for base58)
    if (!swapParams.inputMint || swapParams.inputMint.length < 32) {
      setValidationError("Invalid input token address. Please enter a valid Solana token address.");
      return;
    }
    if (!swapParams.outputMint || swapParams.outputMint.length < 32) {
      setValidationError("Invalid output token address. Please enter a valid Solana token address.");
      return;
    }

    setValidationError("");
    try {
      const request = buildSwapQuoteRequest(swapParams);
      startStream(request);
      setSelectedRoute(null);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Failed to build swap request");
    }
  };

  const handleStopStream = () => {
    stopStream();
    setSelectedRoute(null); // Clear selected route
    setValidationError(""); // Clear any validation errors
  };

  const handleSelectRoute = (route: any, index: number) => {
    setSelectedRoute({ route, index });
  };

  const isConnected = connectionState.status === "connected";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-lg font-bold text-white">T</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Titan Swap API</h1>
              <p className="text-xs text-muted-foreground">Real-time Quote Streaming</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="https://titan-exchange.gitbook.io/titan" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Docs
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            <ConnectionPanel
              connectionState={connectionState}
              serverInfo={serverInfo}
              clientMode={clientMode}
              onClientModeChange={setClientMode}
              onConnect={connect}
              onDisconnect={disconnect}
            />
            <SwapForm
              onRequestChange={(params) => {
                setSwapParams(params);
                setValidationError(""); // Clear validation error when config changes
              }}
              disabled={!isConnected || streamState.isActive}
            />
            <StreamControls
              isActive={streamState.isActive}
              onStart={handleStartStream}
              onStop={handleStopStream}
              onTriggerBug={triggerSDKBug}
              disabled={!isConnected}
              error={validationError || streamState.error}
            />
          </div>

          {/* Middle Column - Live Data */}
          <div className="space-y-6">
            <QuotesTable
              routes={streamState.routes}
              sequenceNumber={streamState.sequenceNumber}
              contextSlot={streamState.contextSlot}
              inputMint={swapParams.inputMint}
              outputMint={swapParams.outputMint}
              onSelectRoute={handleSelectRoute}
            />
            <RouteDetails
              route={selectedRoute?.route}
              routeIndex={selectedRoute?.index ?? 0}
            />
          </div>

          {/* Right Column - Details & Tools */}
          <div className="space-y-6">
            <Tabs defaultValue="inspector" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="inspector">Inspector</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="inspector" className="mt-6">
                <TxInspector route={selectedRoute?.route} />
              </TabsContent>

              <TabsContent value="logs" className="mt-6">
                <RawLogPanel />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8">
          <p>
            Built with the{" "}
            <a
              href="https://www.npmjs.com/package/@titanexchange/sdk-ts"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Titan TypeScript SDK
            </a>
            {" "} • {" "}
            <a
              href="https://titan-exchange.gitbook.io/titan/titan-developer-docs/apis/swap-api"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              API Documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
