"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLogStore, useFilteredLogs } from "@/hooks/use-log-store";
import { Trash2, Filter, Copy, Check } from "lucide-react";
import { useState } from "react";

// Custom JSON serializer that handles BigInt and Uint8Array
function serializeForDisplay(data: any): string {
  return JSON.stringify(
    data,
    (key, value) => {
      // Convert BigInt to string with 'n' suffix
      if (typeof value === "bigint") {
        return value.toString() + "n";
      }
      // Convert Uint8Array to readable format
      if (value instanceof Uint8Array) {
        // Try to decode as base58 if it looks like a pubkey (32 bytes)
        if (value.length === 32) {
          try {
            return `<Pubkey: ${value.length} bytes>`;
          } catch {
            return `<Uint8Array: ${value.length} bytes>`;
          }
        }
        return `<Uint8Array: ${value.length} bytes>`;
      }
      return value;
    },
    2
  );
}

export function RawLogPanel() {
  const logs = useFilteredLogs();
  const { clearLogs, filterType, setFilterType } = useLogStore();
  const [copied, setCopied] = useState(false);

  const copyAllLogs = async () => {
    const allLogs = useLogStore.getState().logs;
    const logText = allLogs.map(log =>
      `[${formatTimestamp(log.timestamp)}] ${log.type.toUpperCase()}\n${serializeForDisplay(log.data)}`
    ).join("\n\n---\n\n");
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
            <CardDescription className="text-xs">Raw WebSocket messages and events</CardDescription>
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
                      {getLogTypeBadge(log.type)}
                      <span className="text-muted-foreground">{formatTimestamp(log.timestamp)}</span>
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words">
                      {serializeForDisplay(log.data)}
                    </pre>
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
