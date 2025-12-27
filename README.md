# Titan Swap API Playground

A real-time WebSocket playground for the Titan Swap API with native protocol support.

## Features

- 🔌 **Dual Client Modes**: Choose between Native (WebSocket + MessagePack) or TypeScript SDK
- 📊 **Live Quote Streaming**: Real-time swap quotes with automatic updates
- 🔍 **Route Inspector**: Detailed route analysis including hops, fees, and liquidity
- 🛠️ **Transaction Inspector**: Decode instructions and account metadata
- 💻 **Code Generation**: Auto-generate TypeScript and Rust integration code
- 📝 **Protocol Logger**: Debug with raw WebSocket message inspection
- 🎨 **Modern UI**: Built with Next.js 14, shadcn/ui, and Tailwind CSS

## Quick Start

### Prerequisites

- Node.js 18 or higher
- (Optional) Titan API JWT token for authenticated endpoints

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using the playground.

## Usage Guide

### 1. Connect to Titan API

1. Select client mode:
   - **Native** (Recommended): Direct WebSocket + MessagePack implementation
   - **SDK**: Official TypeScript SDK

2. (Optional) Enter your JWT token

3. Select WebSocket endpoint or enter custom URL

4. Click **Connect** to establish connection

### 2. Configure Swap Parameters

- Select input/output tokens (SOL, USDC, USDT, BONK, JUP, WIF, or custom)
- Enter amount in UI format (e.g., "1" for 1 SOL)
- Set slippage tolerance in basis points (50 = 0.5%)
- Configure update interval and number of quotes

### 3. Stream Live Quotes

- Click **Start Stream** to begin receiving real-time quotes
- View routes sorted by best output amount
- Click any route to inspect details
- Click **Stop Stream** when finished

### 4. Analyze Results

- **Live Quotes Tab**: Compare routes across different providers
- **Route Details**: View hop-by-hop breakdown, fees, and routing path
- **Inspector Tab**: Decode transaction instructions
- **Logs Tab**: Debug protocol messages and events

## Project Structure

```
titan-playground/
├── app/
│   ├── page.tsx                    # Main playground (root route)
│   ├── components/
│   │   ├── connection-panel.tsx    # WebSocket connection UI
│   │   ├── swap-form.tsx           # Swap configuration
│   │   ├── stream-controls.tsx     # Start/stop streaming
│   │   ├── quotes-table.tsx        # Live quotes display
│   │   ├── route-details.tsx       # Route analysis
│   │   ├── tx-inspector.tsx        # Transaction decoder
│   │   └── raw-log-panel.tsx       # Protocol logger
│   └── swap/
│       └── page.tsx                # Swap execution page
├── hooks/
│   ├── use-titan-connection.ts     # Connection management
│   ├── use-swap-stream.ts          # Stream handling
│   └── use-log-store.ts            # Protocol logging
├── lib/
│   ├── titan/
│   │   ├── native-client.ts        # Native WebSocket client
│   │   ├── native-types.ts         # Protocol type definitions
│   │   ├── request-builder.ts      # Request formatting
│   │   └── formatters.ts           # Display utilities
│   ├── examples/
│   │   ├── ts-snippets.ts          # TypeScript code gen
│   │   └── rust-snippets.ts        # Rust code gen
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

## Resources

- [Titan API Docs](https://titan-exchange.gitbook.io/titan)
- [TypeScript SDK](https://www.npmjs.com/package/@titanexchange/sdk-ts)
- [Rust SDK Types](https://crates.io/crates/titan-api-types)
- [Rust SDK Codec](https://crates.io/crates/titan-api-codec)

## License

MIT
