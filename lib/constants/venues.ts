// Known Solana DEX/AMM protocol names
export const KNOWN_VENUES: Record<string, string> = {
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc": "Orca Whirlpool",
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK": "Raydium CLMM",
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium AMM",
  "PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY": "Phoenix",
  "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX": "Serum",
};

export function getVenueName(programId: string): string {
  return KNOWN_VENUES[programId] || programId.slice(0, 8) + "...";
}

export interface MergedVenue {
  name: string;
  programId?: string;
  source: "static" | "server" | "both";
}

export function mergeServerVenues(serverVenues: { name: string; programId?: string }[]): MergedVenue[] {
  const merged = new Map<string, MergedVenue>();

  for (const [programId, name] of Object.entries(KNOWN_VENUES)) {
    merged.set(name, { name, programId, source: "static" });
  }

  for (const venue of serverVenues) {
    const existing = merged.get(venue.name);
    if (existing) {
      existing.source = "both";
      if (venue.programId) existing.programId = venue.programId;
    } else {
      merged.set(venue.name, { name: venue.name, programId: venue.programId, source: "server" });
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
}
