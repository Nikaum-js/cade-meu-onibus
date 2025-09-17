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
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<TextInput>(null);

  const { getSuggestionsForSearch, searchLines, lines } = useBusStore();

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
    setQuery(text);
    setShowSuggestions(text.length > 0);

    // Trigger debounced search for autocomplete
    debouncedSearch(text);

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
      onSearch(searchTerm.trim().toUpperCase());
      setShowSuggestions(false);
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
    setIsValid(true);
    inputRef.current?.focus();
  };

  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionContent}>
        <View style={styles.suggestionIcon}>
          <Ionicons name="bus" size={16} color="#1E40AF" />
        </View>
        <View style={styles.suggestionText}>
          <Text style={styles.suggestionCode}>{item.lineCode}</Text>
          <Text style={styles.suggestionName} numberOfLines={1}>
            {item.lineName}
          </Text>
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
          onFocus={() => setShowSuggestions(query.length > 0)}
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
            keyExtractor={(item) => item.lineCode}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
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
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  suggestionsList: {
    maxHeight: 250,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E40AF20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  suggestionName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
});