"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inspectMessagePack } from "@/lib/titan/msgpack-inspector";
import { PROTOCOL_METHODS } from "@/lib/titan/protocol-methods";
import { Binary } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  map: "text-yellow-400",
  string: "text-green-400",
  number: "text-blue-400",
  binary: "text-purple-400",
  bool: "text-orange-400",
  unknown: "text-gray-400",
};

export function WireFormatViewer() {
  const [method, setMethod] = useState("GetInfo");

  const selectedMethod = PROTOCOL_METHODS.find((m) => m.name === method);
  const params = selectedMethod?.template;

  const inspection = useMemo(
    () => inspectMessagePack(method, Object.keys(params || {}).length > 0 ? params : undefined),
    [method, params]
  );

  // Generate SDK-style code for comparison
  const sdkCode = useMemo(() => {
    switch (method) {
      case "GetInfo":
        return `// SDK (TypeScript)
const info = await client.getInfo();

// Under the hood, the SDK:
// 1. Creates: { id: N, data: { "GetInfo": {} } }
// 2. Encodes with MessagePack
// 3. Compresses (zstd/brotli/gzip)
// 4. Sends via WebSocket`;
      case "GetVenues":
        return `// SDK (TypeScript)
const venues = await client.getVenues();

// Wire: { id: N, data: { "GetVenues": {} } }`;
      case "ListProviders":
        return `// SDK (TypeScript)
const providers = await client.listProviders();

// Wire: { id: N, data: { "ListProviders": {} } }`;
      case "NewSwapQuoteStream":
        return `// SDK (TypeScript)
const { response, stream } = await client.newSwapQuoteStream({
  swap: { inputMint, outputMint, amount, ... },
  transaction: { userPublicKey },
  update: { intervalMs, num_quotes },
});

// Wire: { id: N, data: { "NewSwapQuoteStream": { swap: {...}, ... } } }
// Response includes stream info for routing StreamData messages`;
      case "StopStream":
        return `// SDK (TypeScript)
await client.stopStream(streamId);

// Wire: { id: N, data: { "StopStream": { id: streamId } } }`;
      default:
        return `// SDK method: ${method}`;
    }
  }, [method]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Binary className="h-5 w-5" />
          <div>
            <CardTitle className="text-lg">Wire Format</CardTitle>
            <CardDescription className="text-xs">
              SDK code vs MessagePack wire bytes
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROTOCOL_METHODS.map((m) => (
              <SelectItem key={m.name} value={m.name}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-1 gap-4">
          {/* SDK Code */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">SDK Code</Badge>
            </div>
            <pre className="p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto">
              {sdkCode}
            </pre>
          </div>

          {/* Wire Format */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Wire Format</Badge>
              <span className="text-xs text-muted-foreground">
                {inspection.totalBytes} bytes (MessagePack)
              </span>
            </div>

            {/* Hex dump */}
            <div className="p-3 rounded-lg bg-muted font-mono text-xs overflow-x-auto">
              <div className="break-all leading-relaxed">
                {inspection.hex}
              </div>
            </div>

            {/* Byte annotations */}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {inspection.annotations.map((ann, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-mono">
                  <span className="text-muted-foreground w-8 shrink-0">
                    {ann.offset.toString().padStart(3, " ")}:
                  </span>
                  <span className={`shrink-0 ${TYPE_COLORS[ann.type] || "text-gray-400"}`}>
                    {ann.hex}
                  </span>
                  <span className="text-muted-foreground">
                    {ann.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Protocol explanation */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs space-y-1">
          <div className="font-semibold">Protocol Flow</div>
          <div className="text-muted-foreground">
            SDK Call → MessagePack Encode → Compress ({`zstd|brotli|gzip`}) → WebSocket Send → Decompress → MessagePack Decode → Response
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
