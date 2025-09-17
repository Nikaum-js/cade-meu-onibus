import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchHistoryStorage, queryKeys } from '../services/query-client';

export function useSearchHistory() {
  const queryClient = useQueryClient();

  // Get search history
  const {
    data: history = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.searchHistory,
    queryFn: () => searchHistoryStorage.getHistory(),
    staleTime: Infinity, // History doesn't get stale
  });

  // Add search to history
  const addSearchMutation = useMutation({
    mutationFn: (lineCode: string) => searchHistoryStorage.addSearch(lineCode),
    onSuccess: () => {
      // Invalidate and refetch history
      queryClient.invalidateQueries({ queryKey: queryKeys.searchHistory });
    },
    onError: (error) => {
      console.error('Failed to add search to history:', error);
    },
  });

  // Remove item from history
  const removeItemMutation = useMutation({
    mutationFn: (lineCode: string) => searchHistoryStorage.removeItem(lineCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.searchHistory });
    },
    onError: (error) => {
      console.error('Failed to remove item from history:', error);
    },
  });

  // Clear entire history
  const clearHistoryMutation = useMutation({
    mutationFn: () => searchHistoryStorage.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.searchHistory });
    },
    onError: (error) => {
      console.error('Failed to clear history:', error);
    },
  });

  return {
    // Data
    history,
    isLoading,
    error,

    // Actions
    addSearch: addSearchMutation.mutate,
    removeItem: removeItemMutation.mutate,
    clearHistory: clearHistoryMutation.mutate,
    refetch,

    // Mutation states
    isAddingSearch: addSearchMutation.isPending,
    isRemovingItem: removeItemMutation.isPending,
    isClearingHistory: clearHistoryMutation.isPending,
  };
}