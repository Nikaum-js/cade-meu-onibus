import { create } from 'zustand';
import { SPTransAPISimple } from '../services/sptrans-api';
import type { BusPosition, BusLine } from '../types/bus';
import type { SearchSuggestion } from '../types/api';

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
  suggestions: [
    { lineCode: '6824-10', lineName: 'Lapa - Pirituba', popular: true },
    { lineCode: '701U-10', lineName: 'Terminal São Miguel - Metrô Tucuruvi', popular: true },
    { lineCode: '2029-10', lineName: 'Capão Redondo - Metrô Giovanni Gronchi', popular: true },
    { lineCode: '177A-10', lineName: 'Terminal Pirituba - Shopping Eldorado', popular: true },
    { lineCode: '175R-10', lineName: 'Jardim Rincão - Terminal Pirituba', popular: true },
  ],

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
      set({ lines: [] });
      return;
    }

    try {
      const lines = await sptransAPI.searchBusLines(searchTerm);
      set({ lines });
    } catch (error) {
      console.error('Failed to search lines:', error);
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
    }, 30000); // 30 seconds

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

    if (!query.trim()) {
      return suggestions.filter(s => s.popular);
    }

    const queryLower = query.toLowerCase();

    // Filter from pre-defined suggestions first
    const matchingSuggestions = suggestions.filter(
      s => s.lineCode.toLowerCase().includes(queryLower) ||
           s.lineName.toLowerCase().includes(queryLower)
    );

    // Add from real API lines
    const matchingLines = lines
      .filter(line =>
        line.code.toLowerCase().includes(queryLower) ||
        line.name.toLowerCase().includes(queryLower)
      )
      .map(line => ({
        lineCode: line.code,
        lineName: line.name,
        popular: false,
      }))
      .slice(0, 8); // Limit to 8 results from API

    // Combine and remove duplicates
    const allSuggestions = [...matchingSuggestions, ...matchingLines];
    const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.lineCode === suggestion.lineCode)
    );

    return uniqueSuggestions.slice(0, 8);
  },
}));