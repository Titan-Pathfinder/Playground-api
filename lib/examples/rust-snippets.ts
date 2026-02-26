import type { SwapQuoteRequest } from "@/lib/titan/native-types";
import bs58 from "bs58";

function serializeRequest(request: SwapQuoteRequest) {
  const encodeUint8Array = (arr: any): string => {
    if (arr instanceof Uint8Array) return bs58.encode(arr);
    return "";
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

export function generateRustSnippet(
  jwt: string,
  wsUrl: string,
  request: SwapQuoteRequest,
  options?: { minimal?: boolean }
): string {
  const params = serializeRequest(request);

  const dexesLine = params.dexes?.length
    ? `Some(vec![${params.dexes.map((d) => `"${d}".to_string()`).join(", ")}])`
    : "None";
  const excludeLine = params.excludeDexes?.length
    ? `Some(vec![${params.excludeDexes.map((d) => `"${d}".to_string()`).join(", ")}])`
    : "None";

  if (options?.minimal) {
    return `use titan_sdk::{V1Client, SwapQuoteRequest, SwapParams, TransactionParams, QuoteUpdateParams};
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let mut client = V1Client::connect("${wsUrl}?auth=${jwt}").await?;
    let mut stream = client.new_swap_quote_stream(SwapQuoteRequest {
        swap: SwapParams {
            input_mint: Pubkey::from_str("${params.inputMint}")?,
            output_mint: Pubkey::from_str("${params.outputMint}")?,
            amount: ${params.amount}, slippage_bps: ${params.slippageBps},
            ..Default::default()
        },
        transaction: TransactionParams {
            user_public_key: Pubkey::from_str("${params.userPublicKey}")?,
            ..Default::default()
        },
        update: Some(QuoteUpdateParams { interval_ms: ${params.intervalMs}, num_quotes: ${params.numQuotes} }),
    }).await?;

    while let Some(Ok(quotes)) = stream.next().await {
        let best = quotes.quotes.iter().max_by_key(|(_, q)| q.out_amount);
        if let Some((provider, quote)) = best {
            println!("{}: {}", provider, quote.out_amount);
        }
    }
    client.close().await?;
    Ok(())
}`;
  }

  return `use titan_sdk::{V1Client, SwapQuoteRequest, SwapParams, TransactionParams, QuoteUpdateParams};
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;
use anyhow::Result;

#[tokio::main]
async fn main() -> Result<()> {
    // Connect to Titan API
    let jwt = "${jwt}";
    let ws_url = "${wsUrl}";
    let url_with_auth = format!("{}?auth={}", ws_url, jwt);

    let mut client = V1Client::connect(&url_with_auth).await?;
    println!("Connected to Titan API");

    // Get server info
    let info = client.get_info().await?;
    println!("Server version: {}.{}.{}",
        info.protocol_version.major,
        info.protocol_version.minor,
        info.protocol_version.patch
    );

    // Build swap quote request
    // Input: ${params.inputMint}
    // Output: ${params.outputMint}
    let swap_request = SwapQuoteRequest {
        swap: SwapParams {
            input_mint: Pubkey::from_str("${params.inputMint}")?,
            output_mint: Pubkey::from_str("${params.outputMint}")?,
            amount: ${params.amount},
            swap_mode: titan_sdk::SwapMode::${params.swapMode},
            slippage_bps: ${params.slippageBps},
            only_direct_routes: ${params.onlyDirectRoutes},
            dexes: ${dexesLine},
            exclude_dexes: ${excludeLine},
        },
        transaction: TransactionParams {
            user_public_key: Pubkey::from_str("${params.userPublicKey}")?,
            close_input_token_account: None,
            create_output_token_account: None,
            fee_account: None,
            fee_bps: None,
        },
        update: Some(QuoteUpdateParams {
            interval_ms: ${params.intervalMs},
            num_quotes: ${params.numQuotes},
        }),
    };

    // Start swap quote stream
    let mut stream = client.new_swap_quote_stream(swap_request).await?;
    println!("Stream started: {:?}", stream.response);

    // Read from stream
    let mut count = 0;
    while count < ${params.numQuotes} {
        match stream.next().await {
            Some(Ok(quotes)) => {
                let mut routes: Vec<_> = quotes.quotes
                    .iter()
                    .map(|(provider, quote)| (provider, quote.out_amount))
                    .collect();

                routes.sort_by(|a, b| b.1.cmp(&a.1));

                println!("Update {}: {} routes", count + 1, routes.len());
                if let Some((provider, out_amount)) = routes.first() {
                    println!("Best route: {} with output {}", provider, out_amount);
                }

                count += 1;
            }
            Some(Err(e)) => {
                eprintln!("Stream error: {}", e);
                break;
            }
            None => {
                println!("Stream ended");
                break;
            }
        }
    }

    stream.stop().await?;
    client.close().await?;
    println!("Connection closed");

    Ok(())
}`;
}
