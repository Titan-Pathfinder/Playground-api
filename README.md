# Titan Swap API Playground

A real-time WebSocket playground for exploring the Titan Swap Quote API. Stream live quotes, compare routes, and learn the protocol.

**Note:** This playground is for testing the quote streaming API only. It does not execute swaps.

## Demo

**Live Demo**: [http://13.49.102.179](http://13.49.102.179)

**Demo Video**: https://www.loom.com/share/3a129b1c830440f29954792693f57b60

## Features

- 🔌 **Dual Client Modes**: Choose between Native (WebSocket + MessagePack) or TypeScript SDK
- 📊 **Live Quote Streaming**: Real-time swap quotes with automatic updates
- 🔍 **Route Inspector**: Detailed route analysis including hops and liquidity
- 🛠️ **Transaction Inspector**: Decode instructions and account metadata
- 📝 **Protocol Logger**: Debug with raw WebSocket message inspection
- 🎨 **Modern UI**: Built with Next.js 14, shadcn/ui, and Tailwind CSS

## Quick Start

### Prerequisites

- Node.js 20 or higher (Node.js 24 LTS recommended)
- Titan API JWT token (get yours from [Titan Dashboard](https://titan.ag))

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using the playground.

## Security 

**This is playground and starter code for testing and learning purposes only.**

- **NEVER expose your API key in production client-side code**
- **ALWAYS hide your API key behind a secure backend proxy**
- This playground allows direct JWT token entry for convenience during development
- In production applications, implement proper authentication flow with server-side token management

## Playground Overview

### Connection Setup

**Choose Client Mode:**
- **Native** (Recommended): Direct WebSocket + MessagePack - best for learning the protocol
- **SDK**: Official TypeScript SDK - easier for production use

**Enter JWT Token:** Get yours from [Titan Dashboard](https://titan.ag)

**Select Endpoint:**
- DEV1 (Frankfurt) or DEV2 (Epimetheus) for testing
- Custom for your own endpoint

Click **Connect** and you'll see connection status and protocol version.

### Configuring Quote Parameters

- **Input Token**: Select from dropdown (SOL, USDC, etc.) or paste custom mint address
- **Output Token**: Same as above
- **Amount**: Enter in human-readable format (e.g., "1" for 1 SOL, not lamports)
- **Slippage**: In basis points (50 = 0.5%, 100 = 1%)
- **Update Interval**: How often to request new quotes (milliseconds)
- **Number of Quotes**: How many quote updates to receive

### Streaming Live Quotes

Click **Start Stream** to begin receiving real-time quotes. The **Live Quotes** table will populate with routes from different providers, automatically sorted by best output amount. Click any route to see a detailed breakdown in the **Route Details** panel. Click **Stop Stream** when done.

### Inspecting & Debugging

- **Live Quotes Panel**: Compare all available routes with pricing and providers
- **Route Details Panel**:
  - **Overview**: See input/output amounts and provider info
  - **Hops**: View step-by-step routing through different DEXes
- **Inspector Tab**: Decode transaction instructions and account metadata
- **Logs Tab**: View raw WebSocket messages for debugging

### Implementation Reference

Explore the codebase to understand how to implement the Titan API:
- `lib/titan/native-client.ts` - WebSocket connection, MessagePack encoding, compression
- `lib/titan/request-builder.ts` - Request formatting and validation
- `lib/titan/native-types.ts` - Complete protocol type definitions

## Project Structure

```
titan-playground/
├── app/
│   ├── page.tsx                    # Main playground page
│   └── components/
│       ├── connection-panel.tsx    # WebSocket connection UI
│       ├── swap-form.tsx           # Swap configuration
│       ├── stream-controls.tsx     # Start/stop streaming
│       ├── quotes-table.tsx        # Live quotes display
│       ├── route-details.tsx       # Route analysis
│       ├── tx-inspector.tsx        # Transaction decoder
│       └── raw-log-panel.tsx       # Protocol logger
├── hooks/
│   ├── use-titan-connection.ts     # Connection management
│   ├── use-swap-stream.ts          # Stream handling
│   └── use-log-store.ts            # Protocol logging
├── lib/
│   ├── titan/
│   │   ├── native-client.ts        # Native WebSocket client (reference implementation)
│   │   ├── native-types.ts         # Protocol type definitions
│   │   ├── request-builder.ts      # Request formatting helpers
│   │   └── formatters.ts           # Display utilities
│   └── constants/
│       ├── mints.ts                # Token addresses
│       └── venues.ts               # DEX venues
└── components/ui/                  # shadcn/ui components
```

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **WebSocket**: Native WebSocket API
- **Serialization**: @msgpack/msgpack
- **Compression**: http-encoding (zstd, brotli, gzip)
- **State**: React hooks + Zustand

## Native Client Features

The native client implementation provides:

- ✅ Direct protocol access without SDK overhead
- ✅ Full compression support (zstd, brotli, gzip)
- ✅ Connection loss detection and recovery
- ✅ Stream lifecycle management
- ✅ Protocol message logging
- ✅ No known bugs or workarounds needed

## Implementing the Quote Streaming API

This playground serves as a **reference implementation** for the Titan Quote Streaming API. Here's how to integrate quote streaming into your own project:

---

## ⚠️ CRITICAL: Endpoint Information

**The `v1.api.titan.ag` domain shown in code examples is ONLY used for WebSocket sub-protocol negotiation and is NOT a real, connectable endpoint.**

- **You MUST use the specific endpoint URL provided to you by Titan**
- The `titan.ag` domain is a protocol identifier, not an actual server address
- Contact Titan to receive your production endpoint URL
- **Do NOT attempt to connect to `wss://v1.api.titan.ag` directly**

## ⚠️ SECURITY: API Key Management

**This playground and starter code is for testing and learning purposes only.**

- **NEVER expose your API key in production client-side code**
- **ALWAYS hide your API key behind a secure backend proxy**
- This playground shows direct JWT usage for educational purposes
- In production, implement proper authentication with server-side token management

---

### Quick Start with SDK (Recommended for Production)

```typescript
import { TitanClient } from "@titanexchange/sdk-ts";

// IMPORTANT: Replace with YOUR endpoint URL provided by Titan
// The titan.ag domain below is ONLY for sub-protocol negotiation
//
// SECURITY WARNING: This example shows direct JWT usage for learning purposes.
// In production, NEVER expose your API key in client-side code!
// Always proxy through your backend server.
const client = await TitanClient.connect("wss://your-actual-endpoint-url", {
  auth: "your-jwt-token" // In production: get this from your backend proxy
});

// Stream live quotes (does NOT execute swaps)
const { response, stream } = await client.newSwapQuoteStream({
  swap: {
    inputMint: "So11111111111111111111111111111111111111112", // SOL
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    amount: 1_000_000_000, // 1 SOL in lamports
    swapMode: "ExactIn",
    slippageBps: 50 // 0.5%
  },
  transaction: {
    userPublicKey: "YourWalletAddressHere"
  }
});

// Process incoming quotes
for await (const quotes of stream) {
  console.log("Best quote:", quotes.routes[0]);
  // Use this data to display pricing, routes, etc.
  // To execute a swap, you would need to use a separate swap execution endpoint
}
```

### Native Implementation (For Custom Integrations)

If you want to implement the protocol natively (no SDK), refer to these files:

1. **WebSocket Connection**: `lib/titan/native-client.ts`
   - Shows protocol negotiation
   - MessagePack encoding/decoding
   - Compression handling (zstd/brotli/gzip)

2. **Request Building**: `lib/titan/request-builder.ts`
   - Proper request structure
   - Address encoding (base58 → bytes)
   - Amount handling (lamports vs UI)

3. **Type Definitions**: `lib/titan/native-types.ts`
   - Complete protocol types
   - Request/response formats

### Key Implementation Details

**Protocol Flow:**
```
1. WebSocket Handshake with compression subprotocol
   → new WebSocket(your_endpoint_url, ["v1.api.titan.ag+zstd", ...])
   Note: "v1.api.titan.ag" is the sub-protocol identifier, NOT the endpoint URL

2. Encode request with MessagePack
   → { id: 1, data: { "MethodName": params } }

3. Compress if protocol selected
   → zstd/brotli/gzip

4. Send binary data
   → ws.send(compressed_msgpack_data)

5. Receive and decompress response
   → { requestId: 1, data: { "MethodName": result } }

6. For streams, handle StreamData and StreamEnd messages
```

**Important Notes:**
- All Solana addresses must be 32-byte `Uint8Array`, not base58 strings
- Amounts are in smallest units (lamports for SOL, token units for SPL)
- Slippage is in basis points (50 = 0.5%)
- MessagePack encoder must support BigInt64 for u64/i64 values
- Always handle connection loss and implement reconnection logic

## Resources

- [Titan API Docs](https://titan-exchange.gitbook.io/titan)
- [TypeScript SDK](https://www.npmjs.com/package/@titanexchange/sdk-ts)
- [Rust SDK Types](https://crates.io/crates/titan-api-types)
- [Rust SDK Codec](https://crates.io/crates/titan-api-codec)

## License

MIT
