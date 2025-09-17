import React, { useEffect, useState } from 'react';
import { View, Alert, Dimensions, StatusBar, StyleSheet, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchBar } from '../components/ui/search-bar';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { ErrorMessage } from '../components/ui/error-message';

import { useBusStore } from '../stores/bus-store';
import { useLocationStore } from '../stores/location-store';
import { useAppStore } from '../stores/app-store';

import type { BusPosition } from '../types/bus';

const { width, height } = Dimensions.get('window');

export function MapScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  // Store hooks
  const {
    buses,
    selectedLine,
    isLoading,
    error,
    fetchBuses,
    clearError,
    startAutoRefresh,
    stopAutoRefresh,
  } = useBusStore();

  const {
    hasLocationPermission,
    isLocationLoading,
    locationError,
    requestLocationPermission,
    getCurrentLocation,
  } = useLocationStore();

  const { isOffline } = useAppStore();

  useEffect(() => {
    // Request location permission on mount
    requestLocationPermission();
  }, [requestLocationPermission]);

  useEffect(() => {
    // Get current location if permission granted
    if (hasLocationPermission) {
      getCurrentLocation();
    }
  }, [hasLocationPermission, getCurrentLocation]);

  useEffect(() => {
    // Cleanup auto-refresh on unmount
    return () => {
      stopAutoRefresh();
    };
  }, [stopAutoRefresh]);

  const handleSearch = async (lineCode: string) => {
    setSearchQuery(lineCode);
    clearError();

    try {
      await fetchBuses(lineCode);
      startAutoRefresh(lineCode);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleRetry = () => {
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'moving':
        return 'Em movimento';
      case 'stopped':
        return 'Parado';
      case 'offline':
        return 'Offline';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'moving':
        return '#059669'; // Green
      case 'stopped':
        return '#D97706'; // Orange
      case 'offline':
        return '#9CA3AF'; // Gray
      default:
        return '#9CA3AF';
    }
  };

  const renderBusList = () => {
    const busArray = Array.from(buses.values());

    if (busArray.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            🚌 Digite o código de uma linha para ver os ônibus
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Exemplo: 6824-10, 701U-10, 2029-10
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.busList} showsVerticalScrollIndicator={false}>
        <Text style={styles.busListTitle}>
          Linha {selectedLine} - {busArray.length} ônibus encontrados
        </Text>
        {busArray.map((bus) => (
          <View key={bus.id} style={styles.busItem}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(bus.status) }]} />
            <View style={styles.busInfo}>
              <Text style={styles.busId}>Ônibus {bus.id.split('-')[0]}</Text>
              <Text style={styles.busStatus}>{getStatusLabel(bus.status)}</Text>
              <Text style={styles.busLocation}>
                📍 {bus.latitude.toFixed(4)}, {bus.longitude.toFixed(4)}
              </Text>
              <Text style={styles.busTime}>
                🕐 {bus.lastUpdate.toLocaleTimeString()}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          onSearch={handleSearch}
          placeholder="Digite o código da linha (ex: 6824-10)"
        />
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderTitle}>🗺️ Mapa de São Paulo</Text>
        <Text style={styles.mapPlaceholderText}>
          Para visualizar no mapa, configure o Google Maps API
        </Text>
        <Text style={styles.mapPlaceholderSubtext}>
          Por enquanto, você pode ver a lista de ônibus abaixo
        </Text>


        {renderBusList()}
      </View>

      {/* Loading Overlay */}
      {(isLoading || isLocationLoading) && (
        <LoadingSpinner
          overlay
          message={
            isLocationLoading
              ? 'Obtendo localização...'
              : isLoading
              ? `Buscando ônibus da linha ${selectedLine}...`
              : 'Carregando...'
          }
        />
      )}

      {/* Error Message */}
      {(error || locationError) && (
        <View style={styles.errorContainer}>
          <ErrorMessage
            message={error || locationError || 'Erro desconhecido'}
            onRetry={handleRetry}
            retryText="Tentar novamente"
          />
        </View>
      )}

      {/* Offline Indicator */}
      {isOffline && (
        <View style={styles.offlineIndicator}>
          <ErrorMessage
            message="Sem conexão com a internet"
            showIcon={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 1000,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  mapPlaceholderTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '400',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  busList: {
    width: '100%',
    maxHeight: 400,
  },
  busListTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  busItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F8FAFC',
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  busInfo: {
    flex: 1,
  },
  busId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  busStatus: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
  },
  busLocation: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 3,
    fontWeight: '500',
  },
  busTime: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1001,
  },
  offlineIndicator: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 80,
    left: 20,
    right: 20,
    zIndex: 1002,
  },
});