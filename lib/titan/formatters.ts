/**
 * Format amount with decimals
 */
export function formatAmount(amount: string | number | bigint, decimals: number = 6): string {
  const numAmount = typeof amount === "bigint" ? amount : (typeof amount === "string" ? BigInt(amount) : BigInt(amount));
  const divisor = BigInt(10 ** decimals);
  const whole = numAmount / divisor;
  const fraction = numAmount % divisor;

  if (fraction === BigInt(0)) {
    return whole.toString();
  }

  const fractionStr = fraction.toString().padStart(decimals, "0");
  return `${whole}.${fractionStr}`.replace(/\.?0+$/, "");
}

/**
 * Format basis points as percentage
 */
export function formatBps(bps: number): string {
  return (bps / 100).toFixed(2) + "%";
}

/**
 * Format large numbers with K/M/B suffixes
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + "K";
  }
  return num.toFixed(2);
}

/**
 * Format slot number with commas
 */
export function formatSlot(slot: number): string {
  return slot.toLocaleString();
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
