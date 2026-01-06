"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Loader2, CheckCircle2, XCircle, Circle, X } from "lucide-react";
import type { ConnectionState, ClientMode } from "@/lib/titan/native-types";

const WS_ENDPOINTS = [
  { value: "wss://fra.api.titan-sol.tech/api/v1/ws", label: "DEV1 - Frankfurt", group: "Development" },
  { value: "wss://api.epimetheus.infra.titan-sol.tech/api/v1/ws", label: "DEV2 - Epimetheus", group: "Development" },
  { value: "wss://us1.api.demo.titan.exchange/api/v1/ws", label: "US1 - Ohio, USA", group: "Demo" },
  { value: "wss://jp1.api.demo.titan.exchange/api/v1/ws", label: "JP1 - Tokyo, Japan", group: "Demo" },
  { value: "wss://de1.api.demo.titan.exchange/api/v1/ws", label: "DE1 - Frankfurt, Germany", group: "Demo" },
  { value: "custom", label: "Custom WebSocket URL", group: "Custom" },
];

interface ConnectionPanelProps {
  connectionState: ConnectionState;
  serverInfo: any;
  clientMode: ClientMode;
  onClientModeChange: (mode: ClientMode) => void;
  onConnect: (jwt: string, wsUrl: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export function ConnectionPanel({ connectionState, serverInfo, clientMode, onClientModeChange, onConnect, onDisconnect }: ConnectionPanelProps) {
  const [jwt, setJwt] = useState("");
  const [wsUrl, setWsUrl] = useState(WS_ENDPOINTS[0].value);
  const [customWsUrl, setCustomWsUrl] = useState("");
  const [showSecurityWarning, setShowSecurityWarning] = useState(true);

  const handleConnect = async () => {
    const actualWsUrl = wsUrl === "custom" ? customWsUrl : wsUrl;
    await onConnect(jwt, actualWsUrl);
  };

  const handleDisconnect = async () => {
    await onDisconnect();
  };

  const getStatusIcon = () => {
    switch (connectionState.status) {
      case "connected":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "connecting":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionState.status) {
      case "connected":
        return <Badge variant="default" className="bg-green-600">Connected</Badge>;
      case "connecting":
        return <Badge variant="secondary">Connecting...</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Disconnected</Badge>;
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Connection</CardTitle>
            <CardDescription className="text-xs">WebSocket API</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="client-mode">Client Mode</Label>
          <Select value={clientMode} onValueChange={onClientModeChange} disabled={connectionState.status === "connected"}>
            <SelectTrigger id="client-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="native">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-600">Recommended</Badge>
                  <span>Native</span>
                </div>
              </SelectItem>
              <SelectItem value="sdk">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Legacy</Badge>
                  <span>SDK</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {clientMode === "native"
              ? "Direct WebSocket + MessagePack implementation"
              : "Official TypeScript SDK"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jwt">JWT Token</Label>
          <Input
            id="jwt"
            type="password"
            placeholder="Enter your Titan JWT"
            value={jwt}
            onChange={(e) => setJwt(e.target.value)}
            disabled={connectionState.status === "connected"}
          />
          {showSecurityWarning && (
            <div className="relative rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 pr-8 space-y-1">
              <button
                onClick={() => setShowSecurityWarning(false)}
                className="absolute top-2 right-2 text-amber-700 dark:text-amber-500 hover:text-amber-900 dark:hover:text-amber-300 transition-colors"
                aria-label="Dismiss warning"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-500">
                Playground & Starter Code Only
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-600">
                This is for testing and learning purposes. <strong>NEVER expose your API key in production code.</strong> Always hide your API key behind a secure backend proxy.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ws-endpoint">WebSocket Endpoint</Label>
          <Select value={wsUrl} onValueChange={setWsUrl} disabled={connectionState.status === "connected"}>
            <SelectTrigger id="ws-endpoint">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Demo</SelectLabel>
                {WS_ENDPOINTS.filter(e => e.group === "Demo").map((endpoint) => (
                  <SelectItem key={endpoint.value} value={endpoint.value}>
                    {endpoint.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Development</SelectLabel>
                {WS_ENDPOINTS.filter(e => e.group === "Development").map((endpoint) => (
                  <SelectItem key={endpoint.value} value={endpoint.value}>
                    {endpoint.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Custom</SelectLabel>
                {WS_ENDPOINTS.filter(e => e.group === "Custom").map((endpoint) => (
                  <SelectItem key={endpoint.value} value={endpoint.value}>
                    {endpoint.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {wsUrl === "custom" && (
            <div className="pt-2">
              <Input
                id="custom-ws-url"
                type="text"
                placeholder="wss://your-custom-endpoint.com"
                value={customWsUrl}
                onChange={(e) => setCustomWsUrl(e.target.value)}
                disabled={connectionState.status === "connected"}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your custom WebSocket URL
              </p>
            </div>
          )}
        </div>

        {connectionState.error && (
          <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-800 dark:text-red-200">
            {connectionState.error}
          </div>
        )}

        {serverInfo && (
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
              <div className="font-semibold text-sm">Connected</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <div className="text-foreground font-medium">
                  v{serverInfo.protocolVersion.major}.{serverInfo.protocolVersion.minor}.{serverInfo.protocolVersion.patch}
                </div>
                <div>Protocol Version</div>
              </div>
              <div>
                <div className="text-foreground font-medium">{serverInfo.settings.connection.concurrentStreams}</div>
                <div>Max Streams</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleConnect}
            disabled={
              connectionState.status === "connected" ||
              connectionState.status === "connecting" ||
              (wsUrl === "custom" && !customWsUrl)
            }
            className="flex-1"
          >
            {connectionState.status === "connecting" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Connect
          </Button>
          <Button
            onClick={handleDisconnect}
            variant="outline"
            disabled={connectionState.status !== "connected"}
            className="flex-1"
          >
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
