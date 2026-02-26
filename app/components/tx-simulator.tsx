"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { simulateTransaction, type SimulationResult } from "@/lib/solana/simulate";
import { Loader2, PlayCircle, CheckCircle2, XCircle, Cpu, AlertTriangle } from "lucide-react";

interface TxSimulatorProps {
  route: any;
  userPublicKey?: string;
}

const RPC_STORAGE_KEY = "titan-playground-rpc-url";

export function TxSimulator({ route, userPublicKey }: TxSimulatorProps) {
  const [rpcUrl, setRpcUrl] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(RPC_STORAGE_KEY);
    if (saved) setRpcUrl(saved);
  }, []);

  const saveRpcUrl = (url: string) => {
    setRpcUrl(url);
    localStorage.setItem(RPC_STORAGE_KEY, url);
  };

  const handleSimulate = async () => {
    if (!route?.swapInfo?.instructions || !rpcUrl || !userPublicKey) return;

    setSimulating(true);
    setResult(null);

    try {
      const res = await simulateTransaction(
        rpcUrl,
        route.swapInfo.instructions,
        route.swapInfo.addressLookupTableAddresses || [],
        userPublicKey
      );
      setResult(res);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Simulation failed",
        logs: [],
      });
    } finally {
      setSimulating(false);
    }
  };

  const hasInstructions = route?.swapInfo?.instructions?.length > 0;

  // Check if the error is AccountNotFound to show a helpful hint
  const isAccountNotFound = result?.error?.includes("AccountNotFound");

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          <div>
            <CardTitle className="text-lg">Transaction Simulator</CardTitle>
            <CardDescription className="text-xs">
              Simulate transactions against an RPC endpoint
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm">Solana RPC URL</Label>
          <Input
            type="text"
            placeholder="https://api.mainnet-beta.solana.com"
            value={rpcUrl}
            onChange={(e) => saveRpcUrl(e.target.value)}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Persisted to localStorage. Use a reliable RPC for accurate results.
          </p>
        </div>

        {!hasInstructions && (
          <div className="text-center text-muted-foreground py-4 text-sm border rounded-lg">
            Select a route with transaction data to simulate
          </div>
        )}

        {hasInstructions && (
          <>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                {route.swapInfo.instructions.length} instructions,{" "}
                {route.swapInfo.addressLookupTableAddresses?.length || 0} lookup tables
              </div>
              {userPublicKey && (
                <div className="font-mono truncate">
                  Payer: {userPublicKey}
                </div>
              )}
            </div>

            <Button
              onClick={handleSimulate}
              disabled={simulating || !rpcUrl || !userPublicKey}
              className="w-full"
            >
              {simulating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4 mr-2" />
              )}
              Simulate Transaction
            </Button>
          </>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <Badge className="bg-green-600">Success</Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <Badge variant="destructive">Failed</Badge>
                </>
              )}
            </div>

            {result.error && (
              <div className="p-2 rounded bg-destructive/10 border border-destructive/20 text-xs text-destructive font-mono">
                {result.error}
              </div>
            )}

            {isAccountNotFound && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-amber-800 dark:text-amber-400 space-y-1">
                  <p className="font-semibold">Why does this happen?</p>
                  <p>
                    The wallet address used as payer must exist on-chain with SOL balance and
                    the required token accounts. Use a <strong>real funded wallet address</strong> in
                    the &ldquo;User Public Key&rdquo; field of the Swap Configuration to get accurate simulation results.
                  </p>
                </div>
              </div>
            )}

            {result.unitsConsumed !== undefined && result.unitsConsumed > 0 && (
              <div className="p-2 rounded bg-muted/50 border">
                <div className="text-xs text-muted-foreground">Compute Units Consumed</div>
                <div className="text-lg font-mono font-semibold">
                  {result.unitsConsumed.toLocaleString()}
                </div>
              </div>
            )}

            {result.logs.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Logs ({result.logs.length})</h4>
                <div className="max-h-48 overflow-y-auto p-2 rounded bg-muted font-mono text-[10px] space-y-0.5">
                  {result.logs.map((log, idx) => (
                    <div
                      key={idx}
                      className={
                        log.includes("failed") || log.includes("Error")
                          ? "text-red-400"
                          : log.includes("success")
                          ? "text-green-400"
                          : "text-muted-foreground"
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
