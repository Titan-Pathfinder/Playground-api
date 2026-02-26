"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ConnectionPanel } from "./components/connection-panel";
import { SwapForm, type SwapFormParams, type SwapFormInitialParams } from "./components/swap-form";
import { StreamControls } from "./components/stream-controls";
import { QuotesTable } from "./components/quotes-table";
import { RouteDetails } from "./components/route-details";
import { TxInspector } from "./components/tx-inspector";
import { RawLogPanel } from "./components/raw-log-panel";
import { MetricsPanel } from "./components/metrics-panel";
import { VenuesExplorer } from "./components/venues-explorer";
import { QuoteComparison } from "./components/quote-comparison";
import { TxSimulator } from "./components/tx-simulator";
import { MultiStreamMonitor } from "./components/multi-stream-monitor";
import { RawPlayground } from "./components/raw-playground";
import { useTitanConnection } from "@/hooks/use-titan-connection";
import { useSwapStream } from "@/hooks/use-swap-stream";
import { buildSwapQuoteRequest } from "@/lib/titan/request-builder";
import { encodeConfigToUrl, decodeConfigFromUrl } from "@/lib/url-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy } from "lucide-react";

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const { connectionState, serverInfo, client, clientMode, setClientMode, connect, disconnect } = useTitanConnection();
  const { streamState, startStream, stopStream, triggerSDKBug } = useSwapStream(client);

  // Top-level tab
  const [topTab, setTopTab] = useState("playground");

  // Decode URL params for initial form state
  const initialParams = useMemo<SwapFormInitialParams | undefined>(() => {
    const config = decodeConfigFromUrl(searchParams);
    if (!config) return undefined;
    return config as SwapFormInitialParams;
  }, [searchParams]);

  const [swapParams, setSwapParams] = useState<SwapFormParams>({
    inputMint: "So11111111111111111111111111111111111111112",
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    amount: 1000000000,
    userPublicKey: "GjphYQvBcDacc51fJFwk5Hf4X9JwN7SXpqw8vXfJk9gL",
    slippageBps: 50,
    onlyDirectRoutes: false,
    intervalMs: 1000,
    numQuotes: 3,
  });

  const [selectedRoute, setSelectedRoute] = useState<{ route: any; index: number } | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [shareCopied, setShareCopied] = useState(false);

  // Sync URL on form changes (replaceState, no navigation)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = encodeConfigToUrl({
      inputMint: swapParams.inputMint,
      outputMint: swapParams.outputMint,
      amount: String(swapParams.amount),
      userPublicKey: swapParams.userPublicKey,
      slippageBps: String(swapParams.slippageBps),
      onlyDirectRoutes: swapParams.onlyDirectRoutes,
      intervalMs: String(swapParams.intervalMs),
      numQuotes: String(swapParams.numQuotes),
      dexFilter: swapParams.dexes?.join(","),
    });
    setShareUrl(url);
  }, [swapParams]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {}
  };

  const handleStartStream = () => {
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
    setSelectedRoute(null);
    setValidationError("");
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-lg font-bold text-white">T</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Titan Swap API</h1>
                <p className="text-xs text-muted-foreground">Real-time Quote Streaming</p>
              </div>
            </div>

            {/* Top-level tabs */}
            <nav className="hidden md:flex items-center gap-1 ml-6">
              {[
                { key: "playground", label: "Playground" },
                { key: "multi-stream", label: "Multi-Stream" },
                { key: "api-explorer", label: "API Explorer" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTopTab(tab.key)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    topTab === tab.key
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Button
              size="sm"
              variant="outline"
              onClick={handleShare}
              title="Copy shareable link"
            >
              {shareCopied ? (
                <><Check className="h-3 w-3 mr-1" />Copied</>
              ) : (
                <><Share2 className="h-3 w-3 mr-1" />Share</>
              )}
            </Button>
            <a href="https://titan-exchange.gitbook.io/titan" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Docs
            </a>
          </div>
        </div>

        {/* Mobile tab selector */}
        <div className="md:hidden border-t border-border/40 px-6 py-2 flex gap-2 overflow-x-auto">
          {[
            { key: "playground", label: "Playground" },
            { key: "multi-stream", label: "Multi-Stream" },
            { key: "api-explorer", label: "API Explorer" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTopTab(tab.key)}
              className={`px-3 py-1 text-xs rounded-md whitespace-nowrap ${
                topTab === tab.key
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        {/* ===================== PLAYGROUND TAB ===================== */}
        {topTab === "playground" && (
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
                  setValidationError("");
                }}
                disabled={!isConnected || streamState.isActive}
                initialParams={initialParams}
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
              <MetricsPanel />
              <QuotesTable
                routes={streamState.routes}
                sequenceNumber={streamState.sequenceNumber}
                contextSlot={streamState.contextSlot}
                inputMint={swapParams.inputMint}
                outputMint={swapParams.outputMint}
                onSelectRoute={handleSelectRoute}
              />
              {selectedRoute?.route && (
                <RouteDetails
                  route={selectedRoute.route}
                  routeIndex={selectedRoute.index}
                />
              )}
            </div>

            {/* Right Column - Tools (Grouped into 3 tabs) */}
            <div className="space-y-6">
              <Tabs defaultValue="inspect" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="inspect">Inspect</TabsTrigger>
                  <TabsTrigger value="debug">Debug</TabsTrigger>
                  <TabsTrigger value="analyze">Analyze</TabsTrigger>
                </TabsList>

                <TabsContent value="inspect" className="mt-4 space-y-4">
                  <TxInspector route={selectedRoute?.route} />
                  <TxSimulator route={selectedRoute?.route} userPublicKey={swapParams.userPublicKey} />
                </TabsContent>

                <TabsContent value="debug" className="mt-4 space-y-4">
                  <RawLogPanel />
                </TabsContent>

                <TabsContent value="analyze" className="mt-4 space-y-4">
                  <QuoteComparison />
                  <VenuesExplorer client={client} isConnected={isConnected} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {/* ===================== MULTI-STREAM TAB ===================== */}
        {topTab === "multi-stream" && (
          <MultiStreamMonitor client={client} isConnected={isConnected} />
        )}

        {/* ===================== API EXPLORER TAB ===================== */}
        {topTab === "api-explorer" && (
          <RawPlayground client={client} isConnected={isConnected} />
        )}

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
            {" "}&bull;{" "}
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

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PlaygroundContent />
    </Suspense>
  );
}
