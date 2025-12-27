"use client";

import { create } from "zustand";
import type { ProtocolLogEntry } from "@/lib/titan/types";

interface LogStore {
  logs: ProtocolLogEntry[];
  addLog: (entry: Omit<ProtocolLogEntry, "timestamp">) => void;
  clearLogs: () => void;
  filterType: "all" | "errors" | "streams" | "requests";
  setFilterType: (type: "all" | "errors" | "streams" | "requests") => void;
}

export const useLogStore = create<LogStore>((set) => ({
  logs: [],
  filterType: "all",

  addLog: (entry) =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          ...entry,
          timestamp: Date.now(),
        },
      ],
    })),

  clearLogs: () => set({ logs: [] }),

  setFilterType: (type) => set({ filterType: type }),
}));

/**
 * Hook to get filtered logs
 */
export function useFilteredLogs() {
  const logs = useLogStore((state) => state.logs);
  const filterType = useLogStore((state) => state.filterType);

  if (filterType === "all") return logs;

  return logs.filter((log) => {
    switch (filterType) {
      case "errors":
        return log.type === "error";
      case "streams":
        return ["stream_start", "stream_data", "stream_end"].includes(log.type);
      case "requests":
        return log.type === "request";
      default:
        return true;
    }
  });
}
