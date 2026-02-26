import {
  Connection,
  VersionedTransaction,
  TransactionMessage,
  TransactionInstruction,
  PublicKey,
  AddressLookupTableAccount,
} from "@solana/web3.js";
import bs58 from "bs58";

export interface SimulationResult {
  success: boolean;
  error?: string;
  logs: string[];
  unitsConsumed?: number;
}

/**
 * Safely convert any pubkey representation to a PublicKey.
 * Handles: Uint8Array (raw 32 bytes), base58 string, number[] array.
 */
function toPublicKey(value: any): PublicKey {
  if (value instanceof PublicKey) return value;

  // Raw 32-byte Uint8Array from the API
  if (value instanceof Uint8Array) {
    if (value.length === 32) {
      return new PublicKey(value);
    }
    // If not 32 bytes, try interpreting as base58 string bytes
    const str = new TextDecoder().decode(value);
    return new PublicKey(str);
  }

  // Plain array of numbers (e.g. JSON-deserialized Uint8Array)
  if (Array.isArray(value)) {
    return new PublicKey(new Uint8Array(value));
  }

  // Base58 string
  if (typeof value === "string") {
    return new PublicKey(value);
  }

  // Object with .data or similar (edge cases)
  if (value && typeof value === "object" && value.data) {
    return new PublicKey(new Uint8Array(value.data));
  }

  throw new Error(`Cannot convert to PublicKey: ${typeof value}`);
}

/**
 * Safely convert instruction data to a Buffer
 */
function toBuffer(value: any): Buffer {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (Array.isArray(value)) return Buffer.from(new Uint8Array(value));
  if (typeof value === "string") return Buffer.from(bs58.decode(value));
  return Buffer.alloc(0);
}

/**
 * Build a VersionedTransaction from quote instructions and simulate it
 */
export async function simulateTransaction(
  rpcUrl: string,
  instructions: any[],
  addressLookupTables: any[],
  userPublicKey: string
): Promise<SimulationResult> {
  const connection = new Connection(rpcUrl, "confirmed");
  const payer = new PublicKey(userPublicKey);

  try {
    // Convert raw instructions to TransactionInstruction
    const txInstructions: TransactionInstruction[] = instructions.map((ix: any, ixIdx: number) => {
      try {
        const programId = ix.p || ix.programId;
        const accounts = (ix.a || ix.accounts || []).map((acc: any, accIdx: number) => {
          try {
            const pubkey = acc.p || acc.pubkey || acc;
            return {
              pubkey: toPublicKey(pubkey),
              isSigner: acc.s ?? acc.isSigner ?? false,
              isWritable: acc.w ?? acc.isWritable ?? false,
            };
          } catch (e) {
            throw new Error(
              `Instruction ${ixIdx}, account ${accIdx}: ${e instanceof Error ? e.message : "invalid pubkey"}`
            );
          }
        });
        const data = ix.d || ix.data || Buffer.alloc(0);

        return new TransactionInstruction({
          programId: toPublicKey(programId),
          keys: accounts,
          data: toBuffer(data),
        });
      } catch (e) {
        throw new Error(
          `Failed to parse instruction ${ixIdx}: ${e instanceof Error ? e.message : "unknown error"}`
        );
      }
    });

    // Fetch lookup tables if provided
    let lookupTableAccounts: AddressLookupTableAccount[] = [];
    if (addressLookupTables && addressLookupTables.length > 0) {
      const lookupTableAddresses = addressLookupTables.map((addr: any) =>
        toPublicKey(addr)
      );

      const fetchedTables = await Promise.all(
        lookupTableAddresses.map(async (address: PublicKey) => {
          try {
            const result = await connection.getAddressLookupTable(address);
            return result.value;
          } catch {
            return null;
          }
        })
      );
      lookupTableAccounts = fetchedTables.filter(
        (t): t is AddressLookupTableAccount => t !== null
      );
    }

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash("confirmed");

    // Build versioned transaction
    const messageV0 = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions: txInstructions,
    }).compileToV0Message(lookupTableAccounts);

    const transaction = new VersionedTransaction(messageV0);

    // Simulate with sigVerify: false (no actual signatures needed)
    const simulation = await connection.simulateTransaction(transaction, {
      sigVerify: false,
      replaceRecentBlockhash: true,
    });

    const simResult = simulation.value;

    return {
      success: simResult.err === null,
      error: simResult.err ? JSON.stringify(simResult.err) : undefined,
      logs: simResult.logs || [],
      unitsConsumed: simResult.unitsConsumed,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Simulation failed",
      logs: [],
    };
  }
}
