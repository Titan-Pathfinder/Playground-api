"use client";

import { V1Client } from "@titanexchange/sdk-ts";

/**
 * Create and connect to Titan WebSocket API
 *
 * @param jwt - JWT authentication token (optional)
 * @param wsUrl - WebSocket URL (without query params)
 * @returns Promise that resolves to connected V1Client
 */
export async function createTitanClient(jwt: string, wsUrl: string = "wss://v1.api.titan.ag"): Promise<V1Client> {
  // Add JWT as query parameter for authentication if provided
  const urlWithAuth = jwt ? `${wsUrl}?auth=${encodeURIComponent(jwt)}` : wsUrl;

  // Connect to the WebSocket
  const client = await V1Client.connect(urlWithAuth);

  return client;
}

/**
 * Check if JWT is valid (basic format check)
 */
export function isValidJWT(jwt: string): boolean {
  if (!jwt || typeof jwt !== "string") return false;
  const parts = jwt.split(".");
  return parts.length === 3;
}

// Re-export the V1Client type
export type { V1Client };
