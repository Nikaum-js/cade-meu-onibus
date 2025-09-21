import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBusStore } from '../../stores/bus-store';
import type { BusLine } from '../../types/bus';

interface SearchBarProps {
  onSearch: (lineCode: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  onSearch,
  placeholder = 'Digite o código',
  autoFocus = false,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const { lines, searchLines, clearLines } = useBusStore();

  // Create debounced search function for autocomplete
  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      if (searchTerm.trim().length >= 2) {
        searchLines(searchTerm);
      } else {
        clearLines();
      }
    }, 300),
    [searchLines, clearLines]
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Watch for changes in query to trigger debounced search
  useEffect(() => {
    if (isFocused) {
      debouncedSearch(query);
    }
  }, [query, debouncedSearch, isFocused]);

  const showSuggestions = isFocused && query.length > 0 && lines.length > 0;

  const onSubmit = () => {
    if (query.trim()) {
      onSearch(query.trim());
      hideDropdowns();
      Keyboard.dismiss();
    }
  };

  const hideDropdowns = () => {
    setIsFocused(false);
    clearLines();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay to allow selection to complete
    setTimeout(() => {
      setIsFocused(false);
    }, 100);
  };

  const handleOutsidePress = () => {
    hideDropdowns();
  };

  const handleSuggestionPress = (line: BusLine) => {
    setQuery(line.code);
    setIsFocused(false);
    onSearch(line.code);
  };

  const handleClear = () => {
    setQuery('');
    setIsFocused(true);
    clearLines();
  };

  const renderSuggestion = ({ item }: { item: BusLine }) => (
    <TouchableOpacity
      className="px-5 py-4 border-b border-gray-50"
      onPress={() => handleSuggestionPress(item)}
      activeOpacity={0.8}
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-primary-500 items-center justify-center mr-4 shadow-sm">
          <Ionicons name="bus" size={18} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800">{item.code}</Text>
          <Text className="text-sm text-gray-600 mt-1 font-medium" numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <View className="opacity-60">
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      {showSuggestions && (
        <TouchableWithoutFeedback onPress={handleOutsidePress}>
          <View className="absolute inset-0 z-40" />
        </TouchableWithoutFeedback>
      )}

      <View className="relative z-50">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 shadow-sm border border-transparent">
          <View className="mr-3">
            <Ionicons name="search" size={20} color="#6B7280" />
          </View>

          <TextInput
            className="flex-1 text-base text-gray-800 py-1"
            value={query}
            onChangeText={setQuery}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus={autoFocus}
            returnKeyType="search"
            onSubmitEditing={onSubmit}
          />

          {query.length > 0 && (
            <TouchableOpacity
              className="ml-2"
              onPress={handleClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="ml-2 p-1"
            onPress={onSubmit}
            disabled={!query.trim()}
          >
            <Ionicons
              name="arrow-forward"
              size={20}
              color={query.trim() ? '#1E40AF' : '#6B7280'}
            />
          </TouchableOpacity>
        </View>

        {showSuggestions && (
          <View className="absolute top-full left-0 right-0 bg-white rounded-2xl mt-2 max-h-72 shadow-xl border border-gray-100 z-50">
            <FlatList
              data={lines.slice(0, 6)}
              renderItem={renderSuggestion}
              keyExtractor={(item, index) => `${item.code}-${item.direction}-${index}`}
              className="max-h-72"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </View>
    </>
  );
}

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout;

  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };

  debounced.cancel = () => clearTimeout(timeout);

  return debounced as T & { cancel: () => void };
}