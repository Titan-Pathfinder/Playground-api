import bs58 from "bs58";
import type { SwapQuoteRequest, SwapMode } from "./native-types";

/**
 * Convert base58 string to Uint8Array (Pubkey format)
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
