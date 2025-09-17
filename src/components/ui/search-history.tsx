import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSearchHistory } from '../../hooks/use-search-history';

interface SearchHistoryProps {
  onSelectHistory: (lineCode: string) => void;
  visible: boolean;
}

export function SearchHistory({ onSelectHistory, visible }: SearchHistoryProps) {
  const {
    history,
    isLoading,
    removeItem,
    clearHistory,
    isRemovingItem,
    isClearingHistory,
  } = useSearchHistory();

  if (!visible || (!isLoading && history.length === 0)) {
    return null;
  }

  const handleClearHistory = () => {
    Alert.alert(
      'Limpar Histórico',
      'Tem certeza que deseja limpar todo o histórico de buscas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: () => clearHistory() },
      ]
    );
  };

  const handleRemoveItem = (lineCode: string) => {
    Alert.alert(
      'Remover do Histórico',
      `Remover "${lineCode}" do histórico?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => removeItem(lineCode) },
      ]
    );
  };

  const renderHistoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      className="px-5 py-4 border-b border-gray-50"
      onPress={() => onSelectHistory(item)}
      activeOpacity={0.8}
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-gray-500 items-center justify-center mr-4 shadow-sm">
          <Ionicons name="time" size={18} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800">{item}</Text>
          <Text className="text-sm text-gray-600 mt-0.5 font-medium">Busca recente</Text>
        </View>
        <TouchableOpacity
          className="p-2 rounded-lg"
          onPress={() => handleRemoveItem(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={isRemovingItem}
        >
          <Ionicons name="close" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="bg-white rounded-2xl mt-2 max-h-80 shadow-xl border border-gray-100">
        <View className="p-6 items-center">
          <Text className="text-sm text-gray-600 font-medium">Carregando histórico...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl mt-2 max-h-80 shadow-xl border border-gray-100">
      <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-50">
        <Text className="text-base font-bold text-gray-800">Buscas Recentes</Text>
        <TouchableOpacity
          className="px-3 py-2 rounded-lg bg-red-50"
          onPress={handleClearHistory}
          disabled={isClearingHistory}
        >
          <Text className="text-xs text-red-600 font-semibold">
            {isClearingHistory ? 'Limpando...' : 'Limpar Tudo'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item, index) => `${item}-${index}`}
        className="max-h-60"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
      />
    </View>
  );
}

