import type { SwapQuoteRequest } from "@/lib/titan/native-types";
import bs58 from "bs58";

/**
 * Serialize Uint8Array to base58 string for display
 */
function serializeRequest(request: SwapQuoteRequest) {
  const encodeUint8Array = (arr: any): string => {
    if (arr instanceof Uint8Array) {
      return `"${bs58.encode(arr)}"`;
    }
    return JSON.stringify(arr);
  };

  return {
    inputMint: encodeUint8Array(request.swap.inputMint),
    outputMint: encodeUint8Array(request.swap.outputMint),
    amount: request.swap.amount,
    swapMode: request.swap.swapMode,
    slippageBps: request.swap.slippageBps,
    onlyDirectRoutes: request.swap.onlyDirectRoutes,
    userPublicKey: encodeUint8Array(request.transaction.userPublicKey),
    intervalMs: request.update?.intervalMs,
    numQuotes: request.update?.num_quotes,
  };
}

/**
 * Generate TypeScript code snippet for the given swap configuration
 */
export function generateTypeScriptSnippet(
  jwt: string,
  wsUrl: string,
  request: SwapQuoteRequest
): string {
  const params = serializeRequest(request);

  return `import { V1Client } from "@titanexchange/sdk-ts";
import bs58 from "bs58";

// Helper to convert base58 string to Uint8Array (Pubkey)
function pubkeyFromString(base58: string): Uint8Array {
  return bs58.decode(base58);
}

async function swapExample() {
  try {
    // Connect to Titan API
    const wsUrl = "${wsUrl}?auth=${encodeURIComponent(jwt)}";
    const client = await V1Client.connect(wsUrl);
    console.log("Connected to Titan API");

    // Get server info
    const info = await client.getInfo();
    console.log("Server info:", info);

    // Build swap quote request
    const swapRequest = {
      swap: {
        inputMint: pubkeyFromString(${params.inputMint}),
        outputMint: pubkeyFromString(${params.outputMint}),
        amount: ${params.amount},
        swapMode: "${params.swapMode}",
        slippageBps: ${params.slippageBps},
        onlyDirectRoutes: ${params.onlyDirectRoutes},
      },
      transaction: {
        userPublicKey: pubkeyFromString(${params.userPublicKey}),
      },${params.intervalMs ? `
      update: {
        intervalMs: ${params.intervalMs},
        num_quotes: ${params.numQuotes},
      },` : ''}
    };

    // Start swap quote stream
    const result = await client.newSwapQuoteStream(swapRequest);
    console.log("Stream started:", result.response);

    // Read from stream
    const reader = result.stream.getReader();
    let count = 0;

    while (count < ${params.numQuotes || 5}) {
      const { done, value } = await reader.read();

      if (done) {
        console.log("Stream ended");
        break;
      }

      // Transform quotes object to routes array
      const routes = Object.entries(value.quotes).map(([provider, quote]: [string, any]) => ({
        provider,
        inAmount: quote.inAmount,
        outAmount: quote.outAmount,
        steps: quote.steps?.length || 0,
      }));

      // Sort by best output
      // Convert BigInt to Number for comparison
      routes.sort((a, b) => {
        const aOut = typeof a.outAmount === 'bigint' ? Number(a.outAmount) : a.outAmount;
        const bOut = typeof b.outAmount === 'bigint' ? Number(b.outAmount) : b.outAmount;
        return bOut - aOut;
      });

      console.log(\`Update \${count + 1}: \${routes.length} routes\`);
      console.log("Best route:", routes[0]);

      count++;
    }

    // Cancel stream reader
    await reader.cancel();

    // Stop stream on server
    await client.stopStream(result.response.id);

    // Close connection
    await client.close();
    console.log("Connection closed");

  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the example
swapExample();`;
}
