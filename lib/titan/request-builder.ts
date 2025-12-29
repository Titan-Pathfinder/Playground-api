import bs58 from "bs58";
import type { SwapQuoteRequest, SwapMode } from "./native-types";

/**
 * =============================================================================
 * TITAN API REQUEST BUILDER
 * =============================================================================
 *
 * Helper functions to build properly formatted requests for Titan API.
 *
 * KEY POINTS:
 *
 * 1. SOLANA ADDRESSES (Public Keys):
 *    - Must be converted from base58 string to 32-byte Uint8Array
 *    - Use your language's base58 decoder
 *    - Example: "So11111111111111111111111111111111111111112" -> [0, 0, 0, ...]
 *
 * 2. AMOUNTS:
 *    - Use raw lamports/token units (smallest unit)
 *    - NOT decimal amounts!
 *    - Example: 1 SOL = 1_000_000_000 lamports
 *    - Example: 1 USDC = 1_000_000 (6 decimals)
 *
 * 3. SLIPPAGE:
 *    - Specified in basis points (bps)
 *    - 1 bps = 0.01%
 *    - Example: 50 bps = 0.5% slippage
 *    - Example: 100 bps = 1% slippage
 *
 * 4. SWAP MODES:
 *    - "ExactIn": Specify exact input amount, get estimated output
 *    - "ExactOut": Specify exact output amount, get estimated input
 *
 * =============================================================================
 */

/**
 * Convert base58 string to Uint8Array (Solana Pubkey format)
 *
 * IMPORTANT: All Solana addresses in API requests must be 32-byte arrays, not strings!
 */
export function pubkeyFromString(base58: string): Uint8Array {
  try {
    if (!base58 || base58.length === 0) {
      throw new Error("Empty address");
    }
    const decoded = bs58.decode(base58);
    if (decoded.length !== 32) {
      throw new Error(`Invalid public key length: expected 32 bytes, got ${decoded.length}`);
    }
    return decoded;
  } catch (error) {
    console.error(`Failed to decode base58 address "${base58}":`, error);
    throw new Error(`Invalid Solana address: ${base58.substring(0, 20)}...`);
  }
}

/**
 * Build a properly formatted SwapQuoteRequest for the Titan API
 *
 * REQUEST STRUCTURE:
 * ==================
 *
 * {
 *   swap: {
 *     inputMint: Uint8Array,      // Token to swap FROM (32 bytes)
 *     outputMint: Uint8Array,     // Token to swap TO (32 bytes)
 *     amount: number,             // Amount in smallest units (lamports)
 *     swapMode: "ExactIn" | "ExactOut",
 *     slippageBps: number,        // Slippage tolerance in basis points
 *     onlyDirectRoutes?: boolean, // Skip multi-hop routes
 *     dexes?: string[],           // Whitelist specific DEXes
 *     excludeDexes?: string[]     // Blacklist specific DEXes
 *   },
 *   transaction: {
 *     userPublicKey: Uint8Array   // User's wallet address (32 bytes)
 *   },
 *   update?: {                    // Optional: for streaming quotes
 *     intervalMs: number,         // Update frequency in milliseconds
 *     num_quotes: number          // How many updates to receive
 *   }
 * }
 *
 * EXAMPLE USAGE:
 * ==============
 *
 * const request = buildSwapQuoteRequest({
 *   inputMint: "So11111111111111111111111111111111111111112",  // SOL
 *   outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
 *   amount: 1_000_000_000,        // 1 SOL (9 decimals)
 *   userPublicKey: "YourWalletAddressHere",
 *   slippageBps: 50,              // 0.5% slippage
 *   swapMode: "ExactIn",
 *   intervalMs: 1000,             // Update every 1 second
 *   numQuotes: 10                 // Get 10 quote updates
 * });
 *
 * // Then send via WebSocket:
 * await client.newSwapQuoteStream(request);
 */
export function buildSwapQuoteRequest(params: {
  inputMint: string;
  outputMint: string;
  amount: number;
  userPublicKey: string;
  slippageBps?: number;
  swapMode?: SwapMode;
  onlyDirectRoutes?: boolean;
  intervalMs?: number;
  numQuotes?: number;
  dexes?: string[];
  excludeDexes?: string[];
}): SwapQuoteRequest {
  // Match SDK example structure - only include commonly used fields
  const swap: any = {
    inputMint: pubkeyFromString(params.inputMint),
    outputMint: pubkeyFromString(params.outputMint),
    amount: params.amount,
    swapMode: params.swapMode || "ExactIn",
    slippageBps: params.slippageBps !== undefined ? params.slippageBps : 50,
  };

  // Only add optional fields if they have actual values
  if (params.onlyDirectRoutes === true) {
    swap.onlyDirectRoutes = true;
  }
  if (params.dexes && params.dexes.length > 0) {
    swap.dexes = params.dexes;
  }
  if (params.excludeDexes && params.excludeDexes.length > 0) {
    swap.excludeDexes = params.excludeDexes;
  }

  const request: SwapQuoteRequest = {
    swap,
    transaction: {
      userPublicKey: pubkeyFromString(params.userPublicKey),
    },
  };

  // Only add update if numQuotes is specified
  if (params.numQuotes) {
    request.update = {
      intervalMs: params.intervalMs || 1000,
      num_quotes: params.numQuotes,  // Server expects snake_case
    } as any;  // Type def says num_quotes but SDK example uses numQuotes - using snake_case to match type
  }

  return request;
}
