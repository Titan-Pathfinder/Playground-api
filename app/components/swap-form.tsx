"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COMMON_MINTS, getTokenInfo, uiAmountToRaw } from "@/lib/constants/mints";
import { Copy, Check, Upload } from "lucide-react";
import type { SwapMode } from "@/lib/titan/native-types";

export interface SwapFormParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  userPublicKey: string;
  slippageBps: number;
  swapMode: SwapMode;
  onlyDirectRoutes: boolean;
  intervalMs: number;
  numQuotes: number;
}

interface SwapFormProps {
  onRequestChange: (params: SwapFormParams) => void;
  disabled?: boolean;
}

export function SwapForm({ onRequestChange, disabled }: SwapFormProps) {
  const [inputMint, setInputMint] = useState<string>(COMMON_MINTS.SOL);
  const [outputMint, setOutputMint] = useState<string>(COMMON_MINTS.USDC);
  const [customInputMint, setCustomInputMint] = useState("");
  const [customOutputMint, setCustomOutputMint] = useState("");
  const [customInputDecimals, setCustomInputDecimals] = useState("9");
  const [customOutputDecimals, setCustomOutputDecimals] = useState("9");
  const [uiAmount, setUiAmount] = useState("1"); // UI amount (e.g., 1 SOL)
  const [userPublicKey, setUserPublicKey] = useState("GjphYQvBcDacc51fJFwk5Hf4X9JwN7SXpqw8vXfJk9gL");
  const [slippageBps, setSlippageBps] = useState("50"); // 0.5%
  const [onlyDirectRoutes, setOnlyDirectRoutes] = useState(false);
  const [intervalMs, setIntervalMs] = useState("1000");
  const [numQuotes, setNumQuotes] = useState("3");
  const [copied, setCopied] = useState(false);

  // Update parent whenever form changes
  const updateRequest = () => {
    const actualInputMint = inputMint === "custom" ? customInputMint : inputMint;
    const actualOutputMint = outputMint === "custom" ? customOutputMint : outputMint;

    const inputTokenInfo = getTokenInfo(actualInputMint);
    const decimals = inputMint === "custom"
      ? parseInt(customInputDecimals) || 9
      : inputTokenInfo?.decimals || 9;
    const rawAmount = uiAmountToRaw(parseFloat(uiAmount) || 0, decimals);

    const params: SwapFormParams = {
      inputMint: actualInputMint,
      outputMint: actualOutputMint,
      amount: rawAmount,
      userPublicKey,
      slippageBps: parseInt(slippageBps),
      swapMode: "ExactIn", // Always use ExactIn mode
      onlyDirectRoutes,
      intervalMs: parseInt(intervalMs),
      numQuotes: parseInt(numQuotes),
    };
    onRequestChange(params);
  };

  const copyConfig = async () => {
    const config = {
      inputMint: inputMint === "custom" ? customInputMint : inputMint,
      outputMint: outputMint === "custom" ? customOutputMint : outputMint,
      customInputDecimals: inputMint === "custom" ? parseInt(customInputDecimals) : undefined,
      customOutputDecimals: outputMint === "custom" ? parseInt(customOutputDecimals) : undefined,
      amount: uiAmount,
      userPublicKey,
      slippageBps,
      onlyDirectRoutes,
      intervalMs,
      numQuotes,
    };
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pasteConfig = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const config = JSON.parse(text);

      // Check if it's a custom token
      const isInputCustom = !Object.values(COMMON_MINTS).includes(config.inputMint);
      const isOutputCustom = !Object.values(COMMON_MINTS).includes(config.outputMint);

      if (isInputCustom) {
        setInputMint("custom");
        setCustomInputMint(config.inputMint);
        if (config.customInputDecimals !== undefined) {
          setCustomInputDecimals(config.customInputDecimals.toString());
        }
      } else {
        setInputMint(config.inputMint);
      }

      if (isOutputCustom) {
        setOutputMint("custom");
        setCustomOutputMint(config.outputMint);
        if (config.customOutputDecimals !== undefined) {
          setCustomOutputDecimals(config.customOutputDecimals.toString());
        }
      } else {
        setOutputMint(config.outputMint);
      }

      setUiAmount(config.amount);
      setUserPublicKey(config.userPublicKey);
      setSlippageBps(config.slippageBps);
      setOnlyDirectRoutes(config.onlyDirectRoutes);
      setIntervalMs(config.intervalMs);
      setNumQuotes(config.numQuotes);
    } catch (e) {
      console.error("Failed to paste config:", e);
    }
  };

  // Update parent whenever form fields change
  useEffect(() => {
    updateRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    inputMint,
    outputMint,
    customInputMint,
    customOutputMint,
    customInputDecimals,
    customOutputDecimals,
    uiAmount,
    userPublicKey,
    slippageBps,
    onlyDirectRoutes,
    intervalMs,
    numQuotes,
  ]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Swap Configuration</CardTitle>
            <CardDescription className="text-xs">Configure your swap quote request</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={pasteConfig}
              variant="outline"
              size="sm"
              disabled={disabled}
              title="Paste config from clipboard"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              onClick={copyConfig}
              variant="outline"
              size="sm"
              disabled={disabled}
              title="Copy config to clipboard"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="input-mint">Input Mint</Label>
            <Select
              value={inputMint}
              onValueChange={setInputMint}
              disabled={disabled}
            >
              <SelectTrigger id="input-mint">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={COMMON_MINTS.SOL}>SOL</SelectItem>
                <SelectItem value={COMMON_MINTS.USDC}>USDC</SelectItem>
                <SelectItem value={COMMON_MINTS.USDT}>USDT</SelectItem>
                <SelectItem value={COMMON_MINTS.BONK}>BONK</SelectItem>
                <SelectItem value={COMMON_MINTS.JUP}>JUP</SelectItem>
                <SelectItem value={COMMON_MINTS.WIF}>WIF</SelectItem>
                <SelectItem value="custom">Custom Token</SelectItem>
              </SelectContent>
            </Select>
            {inputMint === "custom" && (
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter token address"
                  value={customInputMint}
                  onChange={(e) => setCustomInputMint(e.target.value)}
                  disabled={disabled}
                  className="font-mono text-xs"
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="input-decimals" className="text-xs whitespace-nowrap">
                    Decimals:
                  </Label>
                  <Input
                    id="input-decimals"
                    type="number"
                    placeholder="9"
                    value={customInputDecimals}
                    onChange={(e) => setCustomInputDecimals(e.target.value)}
                    disabled={disabled}
                    className="text-xs"
                    min="0"
                    max="18"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="output-mint">Output Mint</Label>
            <Select
              value={outputMint}
              onValueChange={setOutputMint}
              disabled={disabled}
            >
              <SelectTrigger id="output-mint">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={COMMON_MINTS.SOL}>SOL</SelectItem>
                <SelectItem value={COMMON_MINTS.USDC}>USDC</SelectItem>
                <SelectItem value={COMMON_MINTS.USDT}>USDT</SelectItem>
                <SelectItem value={COMMON_MINTS.BONK}>BONK</SelectItem>
                <SelectItem value={COMMON_MINTS.JUP}>JUP</SelectItem>
                <SelectItem value={COMMON_MINTS.WIF}>WIF</SelectItem>
                <SelectItem value="custom">Custom Token</SelectItem>
              </SelectContent>
            </Select>
            {outputMint === "custom" && (
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter token address"
                  value={customOutputMint}
                  onChange={(e) => setCustomOutputMint(e.target.value)}
                  disabled={disabled}
                  className="font-mono text-xs"
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="output-decimals" className="text-xs whitespace-nowrap">
                    Decimals:
                  </Label>
                  <Input
                    id="output-decimals"
                    type="number"
                    placeholder="9"
                    value={customOutputDecimals}
                    onChange={(e) => setCustomOutputDecimals(e.target.value)}
                    disabled={disabled}
                    className="text-xs"
                    min="0"
                    max="18"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-pubkey">
            User Public Key
            <span className="ml-2 text-xs text-muted-foreground">
              Your Solana wallet address
            </span>
          </Label>
          <Input
            id="user-pubkey"
            type="text"
            placeholder="Enter your Solana public key"
            value={userPublicKey}
            onChange={(e) => setUserPublicKey(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">
            Amount
            <span className="ml-2 text-xs text-muted-foreground">
              {getTokenInfo(inputMint === "custom" ? customInputMint : inputMint)?.symbol || "Token"} to swap
            </span>
          </Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              step="any"
              placeholder="1.0"
              value={uiAmount}
              onChange={(e) => setUiAmount(e.target.value)}
              disabled={disabled}
              className="pr-16"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              {getTokenInfo(inputMint === "custom" ? customInputMint : inputMint)?.symbol || ""}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {uiAmount && !isNaN(parseFloat(uiAmount)) ? (() => {
              const decimals = inputMint === "custom"
                ? parseInt(customInputDecimals) || 9
                : getTokenInfo(inputMint === "custom" ? customInputMint : inputMint)?.decimals || 9;
              return `≈ ${uiAmountToRaw(parseFloat(uiAmount), decimals).toLocaleString()} raw units (${decimals} decimals)`;
            })() : "Enter amount above"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slippage">
            Slippage (bps)
            <span className="ml-2 text-xs text-muted-foreground">
              50 = 0.5%
            </span>
          </Label>
          <Input
            id="slippage"
            type="number"
            placeholder="50"
            value={slippageBps}
            onChange={(e) => setSlippageBps(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label>Update Config</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interval" className="text-xs">
                Interval (ms)
              </Label>
              <Input
                id="interval"
                type="number"
                placeholder="1000"
                value={intervalMs}
                onChange={(e) => setIntervalMs(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="num-quotes" className="text-xs">
                Number of Quotes
              </Label>
              <Input
                id="num-quotes"
                type="number"
                placeholder="3"
                value={numQuotes}
                onChange={(e) => setNumQuotes(e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="only-direct"
            checked={onlyDirectRoutes}
            onChange={(e) => setOnlyDirectRoutes(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="only-direct" className="text-sm font-normal cursor-pointer">
            Only direct routes
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
