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

        {/* Demo mode indicator */}
        <View style={styles.demoIndicator}>
          <Text style={styles.demoText}>
            🚌 MODO DEMONSTRAÇÃO - Use linhas: 6824-10, 701U-10, 2029-10, 177A-10, 175R-10
          </Text>
        </View>

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
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 1000,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  mapPlaceholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  demoIndicator: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  demoText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  busList: {
    width: '100%',
    maxHeight: 400,
  },
  busListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  busItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  busInfo: {
    flex: 1,
  },
  busId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  busStatus: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  busLocation: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  busTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    zIndex: 1001,
  },
  offlineIndicator: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 80 : 100,
    left: 16,
    right: 16,
    zIndex: 1002,
  },
});