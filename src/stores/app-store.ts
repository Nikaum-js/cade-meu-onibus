import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';
import type { AppState } from '../types';

interface AppStore extends AppState {
  // Additional state
  isDarkMode: boolean;
  searchQuery: string;

  // Actions
  setLoading: (isLoading: boolean) => void;
  setOffline: (isOffline: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  toggleTheme: () => void;
  updateSearchQuery: (query: string) => void;
  clearSearch: () => void;
  updateLastUpdate: () => void;
  initializeNetworkListener: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  isLoading: false,
  isOffline: false,
  lastUpdate: undefined,
  error: undefined,
  isDarkMode: false,
  searchQuery: '',

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setOffline: (isOffline: boolean) => {
    set({ isOffline });
  },

  setError: (error: string | null) => {
    set({ error: error || undefined });
  },

  clearError: () => {
    set({ error: undefined });
  },

  toggleTheme: () => {
    set(state => ({ isDarkMode: !state.isDarkMode }));
  },

  updateSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  clearSearch: () => {
    set({ searchQuery: '' });
  },

  updateLastUpdate: () => {
    set({ lastUpdate: new Date() });
  },

  initializeNetworkListener: () => {
    // Listen for network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const isOffline = !state.isConnected || !state.isInternetReachable;
      set({ isOffline });
    });

    // Return cleanup function
    return unsubscribe;
  },
}));