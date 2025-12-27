"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Square, Loader2, AlertCircle, Bug } from "lucide-react";

interface StreamControlsProps {
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
  onTriggerBug?: () => void; // For testing the SDK bug
  disabled?: boolean;
  error?: string;
}

export function StreamControls({ isActive, onStart, onStop, onTriggerBug, disabled, error }: StreamControlsProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Stream Controls</CardTitle>
        <CardDescription className="text-xs">Start or stop the swap quote stream</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-destructive">{error}</p>
          </div>
        )}
        <div className="flex gap-2">
        <Button
          onClick={onStart}
          disabled={disabled || isActive}
          className="flex-1"
          size="lg"
        >
          {isActive ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Play className="mr-2 h-5 w-5" />
          )}
          Start Stream
        </Button>
        <Button
          onClick={onStop}
          disabled={disabled || !isActive}
          variant="destructive"
          className="flex-1"
          size="lg"
        >
          <Square className="mr-2 h-5 w-5" />
          Stop Stream
        </Button>
        </div>
        {onTriggerBug && (
          <Button
            onClick={onTriggerBug}
            disabled={disabled}
            variant="outline"
            className="w-full border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
            size="sm"
          >
            <Bug className="mr-2 h-4 w-4" />
            Trigger SDK Bug (Test)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
