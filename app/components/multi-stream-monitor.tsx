"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StreamConfigMini } from "./stream-config-mini";
import { useMultiStream } from "@/hooks/use-multi-stream";
import type { TitanClient } from "@/lib/titan/native-types";
import { Play, Square, Plus, X, Loader2 } from "lucide-react";
import { formatRawAmount, getTokenInfo } from "@/lib/constants/mints";

interface MultiStreamMonitorProps {
  client: TitanClient | null;
  isConnected: boolean;
}

export function MultiStreamMonitor({ client, isConnected }: MultiStreamMonitorProps) {
  const { slots, updateSlotConfig, startSlotStream, stopSlotStream, addSlot, removeSlot } =
    useMultiStream(client);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Multi-Stream Monitor</h2>
          <p className="text-sm text-muted-foreground">
            Compare multiple token pairs side-by-side in real time
          </p>
        </div>
        {slots.length < 3 && (
          <Button onClick={addSlot} variant="outline" size="sm" disabled={!isConnected}>
            <Plus className="h-4 w-4 mr-1" />
            Add Stream
          </Button>
        )}
      </div>

      {!isConnected && (
        <div className="text-center text-muted-foreground py-12 border rounded-lg">
          Connect to the API first to use Multi-Stream Monitor
        </div>
      )}

      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots.map((slot) => {
            const inputInfo = getTokenInfo(slot.config.inputMint);
            const outputInfo = getTokenInfo(slot.config.outputMint);
            const inputSymbol = inputInfo?.symbol || slot.config.inputMint.slice(0, 4) + "..";
            const outputSymbol = outputInfo?.symbol || slot.config.outputMint.slice(0, 4) + "..";
            const outputDecimals = outputInfo?.decimals || 6;
            const inputDecimals = inputInfo?.decimals || 9;

            return (
              <Card key={slot.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">
                        Stream #{slot.id}: {inputSymbol} → {outputSymbol}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {slot.isActive ? (
                          <span className="text-green-500">Seq: {slot.sequenceNumber}</span>
                        ) : (
                          "Stopped"
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      {slot.isActive ? (
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-gray-400" />
                      )}
                      {slots.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeSlot(slot.id)}
                          className="h-6 w-6 p-0"
                          disabled={slot.isActive}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <StreamConfigMini
                    config={slot.config}
                    onChange={(update) => updateSlotConfig(slot.id, update)}
                    disabled={slot.isActive}
                  />

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => startSlotStream(slot.id)}
                      disabled={slot.isActive || !isConnected}
                    >
                      {slot.isActive ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3 mr-1" />
                      )}
                      Start
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => stopSlotStream(slot.id)}
                      disabled={!slot.isActive}
                    >
                      <Square className="h-3 w-3 mr-1" />
                      Stop
                    </Button>
                  </div>

                  {slot.error && (
                    <div className="text-xs text-destructive bg-destructive/10 rounded p-2">
                      {slot.error}
                    </div>
                  )}

                  {/* Routes */}
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {slot.routes.length === 0 && !slot.isActive && (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        No quotes yet
                      </div>
                    )}
                    {slot.routes.map((route: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2 rounded border text-xs ${
                          idx === 0
                            ? "border-primary/50 bg-primary/5"
                            : "border-border/30 bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {idx === 0 && (
                              <Badge variant="default" className="text-[10px] h-4 px-1">
                                Best
                              </Badge>
                            )}
                            <span className="font-medium">{route.provider}</span>
                          </div>
                          <span className="font-mono">
                            {formatRawAmount(route.outAmount, outputDecimals)} {outputSymbol}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
