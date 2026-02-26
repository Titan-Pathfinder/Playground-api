"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAmount, formatBps, truncateAddress } from "@/lib/titan/formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTokenInfo, formatRawAmount } from "@/lib/constants/mints";
import { AlertTriangle, CheckCircle, ArrowRight, DollarSign } from "lucide-react";
import { useMemo } from "react";

interface RouteDetailsProps {
  route: any;
  routeIndex: number;
}

export function RouteDetails({ route, routeIndex }: RouteDetailsProps) {
  // Calculate total fees - moved before early return to avoid hook rule violation
  const totalFees = useMemo(() => {
    if (!route?.marketInfos) return { lpFees: 0, platformFees: 0 };
    
    let lpFees = 0;
    let platformFees = 0;
    
    route.marketInfos.forEach((market: any) => {
      if (market.lpFee?.pct) lpFees += market.lpFee.pct;
      if (market.platformFee?.pct) platformFees += market.platformFee.pct;
    });
    
    return { lpFees, platformFees };
  }, [route?.marketInfos]);

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

  // Calculate price impact
  const priceImpact = route.priceImpactPct || 0;
  const priceImpactSeverity = priceImpact > 5 ? 'high' : priceImpact > 1 ? 'medium' : 'low';

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
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="hops">Hops</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">Input Amount</div>
                <div className="text-lg font-mono font-semibold">{formatAmount(route.inAmount, 9)}</div>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">Output Amount</div>
                <div className="text-lg font-mono font-semibold text-primary">{formatAmount(route.outAmount, 6)}</div>
              </div>
            </div>

            {priceImpact > 0 && (
              <div className={`p-3 rounded-lg border ${
                priceImpactSeverity === 'high' ? 'border-red-500/30 bg-red-500/10' :
                priceImpactSeverity === 'medium' ? 'border-yellow-500/30 bg-yellow-500/10' :
                'border-green-500/30 bg-green-500/10'
              }`}>
                <div className="flex items-center gap-2">
                  {priceImpactSeverity === 'high' ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-sm font-medium">Price Impact</span>
                  <Badge 
                    variant="outline" 
                    className={
                      priceImpactSeverity === 'high' ? 'border-red-500 text-red-600' :
                      priceImpactSeverity === 'medium' ? 'border-yellow-500 text-yellow-600' :
                      'border-green-500 text-green-600'
                    }
                  >
                    {priceImpact.toFixed(2)}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {priceImpactSeverity === 'high' ? 'High price impact - consider reducing amount' :
                   priceImpactSeverity === 'medium' ? 'Moderate price impact' :
                   'Low price impact'}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Provider</span>
                <span className="font-medium">{provider}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Number of Hops</span>
                <span className="font-medium">{route.marketInfos?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Route Efficiency</span>
                <span className="font-medium">
                  {route.marketInfos?.length === 1 ? 'Direct' : 'Multi-hop'}
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fees" className="space-y-3">
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Fee Breakdown</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">LP Fees</span>
                  <span className="font-mono">{totalFees.lpFees.toFixed(4)}%</span>
                </div>
                {totalFees.platformFees > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fees</span>
                    <span className="font-mono">{totalFees.platformFees.toFixed(4)}%</span>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total Fees</span>
                    <span className="font-mono">{(totalFees.lpFees + totalFees.platformFees).toFixed(4)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {route.marketInfos?.map((market: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">Hop {idx + 1}</Badge>
                  <span className="text-xs font-medium">{market.label}</span>
                </div>
                {market.lpFee?.pct > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">LP Fee</span>
                    <span>{market.lpFee.pct.toFixed(4)}%</span>
                  </div>
                )}
                {market.platformFee?.pct > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Platform Fee</span>
                    <span>{market.platformFee.pct.toFixed(4)}%</span>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="hops" className="space-y-3">
            {route.marketInfos?.map((market: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline">Hop {idx + 1}</Badge>
                  <Badge>{market.label}</Badge>
                </div>
                
                <div className="flex items-center gap-2 mb-3 text-sm">
                  <span className="font-mono">{formatAmount(market.inAmount, 6)}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-primary">{formatAmount(market.outAmount, 6)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Liquidity</div>
                    <div className={market.notEnoughLiquidity ? "text-red-500" : "text-green-500"}>
                      {market.notEnoughLiquidity ? "❌ Insufficient" : "✅ OK"}
                    </div>
                  </div>
                  {market.priceImpactPct > 0 && (
                    <div>
                      <div className="text-muted-foreground">Price Impact</div>
                      <div>{market.priceImpactPct.toFixed(4)}%</div>
                    </div>
                  )}
                </div>
              </div>
            )) || (
              <div className="text-center text-muted-foreground py-4 text-sm">
                No hop information available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
