"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMetricsStore, computeMetrics } from "@/hooks/use-metrics-store";
import { Activity, Clock, Zap, MessageSquare, Timer, Radio } from "lucide-react";

function StatCard({ icon: Icon, label, value, unit }: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-lg font-mono font-semibold">
        {value}
        {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
      </div>
    </div>
  );
}

export function MetricsPanel() {
  const state = useMetricsStore();
  const [, forceUpdate] = useState(0);

  // Tick every second for uptime/freshness
  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const { avg, min, max, messageCount, uptimeMs, freshnessMs } = computeMetrics(state);

  const formatMs = (ms: number) => (ms < 1 ? "<1" : ms.toFixed(1));
  const formatUptime = (ms: number) => {
    if (ms === 0) return "--";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Performance
        </CardTitle>
        <CardDescription className="text-xs">
          Latency & throughput metrics (rolling {state.latencies.length > 0 ? state.latencies.length : 50} samples)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={Zap} label="Avg Latency" value={state.latencies.length > 0 ? formatMs(avg) : "--"} unit="ms" />
          <StatCard icon={Zap} label="Min Latency" value={state.latencies.length > 0 ? formatMs(min) : "--"} unit="ms" />
          <StatCard icon={Zap} label="Max Latency" value={state.latencies.length > 0 ? formatMs(max) : "--"} unit="ms" />
          <StatCard icon={MessageSquare} label="Messages" value={messageCount > 0 ? messageCount.toString() : "--"} />
          <StatCard icon={Clock} label="Uptime" value={formatUptime(uptimeMs)} />
          <StatCard icon={Radio} label="Freshness" value={state.lastQuoteAt ? `${(freshnessMs / 1000).toFixed(0)}` : "--"} unit={state.lastQuoteAt ? "s ago" : ""} />
        </div>
      </CardContent>
    </Card>
  );
}
