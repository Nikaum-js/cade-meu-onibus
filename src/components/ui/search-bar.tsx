import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash.debounce';
import { validateLineCode } from '../../utils/api';
import { useBusStore } from '../../stores/bus-store';
import { useSearchHistory } from '../../hooks/use-search-history';
import { SearchHistory } from './search-history';
import type { SearchSuggestion } from '../../types/api';

interface SearchBarProps {
  onSearch: (lineCode: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  onSearch,
  placeholder = 'Digite o código da linha (ex: 6824-10)',
  autoFocus = false,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<TextInput>(null);

  const { getSuggestionsForSearch, searchLines, lines } = useBusStore();
  const { addSearch } = useSearchHistory();

  // Create debounced search function
  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      if (searchTerm.trim().length >= 2) {
        searchLines(searchTerm);
      }
    }, 300),
    [searchLines]
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const suggestions = getSuggestionsForSearch(query);

  const handleQueryChange = (text: string) => {
    console.log(`⌨️ User typing: "${text}"`);
    setQuery(text);
    setShowSuggestions(text.length > 0);
    setShowHistory(text.length === 0); // Show history when empty

    // Trigger debounced search for autocomplete
    if (text.trim().length >= 2) {
      console.log(`🕐 Triggering debounced search for: "${text}"`);
      debouncedSearch(text);
    }

    if (text.length > 0) {
      const valid = validateLineCode(text);
      setIsValid(valid);
    } else {
      setIsValid(true);
    }
  };

  const handleSearch = (searchQuery?: string) => {
    const searchTerm = searchQuery || query;

    if (!searchTerm.trim()) return;

    const isValidCode = validateLineCode(searchTerm);
    setIsValid(isValidCode);

    if (isValidCode) {
      const upperCaseSearchTerm = searchTerm.trim().toUpperCase();

      // Add to search history
      addSearch(upperCaseSearchTerm);

      onSearch(upperCaseSearchTerm);
      setShowSuggestions(false);
      setShowHistory(false);
      Keyboard.dismiss();
    }
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.lineCode);
    setShowSuggestions(false);
    handleSearch(suggestion.lineCode);
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    setShowHistory(true);
    setIsValid(true);
    inputRef.current?.focus();
  };

  const handleHistorySelect = (lineCode: string) => {
    setQuery(lineCode);
    setShowHistory(false);
    handleSearch(lineCode);
  };

  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => (
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
          <Text className="text-lg font-bold text-gray-800">{item.lineCode}</Text>
          <Text className="text-sm text-gray-600 mt-1 font-medium" numberOfLines={1}>
            {item.lineName}
          </Text>
        </View>
        <View className="opacity-60">
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="z-50">
      <View className={`flex-row items-center bg-gray-100 rounded-xl px-4 py-2 shadow-sm ${!isValid ? 'border border-red-600' : ''}`}>
        <View className="mr-2">
          <Ionicons name="search" size={20} color="#6B7280" />
        </View>

        <TextInput
          ref={inputRef}
          className="flex-1 text-base text-gray-800 py-1"
          value={query}
          onChangeText={handleQueryChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus={autoFocus}
          returnKeyType="search"
          onSubmitEditing={() => handleSearch()}
          onFocus={() => {
            setShowSuggestions(query.length > 0);
            setShowHistory(query.length === 0);
          }}
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
          onPress={() => handleSearch()}
          disabled={!query.trim()}
        >
          <Ionicons
            name="arrow-forward"
            size={20}
            color={query.trim() ? '#b91c1c' : '#6B7280'}
          />
        </TouchableOpacity>
      </View>

      {!isValid && (
        <Text className="text-red-600 text-xs mt-1 ml-4">
          Formato inválido. Use o padrão: 6824-10
        </Text>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <View className="absolute top-full left-0 right-0 bg-white rounded-2xl mt-2 max-h-72 shadow-xl border border-gray-100 z-50">
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `${item.lineCode}-${index}`}
            className="max-h-72"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      <SearchHistory
        visible={showHistory}
        onSelectHistory={handleHistorySelect}
      />
    </View>
  );
}

