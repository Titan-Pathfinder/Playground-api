"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLogStore, useFilteredLogs } from "@/hooks/use-log-store";
import { Trash2, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import bs58 from "bs58";
import { TOKEN_INFO, rawAmountToUi } from "@/lib/constants/mints";

// ============================================================================
// Helpers
// ============================================================================

/** Try to decode a Uint8Array as a base58 Solana address */
function tryBase58(value: Uint8Array): string {
  try {
    return bs58.encode(value);
  } catch {
    return `<${value.length} bytes>`;
  }
}

/** Resolve a base58 address to a token symbol if known */
function mintLabel(address: string): string {
  const info = TOKEN_INFO[address];
  return info ? info.symbol : address.slice(0, 4) + ".." + address.slice(-4);
}

/** Format a raw token amount using known decimals, or plain number */
function formatAmount(raw: number | bigint | string, mintAddress?: string): string {
  const info = mintAddress ? TOKEN_INFO[mintAddress] : null;
  if (info) {
    const ui = rawAmountToUi(raw, info.decimals);
    return `${ui.toLocaleString("en-US", { maximumFractionDigits: info.decimals })} ${info.symbol}`;
  }
  return typeof raw === "bigint" ? raw.toLocaleString() : Number(raw).toLocaleString();
}

/** Duration in ns -> human string */
function formatNs(ns: number | bigint): string {
  const ms = Number(ns) / 1_000_000;
  return ms < 1000 ? `${ms.toFixed(1)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

// Custom JSON serializer (kept for raw view)
function serializeForDisplay(data: any): string {
  return JSON.stringify(
    data,
    (_key, value) => {
      if (typeof value === "bigint") return value.toString() + "n";
      if (value instanceof Uint8Array) {
        if (value.length === 32) return tryBase58(value);
        return `<${value.length} bytes>`;
      }
      return value;
    },
    2,
  );
}

// ============================================================================
// Human-readable renderers per log type
// ============================================================================

function renderRequest(data: any) {
  const action = data?.action;
  if (action === "newSwapQuoteStream" && data.request) {
    const req = data.request;
    const swap = req.swap;
    const inMint = swap?.inputMint instanceof Uint8Array ? tryBase58(swap.inputMint) : String(swap?.inputMint ?? "?");
    const outMint = swap?.outputMint instanceof Uint8Array ? tryBase58(swap.outputMint) : String(swap?.outputMint ?? "?");
    const amount = swap?.amount;
    return (
      <div className="space-y-1">
        <p className="font-semibold text-foreground">New Swap Quote Stream</p>
        <p>
          <span className="text-muted-foreground">Swap </span>
          <span className="text-green-400">{formatAmount(amount, inMint)}</span>
          <span className="text-muted-foreground"> {"->"} </span>
          <span className="text-blue-400">{mintLabel(outMint)}</span>
        </p>
        <p className="text-muted-foreground">
          Slippage: {swap?.slippageBps ?? "default"} bps
        </p>
        {req.transaction?.userPublicKey && (
          <p className="text-muted-foreground truncate">
            Wallet: {req.transaction.userPublicKey instanceof Uint8Array ? tryBase58(req.transaction.userPublicKey) : String(req.transaction.userPublicKey)}
          </p>
        )}
      </div>
    );
  }
  if (action === "stopStream") {
    return <p>Stop stream <span className="text-yellow-400">#{data.streamId}</span></p>;
  }
  if (action === "triggerBug") {
    return <p className="text-yellow-400">Debug: sending malformed request</p>;
  }
  return <p>{action ?? "Unknown request"}</p>;
}

function renderStreamStart(data: any) {
  const resp = data?.response;
  return (
    <div className="space-y-1">
      <p className="font-semibold text-foreground">Stream opened</p>
      <p>
        Stream <span className="text-blue-400">#{resp?.id}</span>
        {resp?.intervalMs != null && <span className="text-muted-foreground"> | update every {resp.intervalMs}ms</span>}
        {resp?.numQuotes != null && <span className="text-muted-foreground"> | max {resp.numQuotes} quotes</span>}
      </p>
    </div>
  );
}

function renderStreamData(data: any) {
  // Debug transaction check entries
  if (data?.DEBUG_TRANSACTION_CHECK) {
    const d = data.DEBUG_TRANSACTION_CHECK;
    return (
      <p className="text-yellow-400/80">
        [debug] {d.provider}: tx={String(d.hasTransaction)}, ix={d.instructionsCount ?? 0}, ALT={d.addressLookupTablesCount ?? 0}
      </p>
    );
  }

  // Regular SwapQuotes
  const quotes = data?.quotes;
  if (!quotes || typeof quotes !== "object") {
    return <p className="text-muted-foreground">Stream data (no quotes)</p>;
  }

  const inMintAddr = data.inputMint instanceof Uint8Array ? tryBase58(data.inputMint) : String(data.inputMint ?? "");
  const outMintAddr = data.outputMint instanceof Uint8Array ? tryBase58(data.outputMint) : String(data.outputMint ?? "");
  const entries = Object.entries(quotes) as [string, any][];

  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground">
        {entries.length} quote{entries.length !== 1 ? "s" : ""} | slot {data.contextSlot ?? "?"}
      </p>
      {entries.map(([provider, q]) => {
        const outAmt = formatAmount(q.outAmount, outMintAddr);
        const inAmt = formatAmount(q.inAmount, inMintAddr);
        const steps = q.steps?.length ?? 0;
        const time = q.timeTakenNs ? formatNs(q.timeTakenNs) : null;
        return (
          <div key={provider} className="pl-2 border-l-2 border-muted-foreground/30">
            <p>
              <span className="text-purple-400">{provider}</span>
              <span className="text-muted-foreground"> | </span>
              <span className="text-green-400">{inAmt}</span>
              <span className="text-muted-foreground"> {"->"} </span>
              <span className="text-blue-400">{outAmt}</span>
            </p>
            <p className="text-muted-foreground">
              {steps} hop{steps !== 1 ? "s" : ""}
              {time && <> | {time}</>}
              {q.computeUnits != null && <> | ~{q.computeUnits} CU</>}
              {q.slippageBps != null && <> | {q.slippageBps} bps slip</>}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function renderStreamEnd(data: any) {
  return (
    <p>
      Stream <span className="text-orange-400">#{data?.streamId ?? "?"}</span> ended
    </p>
  );
}

function renderError(data: any) {
  return (
    <div className="space-y-1">
      <p className="font-semibold text-red-400">{data?.action ?? "Error"}</p>
      <p className="text-red-300">{data?.error ?? JSON.stringify(data)}</p>
    </div>
  );
}

function renderResponse(data: any) {
  return (
    <div className="space-y-1">
      <p className="font-semibold text-foreground">{data?.action ?? "Response"}</p>
      {data?.streamId != null && <p>Stream <span className="text-blue-400">#{data.streamId}</span></p>}
    </div>
  );
}

function renderHumanReadable(type: string, data: any) {
  switch (type) {
    case "request":
      return renderRequest(data);
    case "stream_start":
      return renderStreamStart(data);
    case "stream_data":
      return renderStreamData(data);
    case "stream_end":
      return renderStreamEnd(data);
    case "error":
      return renderError(data);
    case "response":
      return renderResponse(data);
    default:
      return <p>{serializeForDisplay(data)}</p>;
  }
}

// ============================================================================
// Component
// ============================================================================

export function RawLogPanel() {
  const logs = useFilteredLogs();
  const { clearLogs, filterType, setFilterType } = useLogStore();
  const [copied, setCopied] = useState(false);
  const [expandedRaw, setExpandedRaw] = useState<Set<number>>(new Set());

  const toggleRaw = (idx: number) => {
    setExpandedRaw((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const copyAllLogs = async () => {
    const allLogs = useLogStore.getState().logs;
    const logText = allLogs
      .map(
        (log) =>
          `[${formatTimestamp(log.timestamp)}] ${log.type.toUpperCase()}\n${serializeForDisplay(log.data)}`,
      )
      .join("\n\n---\n\n");
    await navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLogTypeBadge = (type: string) => {
    switch (type) {
      case "request":
        return <Badge variant="default">REQUEST</Badge>;
      case "response":
        return <Badge variant="secondary">RESPONSE</Badge>;
      case "stream_start":
        return <Badge className="bg-blue-600">STREAM START</Badge>;
      case "stream_data":
        return <Badge className="bg-green-600">STREAM DATA</Badge>;
      case "stream_end":
        return <Badge className="bg-orange-600">STREAM END</Badge>;
      case "error":
        return <Badge variant="destructive">ERROR</Badge>;
      default:
        return <Badge variant="outline">{type.toUpperCase()}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + "." + date.getMilliseconds().toString().padStart(3, "0");
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Protocol Log</CardTitle>
            <CardDescription className="text-xs">WebSocket messages and events</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{logs.length} entries</Badge>
            <Button size="sm" variant="outline" onClick={copyAllLogs}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={clearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filterType} onValueChange={(v: any) => setFilterType(v)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="streams">Streams</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value={filterType} className="mt-4">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No log entries yet. Events will appear here as you use the playground.
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-muted/50 font-mono text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getLogTypeBadge(log.type)}
                        <button
                          onClick={() => toggleRaw(idx)}
                          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5 text-[10px]"
                        >
                          {expandedRaw.has(idx) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          raw
                        </button>
                      </div>
                      <span className="text-muted-foreground">{formatTimestamp(log.timestamp)}</span>
                    </div>

                    {/* Human-readable view */}
                    <div className="text-xs leading-relaxed">
                      {renderHumanReadable(log.type, log.data)}
                    </div>

                    {/* Expandable raw JSON */}
                    {expandedRaw.has(idx) && (
                      <pre className="mt-2 pt-2 border-t border-border/50 overflow-x-auto whitespace-pre-wrap break-words text-muted-foreground/70 text-[10px]">
                        {serializeForDisplay(log.data)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
