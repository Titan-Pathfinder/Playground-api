"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAmount, formatBps, formatSlot } from "@/lib/titan/formatters";
import { getVenueName } from "@/lib/constants/venues";
import { getTokenInfo, formatRawAmount } from "@/lib/constants/mints";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Route {
  provider?: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct?: number;
  marketInfos?: Array<{
    id: string;
    label: string;
    inputMint: string;
    outputMint: string;
    notEnoughLiquidity: boolean;
    inAmount: string;
    outAmount: string;
    priceImpactPct: number;
    lpFee: {
      amount: string;
      mint: string;
      pct: number;
    };
    platformFee: {
      amount: string;
      mint: string;
      pct: number;
    };
  }>;
}

interface QuotesTableProps {
  routes: Route[];
  sequenceNumber: number;
  contextSlot: number;
  inputMint?: string;
  outputMint?: string;
  onSelectRoute?: (route: Route, index: number) => void;
}

export function QuotesTable({ routes, sequenceNumber, contextSlot, inputMint, outputMint, onSelectRoute }: QuotesTableProps) {
  const inputDecimals = inputMint ? (getTokenInfo(inputMint)?.decimals || 9) : 9;
  const outputDecimals = outputMint ? (getTokenInfo(outputMint)?.decimals || 6) : 6;
  const inputSymbol = inputMint ? (getTokenInfo(inputMint)?.symbol || "") : "";
  const outputSymbol = outputMint ? (getTokenInfo(outputMint)?.symbol || "") : "";
  if (routes.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Live Quotes</CardTitle>
          <CardDescription className="text-xs">No routes available yet. Start a stream to see quotes.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Live Quotes</CardTitle>
            <CardDescription className="text-xs">
              Seq: {sequenceNumber} | Slot: {formatSlot(contextSlot)}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">{routes.length} routes</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {routes.map((route, index) => {
            const isBest = index === 0;
            const hops = route.marketInfos?.length || 0;
            const provider = route.provider || "Unknown";

            // Provider badge colors
            const getProviderColor = (p: string) => {
              switch(p.toLowerCase()) {
                case 'jupiter': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
                case 'okx': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
                case 'dflow': return 'bg-green-500/10 text-green-600 border-green-500/20';
                case 'titan': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
                default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
              }
            };

            return (
              <div
                key={index}
                onClick={() => onSelectRoute?.(route, index)}
                className={`
                  p-4 rounded-lg border cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01]
                  ${isBest ? "border-primary/50 bg-primary/5 shadow-primary/10" : "border-border/50 bg-card/30 hover:bg-card/50"}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isBest && (
                      <Badge variant="default" className="bg-primary">
                        Best
                      </Badge>
                    )}
                    <Badge variant="outline" className={getProviderColor(provider)}>
                      {provider.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="border-border/50">{hops} {hops === 1 ? "hop" : "hops"}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Input</div>
                    <div className="font-mono font-semibold">
                      {formatRawAmount(route.inAmount, inputDecimals)} {inputSymbol}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Output</div>
                    <div className="font-mono font-semibold">
                      {formatRawAmount(route.outAmount, outputDecimals)} {outputSymbol}
                    </div>
                  </div>
                </div>

                {route.marketInfos && route.marketInfos.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex gap-1 flex-wrap">
                      {route.marketInfos.map((market, mIdx) => (
                        <Badge key={mIdx} variant="secondary" className="text-xs">
                          {market.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
