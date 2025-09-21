import { create } from 'zustand';
import { SPTransAPISimple } from '../services/sptrans-api';
import type { BusPosition, BusLine } from '../types/bus';
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

  // Actions
  fetchBuses: (lineCode: string) => Promise<void>;
  searchLines: (searchTerm: string) => Promise<void>;
  updateBusPosition: (busId: string, position: BusPosition) => void;
  selectLine: (lineCode: string) => void;
  clearError: () => void;
  clearBuses: () => void;
  clearLines: () => void;
  startAutoRefresh: (lineCode: string) => void;
  stopAutoRefresh: () => void;
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


  searchLines: async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      set({ lines: [] });
      return;
    }

    try {
      const lines = await sptransAPI.searchBusLines(searchTerm.trim());
      set({ lines });
    } catch (error) {
      console.error(`Failed to search lines for "${searchTerm}":`, error);
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

  clearLines: () => {
    set({ lines: [] });
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

}));