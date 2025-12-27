"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { generateTypeScriptSnippet } from "@/lib/examples/ts-snippets";
import { generateRustSnippet } from "@/lib/examples/rust-snippets";
import type { SwapQuoteRequest } from "@/lib/titan/native-types";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface CodeSnippetsProps {
  jwt: string;
  wsUrl: string;
  request: SwapQuoteRequest;
}

export function CodeSnippets({ jwt, wsUrl, request }: CodeSnippetsProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const tsCode = generateTypeScriptSnippet(jwt, wsUrl, request);
  const rustCode = generateRustSnippet(jwt, wsUrl, request);

  const copyToClipboard = async (code: string, tab: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Code Snippets</CardTitle>
        <CardDescription className="text-xs">
          Copy these code examples to integrate Titan API in your application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="typescript" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="typescript">TypeScript</TabsTrigger>
            <TabsTrigger value="rust">Rust</TabsTrigger>
          </TabsList>

          <TabsContent value="typescript" className="space-y-2">
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(tsCode, "typescript")}
              >
                {copiedTab === "typescript" ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="p-4 rounded-lg bg-muted overflow-x-auto text-xs">
              <code>{tsCode}</code>
            </pre>
          </TabsContent>

          <TabsContent value="rust" className="space-y-2">
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(rustCode, "rust")}
              >
                {copiedTab === "rust" ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="p-4 rounded-lg bg-muted overflow-x-auto text-xs">
              <code>{rustCode}</code>
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
