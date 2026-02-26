"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateTypeScriptSnippet } from "@/lib/examples/ts-snippets";
import { generateRustSnippet } from "@/lib/examples/rust-snippets";
import { generatePythonSnippet } from "@/lib/examples/python-snippets";
import type { SwapQuoteRequest } from "@/lib/titan/native-types";
import { Copy, Check, Code2, Minimize2, Maximize2 } from "lucide-react";

interface CodeGeneratorProps {
  jwt: string;
  wsUrl: string;
  request: SwapQuoteRequest;
}

export function CodeGenerator({ jwt, wsUrl, request }: CodeGeneratorProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [minimal, setMinimal] = useState(false);
  const [lang, setLang] = useState("typescript");

  const tsCode = generateTypeScriptSnippet(jwt, wsUrl, request, { minimal });
  const rustCode = generateRustSnippet(jwt, wsUrl, request, { minimal });
  const pythonCode = generatePythonSnippet(jwt, wsUrl, request);

  const getCode = () => {
    switch (lang) {
      case "typescript": return tsCode;
      case "rust": return rustCode;
      case "python": return pythonCode;
      default: return tsCode;
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(getCode());
    setCopiedTab(lang);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">Code Generator</CardTitle>
              <CardDescription className="text-xs">
                Integration code with your current config
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMinimal(!minimal)}
              title={minimal ? "Full example" : "Minimal example"}
            >
              {minimal ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              <span className="ml-1 text-xs">{minimal ? "Full" : "Minimal"}</span>
            </Button>
            <Button size="sm" variant="outline" onClick={copyToClipboard}>
              {copiedTab === lang ? (
                <><Check className="h-3 w-3 mr-1" />Copied</>
              ) : (
                <><Copy className="h-3 w-3 mr-1" />Copy</>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={lang} onValueChange={setLang} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="typescript">TypeScript</TabsTrigger>
            <TabsTrigger value="rust">Rust</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
          </TabsList>

          <TabsContent value={lang} className="mt-3">
            <pre className="p-4 rounded-lg bg-muted overflow-x-auto text-xs max-h-96 overflow-y-auto">
              <code>{getCode()}</code>
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
