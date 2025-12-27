/**
 * Native Types - Compatible with Titan SDK types but without SDK dependency
 */

// ============================================================================
// Common Types
// ============================================================================

export type SwapMode = "ExactIn" | "ExactOut";

export interface ProtocolVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface ServerSettings {
  quoteUpdate: {
    intervalMs: { min: number; max: number; default: number };
    numQuotes: { min: number; max: number; default: number };
  };
  swap: {
    slippageBps: { min: number; max: number; default: number };
    onlyDirectRoutes: boolean;
    addSizeConstraint: boolean;
    sizeConstraint: number;
  };
  transaction: {
    closeInputTokenAccount: boolean;
    createOutputTokenAccount: boolean;
  };
  connection: {
    concurrentStreams: number;
  };
}

export interface ServerInfo {
  protocolVersion: ProtocolVersion;
  settings: ServerSettings;
}

// ============================================================================
// Request Types
// ============================================================================

export interface SwapParams {
  inputMint: Uint8Array;
  outputMint: Uint8Array;
  amount: number | bigint;
  swapMode?: SwapMode;
  slippageBps?: number;
  onlyDirectRoutes?: boolean;
  dexes?: string[];
  excludeDexes?: string[];
}

export interface TransactionParams {
  userPublicKey: Uint8Array;
  closeInputTokenAccount?: boolean;
  createOutputTokenAccount?: boolean;
  feeAccount?: Uint8Array;
  feeBps?: number;
}

export interface QuoteUpdateParams {
  intervalMs?: number;
  num_quotes?: number; // Note: snake_case as per API
}

export interface SwapQuoteRequest {
  swap: SwapParams;
  transaction: TransactionParams;
  update?: QuoteUpdateParams;
}

// ============================================================================
// Response Types
// ============================================================================

export interface SwapQuoteStreamResponse {
  id: number;
  intervalMs?: number;
  numQuotes?: number;
}

export interface RouteStep {
  ammKey: Uint8Array;
  label: string;
  inputMint: Uint8Array;
  outputMint: Uint8Array;
  inAmount: number | bigint;
  outAmount: number | bigint;
  allocPpb: number;
  contextSlot: number;
  feeAmount?: number | bigint;
  feeMint?: Uint8Array;
}

export interface AccountMeta {
  p: Uint8Array;  // pubkey
  s: boolean;     // isSigner
  w: boolean;     // isWritable
}

export interface TransactionInstruction {
  p: Uint8Array;        // programId
  a: AccountMeta[];     // accounts
  d: Uint8Array;        // data
}

export interface Quote {
  inAmount: number | bigint;
  outAmount: number | bigint;
  slippageBps: number;
  steps: RouteStep[];
  instructions: TransactionInstruction[];
  addressLookupTables: Uint8Array[];
  contextSlot: number;
  timeTakenNs: number | bigint;
  computeUnits: number;
  computeUnitsSafe: number;
  platformFee?: {
    amount: number | bigint;
    fee_bps: number;
  };
}

export interface SwapQuotes {
  id: string;
  inputMint: Uint8Array;
  outputMint: Uint8Array;
  swapMode: SwapMode;
  amount: number | bigint;
  quotes: Record<string, Quote>; // Keyed by provider name
  contextSlot?: number;
}

// ============================================================================
// Client Interface
// ============================================================================

export interface TitanClient {
  getInfo(): Promise<ServerInfo>;
  newSwapQuoteStream(request: SwapQuoteRequest): Promise<{
    response: SwapQuoteStreamResponse;
    stream: ReadableStream<SwapQuotes>;
  }>;
  stopStream(streamId: number): Promise<void>;
  close(): Promise<void>;
}

// ============================================================================
// Connection State
// ============================================================================

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface ConnectionState {
  status: ConnectionStatus;
  error?: string;
}

export type ClientMode = "sdk" | "native";
