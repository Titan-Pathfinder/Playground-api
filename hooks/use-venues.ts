"use client";

import { useState, useCallback, useRef } from "react";
import type { TitanClient, Venue, Provider } from "@/lib/titan/native-types";
import { mergeServerVenues, type MergedVenue } from "@/lib/constants/venues";

interface VenuesState {
  venues: MergedVenue[];
  providers: Provider[];
  loading: boolean;
  error?: string;
  lastFetched?: number;
}

export function useVenues(client: TitanClient | null) {
  const [state, setState] = useState<VenuesState>({
    venues: [],
    providers: [],
    loading: false,
  });
  const cacheRef = useRef<{ venues: MergedVenue[]; providers: Provider[] } | null>(null);

  const fetchVenues = useCallback(async () => {
    if (!client) return;

    // Use cache if fresh (< 60s)
    if (cacheRef.current && state.lastFetched && Date.now() - state.lastFetched < 60000) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      const [venuesRes, providersRes] = await Promise.all([
        client.getVenues(),
        client.listProviders(),
      ]);

      const merged = mergeServerVenues(venuesRes.venues || []);
      const providers = providersRes.providers || [];

      cacheRef.current = { venues: merged, providers };
      setState({
        venues: merged,
        providers,
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to fetch venues",
      }));
    }
  }, [client, state.lastFetched]);

  return { ...state, fetchVenues };
}
