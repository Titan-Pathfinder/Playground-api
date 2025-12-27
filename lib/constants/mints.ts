// Common Solana token mint addresses
export const COMMON_MINTS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  WIF: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
} as const;

export interface TokenInfo {
  symbol: string;
  decimals: number;
  name: string;
}

export const TOKEN_INFO: Record<string, TokenInfo> = {
  [COMMON_MINTS.SOL]: { symbol: "SOL", decimals: 9, name: "Solana" },
  [COMMON_MINTS.USDC]: { symbol: "USDC", decimals: 6, name: "USD Coin" },
  [COMMON_MINTS.USDT]: { symbol: "USDT", decimals: 6, name: "Tether USD" },
  [COMMON_MINTS.BONK]: { symbol: "BONK", decimals: 5, name: "Bonk" },
  [COMMON_MINTS.JUP]: { symbol: "JUP", decimals: 6, name: "Jupiter" },
  [COMMON_MINTS.WIF]: { symbol: "WIF", decimals: 6, name: "dogwifhat" },
};

export const MINT_LABELS: Record<string, string> = {
  [COMMON_MINTS.SOL]: "SOL",
  [COMMON_MINTS.USDC]: "USDC",
  [COMMON_MINTS.USDT]: "USDT",
  [COMMON_MINTS.BONK]: "BONK",
  [COMMON_MINTS.JUP]: "JUP",
  [COMMON_MINTS.WIF]: "WIF",
};

export function getMintLabel(mint: string): string {
  return MINT_LABELS[mint] || mint.slice(0, 8) + "...";
}

export function getTokenInfo(mint: string): TokenInfo | null {
  return TOKEN_INFO[mint] || null;
}

/**
 * Convert UI amount to raw token amount (e.g., 1.5 SOL -> 1500000000 lamports)
 */
export function uiAmountToRaw(uiAmount: number, decimals: number): number {
  return Math.floor(uiAmount * Math.pow(10, decimals));
}

/**
 * Convert raw token amount to UI amount (e.g., 1500000000 lamports -> 1.5 SOL)
 */
export function rawAmountToUi(rawAmount: number | string | bigint, decimals: number): number {
  // Handle BigInt by converting to Number
  if (typeof rawAmount === 'bigint') {
    return Number(rawAmount) / Math.pow(10, decimals);
  }
  const raw = typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;
  return raw / Math.pow(10, decimals);
}

/**
 * Format raw amount as string with proper decimals (e.g., 1500000000 -> "1.5")
 */
export function formatRawAmount(
  rawAmount: number | string | bigint,
  decimals: number,
  maxDecimals: number = 6
): string {
  const uiAmount = rawAmountToUi(rawAmount, decimals);
  return uiAmount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(maxDecimals, decimals),
  });
}
