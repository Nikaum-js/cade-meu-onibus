import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
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
        { text: 'Limpar', style: 'destructive', onPress: clearHistory },
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
      style={styles.historyItem}
      onPress={() => onSelectHistory(item)}
      activeOpacity={0.8}
    >
      <View style={styles.historyContent}>
        <View style={styles.historyIcon}>
          <Ionicons name="time" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.historyTextContainer}>
          <Text style={styles.historyText}>{item}</Text>
          <Text style={styles.historySubtext}>Busca recente</Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
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
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando histórico...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Buscas Recentes</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearHistory}
          disabled={isClearingHistory}
        >
          <Text style={styles.clearButtonText}>
            {isClearingHistory ? 'Limpando...' : 'Limpar Tudo'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item, index) => `${item}-${index}`}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 8,
    maxHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  headerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  list: {
    maxHeight: 240,
  },
  listContent: {
    paddingBottom: 8,
  },
  historyItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  historyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTextContainer: {
    flex: 1,
  },
  historyText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  historySubtext: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});