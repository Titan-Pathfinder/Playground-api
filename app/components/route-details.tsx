"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAmount, formatBps, truncateAddress } from "@/lib/titan/formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RouteDetailsProps {
  route: any;
  routeIndex: number;
}

export function RouteDetails({ route, routeIndex }: RouteDetailsProps) {
  if (!route) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Route Details</CardTitle>
          <CardDescription className="text-xs">Select a route from the table to view details</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const provider = route.provider || "Unknown";
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
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Route #{routeIndex + 1} Details</CardTitle>
            <CardDescription className="text-xs">Detailed breakdown of the selected route</CardDescription>
          </div>
          <Badge variant="outline" className={getProviderColor(provider)}>
            {provider.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="hops">Hops</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Input Amount</div>
                <div className="text-lg font-mono font-semibold">{formatAmount(route.inAmount, 9)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Output Amount</div>
                <div className="text-lg font-mono font-semibold">{formatAmount(route.outAmount, 6)}</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Provider</div>
              <div className="text-lg font-semibold">{provider}</div>
            </div>

            {route.marketInfos && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Number of Hops</div>
                <div className="text-lg font-semibold">{route.marketInfos.length}</div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="hops" className="space-y-3">
            {route.marketInfos?.map((market: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">Hop {idx + 1}</Badge>
                  <Badge>{market.label}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">In</div>
                    <div className="font-mono">{formatAmount(market.inAmount, 6)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Out</div>
                    <div className="font-mono">{formatAmount(market.outAmount, 6)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Liquidity OK</div>
                    <div>{market.notEnoughLiquidity ? "❌" : "✅"}</div>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="fees" className="space-y-3">
            {route.marketInfos?.map((market: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg border bg-muted/50">
                <div className="mb-2">
                  <Badge variant="outline">Hop {idx + 1}: {market.label}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  {market.lpFee && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">LP Fee</span>
                      <span className="font-mono">
                        {formatAmount(market.lpFee.amount, 6)} ({market.lpFee.pct.toFixed(4)}%)
                      </span>
                    </div>
                  )}
                  {market.platformFee && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform Fee</span>
                      <span className="font-mono">
                        {formatAmount(market.platformFee.amount, 6)} ({market.platformFee.pct.toFixed(4)}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
