"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { truncateAddress } from "@/lib/titan/formatters";
import { Code2, Copy, Check } from "lucide-react";
import bs58 from "bs58";

interface TxInspectorProps {
  route: any;
}

// Helper to convert Uint8Array to base58 string
function toBase58(value: any): string {
  if (typeof value === "string") return value;
  if (value instanceof Uint8Array) return bs58.encode(value);
  if (Array.isArray(value)) return bs58.encode(new Uint8Array(value));
  return String(value);
}

// Clickable address component that opens in Solscan with copy button
function CopyableAddress({ address, className = "" }: { address: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleOpenSolscan = () => {
    window.open(`https://solscan.io/account/${address}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <button
        onClick={handleOpenSolscan}
        className="hover:text-primary hover:underline transition-colors cursor-pointer"
        title={`${address} - Click to open in Solscan`}
      >
        {truncateAddress(address)}
      </button>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 hover:text-primary transition-all p-0.5"
        title="Copy address"
      >
        {copied ? (
          <Check className="h-3 w-3 text-primary" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}

export function TxInspector({ route }: TxInspectorProps) {
  if (!route || !route.swapInfo) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            <CardTitle className="text-lg">Transaction Inspector</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Transaction details will appear here when a route with transaction info is selected
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { swapInfo } = route;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5" />
          <CardTitle className="text-lg">Transaction Inspector</CardTitle>
        </div>
        <CardDescription className="text-xs">Decoded transaction instructions and accounts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Instructions</h4>
          {swapInfo.instructions?.map((ix: any, idx: number) => {
            // API format: { p: programId, a: accounts, d: data }
            const programId = ix.p || ix.programId;
            const accounts = ix.a || ix.accounts || [];

            const programIdBase58 = toBase58(programId);

            return (
              <div key={idx} className="p-3 rounded-lg border bg-muted/50 font-mono text-xs">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">Instruction {idx + 1}</Badge>
                  {programId && (
                    <div className="group text-muted-foreground">
                      <CopyableAddress address={programIdBase58} />
                    </div>
                  )}
                </div>
                {accounts && accounts.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-muted-foreground">Accounts ({accounts.length}):</div>
                    {accounts.slice(0, 5).map((acc: any, aIdx: number) => {
                      // API format: { p: pubkey, s: isSigner, w: isWritable }
                      const pubkey = acc.p || acc.pubkey || acc;
                      const isSigner = acc.s ?? acc.isSigner ?? false;
                      const isWritable = acc.w ?? acc.isWritable ?? false;
                      const pubkeyBase58 = toBase58(pubkey);

                      return (
                        <div key={aIdx} className="pl-2 flex items-center gap-2 group">
                          <span className="text-muted-foreground">{aIdx}:</span>
                          <CopyableAddress address={pubkeyBase58} />
                          {isSigner && <Badge variant="secondary" className="text-xs">signer</Badge>}
                          {isWritable && <Badge variant="secondary" className="text-xs">writable</Badge>}
                        </div>
                      );
                    })}
                    {accounts.length > 5 && (
                      <div className="pl-2 text-muted-foreground">
                        ... and {accounts.length - 5} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {swapInfo.addressLookupTableAddresses && swapInfo.addressLookupTableAddresses.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Address Lookup Tables</h4>
            <div className="p-3 rounded-lg border bg-muted/50 font-mono text-xs space-y-1">
              {swapInfo.addressLookupTableAddresses.map((addr: any, idx: number) => {
                const addressBase58 = toBase58(addr);
                return (
                  <div key={idx} className="group">
                    <CopyableAddress address={addressBase58} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
