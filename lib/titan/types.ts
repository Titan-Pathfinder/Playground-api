// Types for the playground
export interface ConnectionState {
  status: "disconnected" | "connecting" | "connected" | "error";
  error?: string;
}

export interface ProtocolLogEntry {
  timestamp: number;
  type: "request" | "response" | "stream_start" | "stream_data" | "stream_end" | "error";
  data: unknown;
}
