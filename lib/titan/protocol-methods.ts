/**
 * Registry of Titan API methods with descriptions and request templates
 */

export interface ApiMethod {
  name: string;
  description: string;
  hasStream: boolean;
  template: Record<string, any>;
}

export const PROTOCOL_METHODS: ApiMethod[] = [
  {
    name: "GetInfo",
    description: "Get server info including protocol version and settings",
    hasStream: false,
    template: {},
  },
  {
    name: "GetVenues",
    description: "Get list of available DEX/AMM venues",
    hasStream: false,
    template: {},
  },
  {
    name: "ListProviders",
    description: "List available quote providers",
    hasStream: false,
    template: {},
  },
  {
    name: "NewSwapQuoteStream",
    description: "Start a streaming swap quote with real-time updates",
    hasStream: true,
    template: {
      swap: {
        inputMint: "<base58 encoded 32-byte public key as Uint8Array>",
        outputMint: "<base58 encoded 32-byte public key as Uint8Array>",
        amount: 1000000000,
        swapMode: "ExactIn",
        slippageBps: 50,
        onlyDirectRoutes: false,
      },
      transaction: {
        userPublicKey: "<base58 encoded 32-byte public key as Uint8Array>",
      },
      update: {
        intervalMs: 1000,
        num_quotes: 3,
      },
    },
  },
  {
    name: "StopStream",
    description: "Stop an active stream by ID",
    hasStream: false,
    template: {
      id: 0,
    },
  },
];

export function getMethodByName(name: string): ApiMethod | undefined {
  return PROTOCOL_METHODS.find((m) => m.name === name);
}
