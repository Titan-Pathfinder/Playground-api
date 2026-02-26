"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROTOCOL_METHODS, type ApiMethod } from "@/lib/titan/protocol-methods";
import type { TitanClient } from "@/lib/titan/native-types";
import { Send, Loader2, Copy, Check, Trash2 } from "lucide-react";

interface RawPlaygroundProps {
  client: TitanClient | null;
  isConnected: boolean;
}

function serializeForDisplay(data: any): string {
  return JSON.stringify(
    data,
    (_key, value) => {
      if (typeof value === "bigint") return value.toString() + "n";
      if (value instanceof Uint8Array) return `<${value.length} bytes>`;
      return value;
    },
    2
  );
}

export function RawPlayground({ client, isConnected }: RawPlaygroundProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>(PROTOCOL_METHODS[0].name);
  const [requestBody, setRequestBody] = useState<string>("{}");
  const [response, setResponse] = useState<string>("");
  const [streamData, setStreamData] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleMethodChange = (name: string) => {
    setSelectedMethod(name);
    const method = PROTOCOL_METHODS.find((m) => m.name === name);
    if (method) {
      setRequestBody(JSON.stringify(method.template, null, 2));
    }
    setResponse("");
    setStreamData([]);
    setError("");
  };

  const handleSend = useCallback(async () => {
    if (!client || !isConnected) {
      setError("Not connected");
      return;
    }

    setSending(true);
    setResponse("");
    setStreamData([]);
    setError("");

    try {
      let params: any;
      try {
        params = JSON.parse(requestBody);
      } catch {
        setError("Invalid JSON in request body");
        setSending(false);
        return;
      }

      const result = await client.sendRawRequest(selectedMethod, Object.keys(params).length > 0 ? params : undefined);
      setResponse(serializeForDisplay(result));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSending(false);
    }
  }, [client, isConnected, selectedMethod, requestBody]);

  const handleCopyResponse = async () => {
    await navigator.clipboard.writeText(response || error);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const method = PROTOCOL_METHODS.find((m) => m.name === selectedMethod);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">API Explorer</h2>
        <p className="text-sm text-muted-foreground">
          Send raw requests to the Titan API and inspect responses
        </p>
      </div>

      {!isConnected && (
        <div className="text-center text-muted-foreground py-12 border rounded-lg">
          Connect to the API first to use the API Explorer
        </div>
      )}

      {isConnected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Panel */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Request</CardTitle>
              <CardDescription className="text-xs">
                Select a method and edit the request body
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Select value={selectedMethod} onValueChange={handleMethodChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROTOCOL_METHODS.map((m) => (
                      <SelectItem key={m.name} value={m.name}>
                        <div className="flex items-center gap-2">
                          <span>{m.name}</span>
                          {m.hasStream && (
                            <Badge variant="outline" className="text-[10px]">stream</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {method && (
                  <p className="text-xs text-muted-foreground">{method.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Request Body (JSON)</label>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full h-48 p-3 rounded-lg bg-muted font-mono text-xs resize-y border"
                  spellCheck={false}
                />
              </div>

              <Button onClick={handleSend} disabled={sending || !isConnected} className="w-full">
                {sending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Request
              </Button>
            </CardContent>
          </Card>

          {/* Response Panel */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Response</CardTitle>
                  <CardDescription className="text-xs">
                    {error ? "Error" : response ? "Success" : "Waiting for request..."}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  {(response || error) && (
                    <Button size="sm" variant="outline" onClick={handleCopyResponse}>
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  )}
                  {(response || error) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setResponse("");
                        setError("");
                        setStreamData([]);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
                  {error}
                </div>
              )}
              {response && (
                <pre className="p-3 rounded-lg bg-muted overflow-auto text-xs font-mono max-h-96">
                  {response}
                </pre>
              )}
              {!response && !error && (
                <div className="text-center text-muted-foreground py-12 text-sm">
                  Send a request to see the response here
                </div>
              )}

              {streamData.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-semibold">Stream Data ({streamData.length})</h4>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {streamData.map((data, idx) => (
                      <pre key={idx} className="p-2 rounded bg-muted text-[10px] font-mono">
                        {data}
                      </pre>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
