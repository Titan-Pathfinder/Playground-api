"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, RefreshCw, Search } from "lucide-react";
import type { TitanClient, Provider } from "@/lib/titan/native-types";
import type { MergedVenue } from "@/lib/constants/venues";
import { useVenues } from "@/hooks/use-venues";

interface VenuesExplorerProps {
  client: TitanClient | null;
  isConnected: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="p-1 hover:text-primary transition-colors" title="Copy">
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function VenuesExplorer({ client, isConnected }: VenuesExplorerProps) {
  const { venues, providers, loading, error, fetchVenues } = useVenues(client);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isConnected && client) {
      fetchVenues();
    }
  }, [isConnected, client, fetchVenues]);

  const filteredVenues = venues.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.programId && v.programId.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredProviders = providers.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Venues & Providers</CardTitle>
            <CardDescription className="text-xs">
              {venues.length} venues, {providers.length} providers
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchVenues}
            disabled={!isConnected || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search venues or providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded p-2">{error}</div>
        )}

        {!isConnected && (
          <div className="text-center text-muted-foreground py-4 text-sm">
            Connect to the API to view venues and providers
          </div>
        )}

        {isConnected && venues.length === 0 && !loading && (
          <div className="text-center text-muted-foreground py-4 text-sm">
            No venue data from server. Showing static venues only.
          </div>
        )}

        {/* Providers */}
        {filteredProviders.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Providers</h4>
            <div className="flex flex-wrap gap-2">
              {filteredProviders.map((p) => (
                <Badge key={p.name} variant="secondary">
                  {p.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Venues */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Venues (DEXes / AMMs)</h4>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {filteredVenues.map((venue) => (
              <div
                key={venue.name}
                className="flex items-center justify-between p-2 rounded border bg-muted/30 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium truncate">{venue.name}</span>
                  <Badge
                    variant="outline"
                    className={
                      venue.source === "both"
                        ? "text-green-600 border-green-500/30"
                        : venue.source === "server"
                        ? "text-blue-600 border-blue-500/30"
                        : "text-gray-500 border-gray-400/30"
                    }
                  >
                    {venue.source}
                  </Badge>
                </div>
                {venue.programId && (
                  <div className="flex items-center gap-1 font-mono text-muted-foreground shrink-0">
                    <span>{venue.programId.slice(0, 6)}...{venue.programId.slice(-4)}</span>
                    <CopyButton text={venue.programId} />
                  </div>
                )}
              </div>
            ))}
            {filteredVenues.length === 0 && search && (
              <div className="text-center text-muted-foreground py-2 text-sm">
                No venues matching &ldquo;{search}&rdquo;
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
