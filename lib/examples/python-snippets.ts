import type { SwapQuoteRequest } from "@/lib/titan/native-types";
import bs58 from "bs58";

function serializeRequest(request: SwapQuoteRequest) {
  const encodeUint8Array = (arr: any): string => {
    if (arr instanceof Uint8Array) return bs58.encode(arr);
    return String(arr);
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
    intervalMs: request.update?.intervalMs || 1000,
    numQuotes: request.update?.numQuotes || 3,
  };
}

export function generatePythonSnippet(
  jwt: string,
  wsUrl: string,
  request: SwapQuoteRequest
): string {
  const params = serializeRequest(request);

  const dexLine = params.dexes?.length
    ? `\n            "dexes": ${JSON.stringify(params.dexes)},`
    : "";
  const excludeLine = params.excludeDexes?.length
    ? `\n            "excludeDexes": ${JSON.stringify(params.excludeDexes)},`
    : "";

  return `import asyncio
import json
import websockets
import msgpack
import base58

# pip install websockets msgpack base58

async def swap_example():
    ws_url = "${wsUrl}"
    jwt = "${jwt}"
    url = f"{ws_url}?auth={jwt}" if jwt else ws_url

    # Subprotocols for compression negotiation
    subprotocols = [
        "v1.api.titan.ag+zstd",
        "v1.api.titan.ag+brotli",
        "v1.api.titan.ag+gzip",
        "v1.api.titan.ag",
    ]

    async with websockets.connect(url, subprotocols=subprotocols) as ws:
        print(f"Connected, protocol: {ws.subprotocol}")
        msg_id = 0

        async def send_request(method: str, params=None):
            nonlocal msg_id
            msg_id += 1
            request = {"id": msg_id, "data": {method: params or {}}}
            encoded = msgpack.packb(request)
            await ws.send(encoded)
            return msg_id

        async def recv_message():
            data = await ws.recv()
            return msgpack.unpackb(data, raw=False)

        # Get server info
        await send_request("GetInfo")
        info = await recv_message()
        print(f"Server info: {info}")

        # Helper: base58 -> bytes
        def pubkey(addr: str) -> bytes:
            return base58.b58decode(addr)

        # Build swap request
        swap_request = {
            "swap": {
                "inputMint": pubkey("${params.inputMint}"),
                "outputMint": pubkey("${params.outputMint}"),
                "amount": ${params.amount},
                "swapMode": "${params.swapMode}",
                "slippageBps": ${params.slippageBps},
                "onlyDirectRoutes": ${params.onlyDirectRoutes ? "True" : "False"},${dexLine}${excludeLine}
            },
            "transaction": {
                "userPublicKey": pubkey("${params.userPublicKey}"),
            },
            "update": {
                "intervalMs": ${params.intervalMs},
                "num_quotes": ${params.numQuotes},
            },
        }

        req_id = await send_request("NewSwapQuoteStream", swap_request)
        response = await recv_message()
        print(f"Stream started: {response}")

        # Read stream updates
        count = 0
        while count < ${params.numQuotes}:
            msg = await recv_message()

            if "StreamData" in msg:
                stream_data = msg["StreamData"]
                payload = stream_data.get("payload", {})
                quotes = payload.get("SwapQuotes", {}).get("quotes", {})

                routes = []
                for provider, quote in quotes.items():
                    routes.append({
                        "provider": provider,
                        "outAmount": quote.get("outAmount", 0),
                        "steps": len(quote.get("steps", [])),
                    })

                routes.sort(key=lambda r: r["outAmount"], reverse=True)
                print(f"Update {count + 1}: {len(routes)} routes")
                if routes:
                    print(f"  Best: {routes[0]}")
                count += 1

            elif "StreamEnd" in msg:
                print("Stream ended")
                break

        # Stop stream
        await send_request("StopStream", {"id": response.get("Response", {}).get("stream", {}).get("id", 0)})
        print("Done")

asyncio.run(swap_example())`;
}
