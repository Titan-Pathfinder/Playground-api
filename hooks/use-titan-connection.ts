"use client";

import { useState, useCallback, useRef } from "react";
import { createTitanClient, isValidJWT } from "@/lib/titan/client";
import { createNativeTitanClient } from "@/lib/titan/native-client";
import type { TitanClient, ConnectionState, ClientMode } from "@/lib/titan/native-types";
import { useLogStore } from "./use-log-store";

export function useTitanConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: "disconnected",
  });
  const [serverInfo, setServerInfo] = useState<any | null>(null);
  const [clientMode, setClientMode] = useState<ClientMode>("native"); // Default to native
  const clientRef = useRef<TitanClient | null>(null);
  const addLog = useLogStore((state) => state.addLog);

  const connect = useCallback(
    async (jwt: string, wsUrl: string = "wss://v1.api.titan.ag") => {
      // Only validate JWT if it's provided
      if (jwt && !isValidJWT(jwt)) {
        setConnectionState({
          status: "error",
          error: "Invalid JWT format",
        });
        return;
      }

      try {
        setConnectionState({ status: "connecting" });
        addLog({ type: "request", data: { action: "connect", wsUrl, clientMode } });

        // Callback when connection is lost unexpectedly
        const handleConnectionLost = () => {
          addLog({ type: "error", data: { action: "connectionLost", error: "WebSocket connection lost" } });
          setConnectionState({
            status: "error",
            error: "Connection lost",
          });
          setServerInfo(null);
          clientRef.current = null;
        };

        // Create client based on selected mode
        let client: TitanClient;
        if (clientMode === "native") {
          addLog({ type: "request", data: { message: "Using Native WebSocket + MessagePack client" } });
          client = await createNativeTitanClient(jwt, wsUrl, handleConnectionLost);
        } else {
          addLog({ type: "request", data: { message: "Using TypeScript SDK client" } });
          client = await createTitanClient(jwt, wsUrl) as any; // SDK V1Client compatible with TitanClient interface
        }
        clientRef.current = client;

        addLog({ type: "response", data: { action: "connect", status: "success" } });

        // Get server info
        addLog({ type: "request", data: { action: "getInfo" } });
        const info = await client.getInfo();
        addLog({ type: "response", data: info });

        setServerInfo(info);
        setConnectionState({ status: "connected" });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Connection failed";
        addLog({ type: "error", data: { action: "connect", error: errorMessage } });
        setConnectionState({
          status: "error",
          error: errorMessage,
        });
      }
    },
    [addLog, clientMode]
  );

  const disconnect = useCallback(async () => {
    if (clientRef.current) {
      try {
        addLog({ type: "request", data: { action: "disconnect" } });
        await clientRef.current.close();
        addLog({ type: "response", data: { action: "disconnect", status: "success" } });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Disconnect failed";
        addLog({ type: "error", data: { action: "disconnect", error: errorMessage } });
      }
      clientRef.current = null;
    }
    setConnectionState({ status: "disconnected" });
    setServerInfo(null);
  }, [addLog]);

  return {
    connectionState,
    serverInfo,
    client: clientRef.current,
    clientMode,
    setClientMode,
    connect,
    disconnect,
  };
}
