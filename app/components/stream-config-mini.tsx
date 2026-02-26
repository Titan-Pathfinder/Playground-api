"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COMMON_MINTS } from "@/lib/constants/mints";
import type { StreamSlot } from "@/hooks/use-multi-stream";

interface StreamConfigMiniProps {
  config: StreamSlot["config"];
  onChange: (update: Partial<StreamSlot["config"]>) => void;
  disabled?: boolean;
}

export function StreamConfigMini({ config, onChange, disabled }: StreamConfigMiniProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Input</Label>
          <Select
            value={config.inputMint}
            onValueChange={(v) => onChange({ inputMint: v })}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={COMMON_MINTS.SOL}>SOL</SelectItem>
              <SelectItem value={COMMON_MINTS.USDC}>USDC</SelectItem>
              <SelectItem value={COMMON_MINTS.USDT}>USDT</SelectItem>
              <SelectItem value={COMMON_MINTS.BONK}>BONK</SelectItem>
              <SelectItem value={COMMON_MINTS.JUP}>JUP</SelectItem>
              <SelectItem value={COMMON_MINTS.WIF}>WIF</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Output</Label>
          <Select
            value={config.outputMint}
            onValueChange={(v) => onChange({ outputMint: v })}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={COMMON_MINTS.SOL}>SOL</SelectItem>
              <SelectItem value={COMMON_MINTS.USDC}>USDC</SelectItem>
              <SelectItem value={COMMON_MINTS.USDT}>USDT</SelectItem>
              <SelectItem value={COMMON_MINTS.BONK}>BONK</SelectItem>
              <SelectItem value={COMMON_MINTS.JUP}>JUP</SelectItem>
              <SelectItem value={COMMON_MINTS.WIF}>WIF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Amount</Label>
          <Input
            className="h-8 text-xs"
            type="number"
            step="any"
            value={config.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div>
          <Label className="text-xs">Interval (ms)</Label>
          <Input
            className="h-8 text-xs"
            type="number"
            value={config.intervalMs}
            onChange={(e) => onChange({ intervalMs: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
