import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  Keyboard,
  StyleSheet,
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
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.suggestionContent}>
        <View style={styles.suggestionIcon}>
          <Ionicons name="bus" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.suggestionTextContainer}>
          <Text style={styles.suggestionCode}>{item.lineCode}</Text>
          <Text style={styles.suggestionName} numberOfLines={1}>
            {item.lineName}
          </Text>
        </View>
        <View style={styles.suggestionArrow}>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, !isValid && styles.searchContainerError]}>
        <View style={styles.searchIconContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
        </View>

        <TextInput
          ref={inputRef}
          style={styles.searchInput}
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
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => handleSearch()}
          disabled={!query.trim()}
        >
          <Ionicons
            name="arrow-forward"
            size={20}
            color={query.trim() ? '#1E40AF' : '#6B7280'}
          />
        </TouchableOpacity>
      </View>

      {!isValid && (
        <Text style={styles.errorText}>
          Formato inválido. Use o padrão: 6824-10
        </Text>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `${item.lineCode}-${index}`}
            style={styles.suggestionsList}
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

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchContainerError: {
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  searchIconContainer: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 4,
  },
  clearButton: {
    marginLeft: 8,
  },
  searchButton: {
    marginLeft: 8,
    padding: 4,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 8,
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  suggestionsList: {
    maxHeight: 280,
  },
  suggestionItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionCode: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  suggestionName: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  suggestionArrow: {
    opacity: 0.6,
  },
});