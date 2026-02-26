"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useComparisonStore } from "@/hooks/use-comparison-store";
import { Trophy, RotateCcw, BarChart3 } from "lucide-react";

function getProviderColor(name: string) {
  switch (name.toLowerCase()) {
    case "jupiter": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "okx": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "dflow": return "bg-green-500/10 text-green-600 border-green-500/20";
    case "titan": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
  }
}

export function QuoteComparison() {
  const { providers, updateCount, reset } = useComparisonStore();
  const providerList = Object.values(providers).sort((a, b) => b.winCount - a.winCount);

  if (providerList.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle className="text-lg">Quote Comparison</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Start a stream to compare provider performance
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalWins = providerList.reduce((a, b) => a + b.winCount, 0);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">Quote Comparison</CardTitle>
              <CardDescription className="text-xs">
                {updateCount} updates, {providerList.length} providers
              </CardDescription>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={reset}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {providerList.map((provider, idx) => {
          const winPct = totalWins > 0 ? ((provider.winCount / totalWins) * 100).toFixed(1) : "0";
          return (
            <div key={provider.name} className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {idx === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                  <Badge variant="outline" className={getProviderColor(provider.name)}>
                    {provider.name.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{provider.winCount} wins</span>
                  <span className="text-xs text-muted-foreground">({winPct}%)</span>
                </div>
              </div>

              {/* Win percentage bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${winPct}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Quotes</div>
                  <div className="font-mono">{provider.totalQuotes}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Avg Steps</div>
                  <div className="font-mono">{provider.avgSteps.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last Output</div>
                  <div className="font-mono">{provider.lastOutAmount > 0 ? provider.lastOutAmount.toLocaleString() : "--"}</div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Price difference matrix */}
        {providerList.length >= 2 && (
          <div className="pt-2 border-t space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Last Output Spread</h4>
            <div className="space-y-1">
              {providerList.slice(1).map((provider) => {
                const best = providerList[0];
                const diff = best.lastOutAmount - provider.lastOutAmount;
                const diffPct = best.lastOutAmount > 0 ? ((diff / best.lastOutAmount) * 100).toFixed(3) : "0";
                return (
                  <div key={provider.name} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {best.name} vs {provider.name}
                    </span>
                    <span className="font-mono text-green-600">+{diffPct}%</span>
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
