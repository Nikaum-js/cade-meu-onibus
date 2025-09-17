import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a React Query client with caching configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// AsyncStorage utility functions for search history
export const searchHistoryStorage = {
  key: 'search_history',

  async getHistory(): Promise<string[]> {
    try {
      const history = await AsyncStorage.getItem(this.key);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
    }
  },

  async addSearch(lineCode: string): Promise<void> {
    try {
      const history = await this.getHistory();

      // Remove if already exists to avoid duplicates
      const filteredHistory = history.filter(item => item !== lineCode);

      // Add to beginning of array
      const newHistory = [lineCode, ...filteredHistory].slice(0, 10); // Keep only last 10

      await AsyncStorage.setItem(this.key, JSON.stringify(newHistory));

      console.log(`📝 Added "${lineCode}" to search history`);
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  },

  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.key);
      console.log('🗑️ Search history cleared');
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  },

  async removeItem(lineCode: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const filteredHistory = history.filter(item => item !== lineCode);
      await AsyncStorage.setItem(this.key, JSON.stringify(filteredHistory));

      console.log(`🗑️ Removed "${lineCode}" from search history`);
    } catch (error) {
      console.error('Failed to remove from search history:', error);
    }
  },
};

// Query keys for React Query
export const queryKeys = {
  searchHistory: ['searchHistory'] as const,
  busLines: (searchTerm: string) => ['busLines', searchTerm] as const,
  busPositions: (lineCode: string) => ['busPositions', lineCode] as const,
} as const;