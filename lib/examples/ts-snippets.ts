import type { SwapQuoteRequest } from "@/lib/titan/native-types";
import bs58 from "bs58";

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
    swapMode: request.swap.swapMode || "ExactIn",
    slippageBps: request.swap.slippageBps ?? 50,
    onlyDirectRoutes: request.swap.onlyDirectRoutes || false,
    dexes: request.swap.dexes,
    excludeDexes: request.swap.excludeDexes,
    userPublicKey: encodeUint8Array(request.transaction.userPublicKey),
    intervalMs: request.update?.intervalMs,
    numQuotes: request.update?.numQuotes,
  };
}

export function generateTypeScriptSnippet(
  jwt: string,
  wsUrl: string,
  request: SwapQuoteRequest,
  options?: { minimal?: boolean; native?: boolean }
): string {
  const params = serializeRequest(request);
  const dexLine = params.dexes?.length
    ? `\n        dexes: ${JSON.stringify(params.dexes)},`
    : "";
  const excludeLine = params.excludeDexes?.length
    ? `\n        excludeDexes: ${JSON.stringify(params.excludeDexes)},`
    : "";

  if (options?.minimal) {
    return `import { V1Client } from "@titanexchange/sdk-ts";
import bs58 from "bs58";

const client = await V1Client.connect("${wsUrl}?auth=${encodeURIComponent(jwt)}");
const { stream } = await client.newSwapQuoteStream({
  swap: {
    inputMint: bs58.decode(${params.inputMint}),
    outputMint: bs58.decode(${params.outputMint}),
    amount: ${params.amount},
    slippageBps: ${params.slippageBps},${dexLine}${excludeLine}
  },
  transaction: { userPublicKey: bs58.decode(${params.userPublicKey}) },
  update: { intervalMs: ${params.intervalMs || 1000}, num_quotes: ${params.numQuotes || 3} },
});

const reader = stream.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const best = Object.entries(value.quotes)
    .sort(([,a]: any, [,b]: any) => Number(b.outAmount) - Number(a.outAmount))[0];
  console.log(\`Best: \${best[0]} -> \${best[1].outAmount}\`);
}
await client.close();`;
  }

  return `import { V1Client } from "@titanexchange/sdk-ts";
import bs58 from "bs58";

// Helper to convert base58 string to Uint8Array (Pubkey)
function pubkeyFromString(base58Str: string): Uint8Array {
  return bs58.decode(base58Str);
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
        inputMint: pubkeyFromString(${params.inputMint}),  // ${params.inputMint.replace(/"/g, "")}
        outputMint: pubkeyFromString(${params.outputMint}),  // ${params.outputMint.replace(/"/g, "")}
        amount: ${params.amount},
        swapMode: "${params.swapMode}",
        slippageBps: ${params.slippageBps},
        onlyDirectRoutes: ${params.onlyDirectRoutes},${dexLine}${excludeLine}
      },
      transaction: {
        userPublicKey: pubkeyFromString(${params.userPublicKey}),
      },${params.intervalMs ? `
      update: {
        intervalMs: ${params.intervalMs},
        num_quotes: ${params.numQuotes},
      },` : ""}
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

      routes.sort((a, b) => Number(b.outAmount) - Number(a.outAmount));

      console.log(\`Update \${count + 1}: \${routes.length} routes\`);
      console.log("Best route:", routes[0]);

      count++;
    }

    await reader.cancel();
    await client.stopStream(result.response.id);
    await client.close();
    console.log("Connection closed");

  } catch (error) {
    console.error("Error:", error);
  }
}

swapExample();`;
}
