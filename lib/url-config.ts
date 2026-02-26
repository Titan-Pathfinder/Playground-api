/**
 * URL-based config sharing with short parameter names
 */

export interface ShareableConfig {
  inputMint: string;
  outputMint: string;
  amount: string;
  userPublicKey: string;
  slippageBps: string;
  onlyDirectRoutes: boolean;
  intervalMs: string;
  numQuotes: string;
  dexFilter?: string;
}

// Short param name mapping
const PARAM_MAP = {
  im: "inputMint",
  om: "outputMint",
  a: "amount",
  u: "userPublicKey",
  s: "slippageBps",
  d: "onlyDirectRoutes",
  i: "intervalMs",
  n: "numQuotes",
  df: "dexFilter",
} as const;

const REVERSE_MAP = Object.fromEntries(
  Object.entries(PARAM_MAP).map(([k, v]) => [v, k])
) as Record<string, string>;

export function encodeConfigToUrl(config: ShareableConfig): string {
  const params = new URLSearchParams();

  if (config.inputMint) params.set("im", config.inputMint);
  if (config.outputMint) params.set("om", config.outputMint);
  if (config.amount && config.amount !== "1") params.set("a", config.amount);
  if (config.userPublicKey) params.set("u", config.userPublicKey);
  if (config.slippageBps && config.slippageBps !== "50") params.set("s", config.slippageBps);
  if (config.onlyDirectRoutes) params.set("d", "1");
  if (config.intervalMs && config.intervalMs !== "1000") params.set("i", config.intervalMs);
  if (config.numQuotes && config.numQuotes !== "3") params.set("n", config.numQuotes);
  if (config.dexFilter) params.set("df", config.dexFilter);

  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

export function decodeConfigFromUrl(searchParams: URLSearchParams): Partial<ShareableConfig> | null {
  // Check if any of our short params exist
  const hasParams = Array.from(searchParams.keys()).some((k) => k in PARAM_MAP);
  if (!hasParams) return null;

  const config: Partial<ShareableConfig> = {};

  if (searchParams.has("im")) config.inputMint = searchParams.get("im")!;
  if (searchParams.has("om")) config.outputMint = searchParams.get("om")!;
  if (searchParams.has("a")) config.amount = searchParams.get("a")!;
  if (searchParams.has("u")) config.userPublicKey = searchParams.get("u")!;
  if (searchParams.has("s")) config.slippageBps = searchParams.get("s")!;
  if (searchParams.has("d")) config.onlyDirectRoutes = searchParams.get("d") === "1";
  if (searchParams.has("i")) config.intervalMs = searchParams.get("i")!;
  if (searchParams.has("n")) config.numQuotes = searchParams.get("n")!;
  if (searchParams.has("df")) config.dexFilter = searchParams.get("df")!;

  return config;
}
