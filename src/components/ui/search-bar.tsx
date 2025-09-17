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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import debounce from 'lodash.debounce';
import { searchSchema, type SearchFormData } from '../../schemas/search';
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
  placeholder = 'Digite o código',
  autoFocus = false,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const { getSuggestionsForSearch, searchLines } = useBusStore();
  const { addSearch } = useSearchHistory();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    reset,
    formState: { errors, isValid },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    mode: 'onChange',
    defaultValues: {
      lineCode: '',
    },
  });

  const watchedLineCode = watch('lineCode');
  const showSuggestions = isFocused && watchedLineCode.length > 0;
  const showHistory = isFocused && watchedLineCode.length === 0;

  // Create debounced search function for autocomplete (only for dropdown suggestions)
  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      if (searchTerm.trim().length >= 2) {
        console.log(`🔍 Triggering autocomplete search for: "${searchTerm}"`);
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

  // Watch for changes in line code to trigger debounced search for autocomplete
  useEffect(() => {
    if (isFocused && watchedLineCode.trim().length >= 2) {
      // Use original input for API search (não normalizar aqui)
      debouncedSearch(watchedLineCode);
    }
  }, [watchedLineCode, debouncedSearch, isFocused]);

  const suggestions = getSuggestionsForSearch(watchedLineCode);

  const onSubmit = (data: SearchFormData) => {
    console.log(`🔍 Searching for: "${data.lineCode}"`);

    // Add to search history
    addSearch(data.lineCode);

    // Execute search
    onSearch(data.lineCode);

    // Close dropdowns and dismiss keyboard
    hideDropdowns();
    Keyboard.dismiss();
  };

  const hideDropdowns = () => {
    setIsFocused(false);
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

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    setValue('lineCode', suggestion.lineCode, { shouldValidate: true });
    setIsFocused(false);
    handleSubmit(onSubmit)();
  };

  const handleClear = () => {
    reset();
    setIsFocused(true);
    setFocus('lineCode');
  };

  const handleHistorySelect = (lineCode: string) => {
    setValue('lineCode', lineCode, { shouldValidate: true });
    setIsFocused(false);
    handleSubmit(onSubmit)();
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
    <>
      {(showSuggestions || showHistory) && (
        <TouchableWithoutFeedback onPress={handleOutsidePress}>
          <View className="absolute inset-0 z-40" />
        </TouchableWithoutFeedback>
      )}

      <View className="relative z-50">
        <Controller
          control={control}
          name="lineCode"
          render={({ field: { onChange, value, onBlur, ref } }) => (
            <View
              className={`flex-row items-center bg-gray-100 rounded-xl px-4 py-3 shadow-sm ${
                errors.lineCode ? 'border-2 border-red-500' : 'border border-transparent'
              }`}
            >
              <View className="mr-3">
                <Ionicons name="search" size={20} color="#6B7280" />
              </View>

              <TextInput
                ref={ref}
                className="flex-1 text-base text-gray-800 py-1"
                value={value}
                onChangeText={onChange}
                onFocus={handleFocus}
                onBlur={() => {
                  onBlur();
                  handleBlur();
                }}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus={autoFocus}
                returnKeyType="search"
                onSubmitEditing={handleSubmit(onSubmit)}
              />

              {value.length > 0 && (
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
                onPress={handleSubmit(onSubmit)}
                disabled={!value.trim() || !isValid}
              >
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={value.trim() && isValid ? '#1E40AF' : '#6B7280'}
                />
              </TouchableOpacity>
            </View>
          )}
        />

        {errors.lineCode && (
          <Text className="text-red-600 text-xs mt-2 ml-4">
            {errors.lineCode.message}
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

        {showHistory && (
          <SearchHistory
            visible={showHistory}
            onSelectHistory={handleHistorySelect}
          />
        )}
      </View>
    </>
  );
}

