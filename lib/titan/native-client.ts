"use client";

import { Encoder, Decoder } from "@msgpack/msgpack";
import { zstdDecompress, brotliDecompress, gunzip, zstdCompress, brotliCompress, gzip } from "http-encoding";
import type {
  TitanClient,
  ServerInfo,
  SwapQuoteRequest,
  SwapQuoteStreamResponse,
  SwapQuotes,
} from "./native-types";

/**
 * WebSocket subprotocols supported by Titan API
 * The server will select one during handshake
 */
const WEBSOCKET_SUBPROTO_BASE = "v1.api.titan.ag";
const WEBSOCKET_SUBPROTOCOLS = [
  `${WEBSOCKET_SUBPROTO_BASE}+zstd`,   // zstd compression (best)
  `${WEBSOCKET_SUBPROTO_BASE}+brotli`, // brotli compression
  `${WEBSOCKET_SUBPROTO_BASE}+gzip`,   // gzip compression
  WEBSOCKET_SUBPROTO_BASE,             // no compression
];

/**
 * Native WebSocket + MessagePack client for Titan API
 * No SDK dependency - direct protocol implementation
 */
export class NativeTitanClient implements TitanClient {
  private ws: WebSocket;
  private protocol: string;
  private messageId = 0;
  private encoder: Encoder;
  private decoder: Decoder;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();

  // Stream controllers registry - so we can route StreamData to the right stream
  private streamControllers = new Map<number, ReadableStreamDefaultController<SwapQuotes>>();

  // Callback for when connection closes unexpectedly
  private onConnectionLost?: () => void;

  private constructor(ws: WebSocket, protocol: string, onConnectionLost?: () => void) {
    this.ws = ws;
    this.protocol = protocol;
    this.onConnectionLost = onConnectionLost;

    // Configure MessagePack encoder/decoder with BigInt support
    // This must match the SDK configuration
    this.encoder = new Encoder({
      useBigInt64: true,
    });
    this.decoder = new Decoder({
      useBigInt64: true,
    });

    this.setupMessageHandler();
  }

  /**
   * Connect to Titan WebSocket API
   */
  static async connect(url: string, onConnectionLost?: () => void): Promise<NativeTitanClient> {
    return new Promise((resolve, reject) => {
      // Pass subprotocols for server negotiation
      const ws = new WebSocket(url, WEBSOCKET_SUBPROTOCOLS);
      ws.binaryType = "arraybuffer";

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("Connection timeout"));
      }, 10000);

      ws.onopen = () => {
        clearTimeout(timeout);

        // Check which protocol was selected
        const selectedProtocol = ws.protocol;
        if (!selectedProtocol) {
          ws.close();
          reject(new Error("No protocol selected during handshake"));
          return;
        }

        const client = new NativeTitanClient(ws, selectedProtocol, onConnectionLost);
        resolve(client);
      };

      ws.onerror = (event) => {
        clearTimeout(timeout);
        console.error("❌ WebSocket error:", event);
        reject(new Error("WebSocket connection failed"));
      };

      ws.onclose = (event) => {
        clearTimeout(timeout);
        if (event.code !== 1000) {
          console.error("❌ WebSocket closed unexpectedly:", event.code, event.reason);
        }
      };
    });
  }

  /**
   * Compress data if compression is enabled
   */
  private async compressData(data: Uint8Array): Promise<Uint8Array> {
    if (this.protocol.includes("+zstd")) {
      return await zstdCompress(data);
    } else if (this.protocol.includes("+brotli")) {
      return await brotliCompress(data);
    } else if (this.protocol.includes("+gzip")) {
      return await gzip(data);
    } else {
      // No compression
      return data;
    }
  }

  /**
   * Decompress data if compression is enabled
   */
  private async decompressData(data: Uint8Array): Promise<Uint8Array> {
    if (this.protocol.includes("+zstd")) {
      return await zstdDecompress(data);
    } else if (this.protocol.includes("+brotli")) {
      return await brotliDecompress(data);
    } else if (this.protocol.includes("+gzip")) {
      return await gunzip(data);
    } else {
      // No compression
      return data;
    }
  }

  /**
   * Handle successful response
   */
  private handleResponse(response: any) {
    const requestId = response.requestId;
    const pending = this.pendingRequests.get(requestId);

    if (!pending) {
      console.error("❌ Got response for unknown request ID:", requestId);
      return;
    }

    this.pendingRequests.delete(requestId);

    // Extract the actual data from the response
    // Response format: { requestId: N, data: { MethodName: result }, stream?: {...} }
    const methodName = Object.keys(response.data)[0];
    const result = response.data[methodName];

    // For stream responses, include the entire response (result + stream info)
    if (response.stream) {
      pending.resolve({ result, streamInfo: response.stream });
    } else {
      pending.resolve(result);
    }
  }

  /**
   * Handle error response
   */
  private handleError(error: any) {
    const requestId = error.requestId;
    const pending = this.pendingRequests.get(requestId);

    if (!pending) {
      console.error("❌ Got error for unknown request ID:", requestId);
      return;
    }

    this.pendingRequests.delete(requestId);
    pending.reject(new Error(error.message || "Server error"));
  }

  /**
   * Handle stream data
   */
  private handleStreamData(streamData: any) {
    // SDK structure: { id: number, seq: number, payload: { SwapQuotes: {...} } }
    const streamId = streamData.id;
    const controller = this.streamControllers.get(streamId);

    if (!controller) {
      return;
    }

    const payload = streamData.payload;
    if (payload && payload.SwapQuotes) {
      controller.enqueue(payload.SwapQuotes as SwapQuotes);
    }
  }

  /**
   * Handle stream end
   */
  private handleStreamEnd(streamEnd: any) {
    // SDK structure: { id: number, errorCode?: number, errorMessage?: string }
    const streamId = streamEnd.id;
    const controller = this.streamControllers.get(streamId);

    if (controller) {
      controller.close();
      this.streamControllers.delete(streamId);
    }
  }

  /**
   * Setup message handler for incoming WebSocket messages
   */
  private setupMessageHandler() {
    this.ws.onmessage = async (event) => {
      try {
        const rawData = new Uint8Array(event.data);

        // Decompress if needed
        const data = await this.decompressData(rawData);

        const decoded = this.decoder.decode(data) as any;

        // Handle different message types
        if (decoded.Response) {
          this.handleResponse(decoded.Response);
        } else if (decoded.Error) {
          this.handleError(decoded.Error);
        } else if (decoded.StreamData) {
          this.handleStreamData(decoded.StreamData);
        } else if (decoded.StreamEnd) {
          this.handleStreamEnd(decoded.StreamEnd);
        } else {
          console.warn("⚠️ Unknown message type:", Object.keys(decoded));
        }
      } catch (error) {
        console.error("❌ Failed to decode message:", error);
      }
    };

    this.ws.onerror = (event) => {
      console.error("❌ WebSocket error:", event);
      // Reject all pending requests
      this.pendingRequests.forEach((pending) => {
        pending.reject(new Error("WebSocket error"));
      });
      this.pendingRequests.clear();
    };

    this.ws.onclose = (event) => {
      // Reject all pending requests
      this.pendingRequests.forEach((pending) => {
        pending.reject(new Error("WebSocket closed"));
      });
      this.pendingRequests.clear();

      // If this was not a clean close (code 1000), notify parent
      if (event.code !== 1000 && this.onConnectionLost) {
        this.onConnectionLost();
      }
    };
  }

  /**
   * Send a request and wait for response
   *
   * Format: { id: number, data: { MethodName: params } }
   * NOT JSON-RPC!
   */
  private async sendRequest<T>(method: string, params?: any): Promise<T> {
    if (this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    const id = this.messageId++;
    const request = {
      id,
      data: {
        [method]: params || {},
      },
    };

    return new Promise(async (resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      try {
        // 1. MessagePack encode
        const encoded = this.encoder.encode(request);

        // 2. Compress if needed
        const compressed = await this.compressData(encoded);

        // 3. Send
        this.ws.send(compressed);
      } catch (error) {
        this.pendingRequests.delete(id);
        reject(error);
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 30000);
    });
  }

  /**
   * Get server info
   */
  async getInfo(): Promise<ServerInfo> {
    const response = await this.sendRequest<ServerInfo>("GetInfo");
    return response;
  }

  /**
   * Start a new swap quote stream
   */
  async newSwapQuoteStream(request: SwapQuoteRequest): Promise<{
    response: SwapQuoteStreamResponse;
    stream: ReadableStream<SwapQuotes>;
  }> {
    const responseData = await this.sendRequest<any>(
      "NewSwapQuoteStream",
      request
    );

    // SDK structure: { result: { intervalMs: number }, streamInfo: { id: number, dataType: "SwapQuotes" } }
    const result = responseData.result;
    const streamInfo = responseData.streamInfo;

    if (!streamInfo || typeof streamInfo.id !== 'number') {
      throw new Error("No stream info in response");
    }

    const streamId = streamInfo.id;

    // Create a ReadableStream for the quote updates
    const stream = new ReadableStream<SwapQuotes>({
      start: (controller) => {
        // Register this stream controller so handleStreamData can route to it
        this.streamControllers.set(streamId, controller);
      },

      cancel: async () => {
        this.streamControllers.delete(streamId);
        try {
          await this.stopStream(streamId);
        } catch (e) {
          // Stream might already be stopped
        }
      },
    });

    return {
      response: {
        id: streamId,
        ...result,
      } as SwapQuoteStreamResponse,
      stream,
    };
  }

  /**
   * Stop an active stream
   */
  async stopStream(streamId: number): Promise<void> {
    await this.sendRequest("StopStream", { id: streamId });
  }

  /**
   * Close the WebSocket connection
   */
  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.ws.readyState === WebSocket.CLOSED) {
        resolve();
        return;
      }

      this.ws.onclose = () => {
        resolve();
      };

      this.ws.close(1000, "Client closed");
    });
  }
}

/**
 * Create and connect to Titan WebSocket API using native client
 *
 * @param jwt - JWT authentication token (optional)
 * @param wsUrl - WebSocket URL (without query params)
 * @param onConnectionLost - Callback when connection is lost unexpectedly
 * @returns Promise that resolves to connected NativeTitanClient
 */
export async function createNativeTitanClient(
  jwt: string,
  wsUrl: string = "wss://v1.api.titan.ag",
  onConnectionLost?: () => void
): Promise<NativeTitanClient> {
  // Add JWT as query parameter for authentication if provided
  const urlWithAuth = jwt ? `${wsUrl}?auth=${encodeURIComponent(jwt)}` : wsUrl;

  // Connect to the WebSocket
  const client = await NativeTitanClient.connect(urlWithAuth, onConnectionLost);

  return client;
}
