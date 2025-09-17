import { create } from 'zustand';
import { SPTransAPISimple } from '../services/sptrans-api';
import type { BusPosition, BusLine } from '../types/bus';
import type { SearchSuggestion } from '../types/api';
import { API_CONFIG } from '../constants/api';

interface BusStore {
  // State
  buses: Map<string, BusPosition>;
  selectedLine: string | null;
  lines: BusLine[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refreshInterval: NodeJS.Timeout | null;
  suggestions: SearchSuggestion[];

  // Actions
  fetchBuses: (lineCode: string) => Promise<void>;
  fetchLines: (searchTerm?: string) => Promise<void>;
  searchLines: (searchTerm: string) => Promise<void>;
  updateBusPosition: (busId: string, position: BusPosition) => void;
  selectLine: (lineCode: string) => void;
  clearError: () => void;
  clearBuses: () => void;
  startAutoRefresh: (lineCode: string) => void;
  stopAutoRefresh: () => void;
  getSuggestionsForSearch: (query: string) => SearchSuggestion[];
}

const sptransAPI = new SPTransAPISimple();

export const useBusStore = create<BusStore>((set, get) => ({
  // Initial state
  buses: new Map(),
  selectedLine: null,
  lines: [],
  isLoading: false,
  error: null,
  lastUpdate: null,
  refreshInterval: null,
  suggestions: [],

  fetchBuses: async (lineCode: string) => {
    set({ isLoading: true, error: null });

    try {
      const buses = await sptransAPI.fetchBusPositions(lineCode);
      const busMap = new Map(buses.map(bus => [bus.id, bus]));

      set({
        buses: busMap,
        selectedLine: lineCode,
        isLoading: false,
        lastUpdate: new Date(),
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch buses',
        isLoading: false,
      });
    }
  },

  fetchLines: async (searchTerm?: string) => {
    set({ isLoading: true, error: null });

    try {
      const lines = await sptransAPI.fetchBusLines(searchTerm);
      set({
        lines,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch lines',
        isLoading: false,
      });
    }
  },

  searchLines: async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      console.log(`🔍 Empty search term, clearing lines`);
      set({ lines: [] });
      return;
    }

    console.log(`🏪 Store: Starting search for "${searchTerm}"`);

    try {
      const lines = await sptransAPI.searchBusLines(searchTerm);
      console.log(`🏪 Store: Received ${lines.length} lines from API`);
      console.log(`🏪 Store: Setting lines in store:`, JSON.stringify(lines, null, 2));
      set({ lines });
    } catch (error) {
      console.error(`🏪 Store: Failed to search lines for "${searchTerm}":`, error);
      set({ lines: [] });
    }
  },

  updateBusPosition: (busId: string, position: BusPosition) => {
    const { buses } = get();
    const newBuses = new Map(buses);
    newBuses.set(busId, position);
    set({ buses: newBuses, lastUpdate: new Date() });
  },

  selectLine: (lineCode: string) => {
    set({ selectedLine: lineCode });
  },

  clearError: () => {
    set({ error: null });
  },

  clearBuses: () => {
    set({ buses: new Map(), selectedLine: null, lastUpdate: null });
  },

  startAutoRefresh: (lineCode: string) => {
    const { stopAutoRefresh, fetchBuses } = get();

    // Clear any existing interval
    stopAutoRefresh();

    // Start new interval
    const interval = setInterval(() => {
      fetchBuses(lineCode);
    }, API_CONFIG.REFRESH_INTERVAL);

    set({ refreshInterval: interval });
  },

  stopAutoRefresh: () => {
    const { refreshInterval } = get();
    if (refreshInterval) {
      clearInterval(refreshInterval);
      set({ refreshInterval: null });
    }
  },

  getSuggestionsForSearch: (query: string): SearchSuggestion[] => {
    const { suggestions, lines } = get();

    console.log(`💡 Getting suggestions for query: "${query}"`);
    console.log(`💡 Available lines in store: ${lines.length}`);

    if (!query.trim()) {
      console.log(`💡 No query, returning empty suggestions`);
      return [];
    }

    const queryLower = query.toLowerCase();

    // Add from real API lines
    const matchingLines = lines
      .filter(line =>
        line.code.toLowerCase().includes(queryLower) ||
        line.name.toLowerCase().includes(queryLower)
      )
      .map(line => ({
        lineCode: line.code,
        lineName: line.name,
      }))
      .slice(0, 8); // Limit to 8 results from API

    console.log(`💡 Found ${matchingLines.length} matching lines from API`);
    console.log(`💡 API lines:`, JSON.stringify(matchingLines, null, 2));

    console.log(`💡 Final ${matchingLines.length} suggestions from API:`, JSON.stringify(matchingLines, null, 2));

    return matchingLines.slice(0, 8);
  },
}));