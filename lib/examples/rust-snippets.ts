import type { SwapQuoteRequest } from "@/lib/titan/native-types";
import bs58 from "bs58";

/**
 * Serialize Uint8Array to base58 string for display
 */
function serializeRequest(request: SwapQuoteRequest) {
  const encodeUint8Array = (arr: any): string => {
    if (arr instanceof Uint8Array) {
      return bs58.encode(arr);
    }
    return "";
  };

  return {
    inputMint: encodeUint8Array(request.swap.inputMint),
    outputMint: encodeUint8Array(request.swap.outputMint),
    amount: request.swap.amount,
    swapMode: request.swap.swapMode,
    slippageBps: request.swap.slippageBps,
    onlyDirectRoutes: request.swap.onlyDirectRoutes,
    userPublicKey: encodeUint8Array(request.transaction.userPublicKey),
    intervalMs: request.update?.intervalMs || 1000,
    numQuotes: request.update?.num_quotes || 3,
  };
}

/**
 * Generate Rust code snippet for the given swap configuration
 */
export function generateRustSnippet(
  jwt: string,
  wsUrl: string,
  request: SwapQuoteRequest
): string {
  const params = serializeRequest(request);

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
    let swap_request = SwapQuoteRequest {
        swap: SwapParams {
            input_mint: Pubkey::from_str("${params.inputMint}")?,
            output_mint: Pubkey::from_str("${params.outputMint}")?,
            amount: ${params.amount},
            swap_mode: titan_sdk::SwapMode::${params.swapMode},
            slippage_bps: ${params.slippageBps},
            only_direct_routes: ${params.onlyDirectRoutes},
            dexes: None,
            exclude_dexes: None,
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
                // Transform quotes map to sorted vec
                let mut routes: Vec<_> = quotes.quotes
                    .iter()
                    .map(|(provider, quote)| (provider, quote.out_amount))
                    .collect();

                // Sort by best output
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

    // Stop stream
    stream.stop().await?;

    // Close connection
    client.close().await?;
    println!("Connection closed");

    Ok(())
}`;
}
