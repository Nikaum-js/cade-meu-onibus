import React, { useEffect, useState } from 'react';
import { View, Alert, Dimensions, StatusBar, Text, ScrollView } from 'react-native';
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

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'moving':
        return 'bg-success'; // Verde para ônibus em operação
      case 'stopped':
        return 'bg-warning'; // Amarelo para atrasos
      case 'offline':
        return 'bg-gray-400'; // Cinza para offline
      default:
        return 'bg-gray-400';
    }
  };

  const renderBusList = () => {
    const busArray = Array.from(buses.values());

    if (busArray.length === 0) {
      return (
        <View className="items-center justify-center py-12">
          <Text className="text-xl font-bold text-gray-800 text-center mb-3">
            🚌 Digite o código de uma linha para ver os ônibus
          </Text>
          <Text className="text-base text-gray-600 text-center font-medium">
            Exemplo: 6824-10, 701U-10, 2029-10
          </Text>
        </View>
      );
    }

    return (
      <ScrollView className="w-full max-h-96" showsVerticalScrollIndicator={false}>
        <Text className="text-xl font-extrabold text-gray-800 mb-5 text-center">
          Linha {selectedLine} - {busArray.length} ônibus encontrados
        </Text>
        {busArray.map((bus) => (
          <View key={bus.id} className="flex-row items-center bg-white rounded-2xl p-5 mb-3 shadow-md border border-gray-50">
            <View className={`w-4 h-4 rounded-full mr-4 shadow-sm ${getStatusColorClass(bus.status)}`} />
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-800 mb-1.5">
                Ônibus {bus.id.split('-')[0]}
              </Text>
              <Text className="text-base text-gray-600 mb-1 font-semibold">
                {getStatusLabel(bus.status)}
              </Text>
              <Text className="text-sm text-gray-500 mb-1 font-medium">
                📍 {bus.latitude.toFixed(4)}, {bus.longitude.toFixed(4)}
              </Text>
              <Text className="text-sm text-gray-500 font-medium">
                🕐 {bus.lastUpdate.toLocaleTimeString()}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Search Bar */}
      <View className="px-5 py-4 bg-white border-b border-gray-100 shadow-lg elevation-6 z-50">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Digite o código da linha (ex: 6824-10)"
        />
      </View>

      {/* Map Placeholder */}
      <View className="flex-1 bg-white mx-5 my-5 rounded-3xl p-8 items-center shadow-xl elevation-8 border border-gray-100">
        <Text className="text-3xl font-extrabold text-gray-800 mb-3 text-center">
          🗺️ Mapa de São Paulo
        </Text>
        <Text className="text-base text-gray-600 text-center mb-2 font-medium">
          Para visualizar no mapa, configure o Google Maps API
        </Text>
        <Text className="text-sm text-gray-500 text-center mb-8 font-normal">
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
        <View className="absolute bottom-5 left-5 right-5 z-50">
          <ErrorMessage
            message={error || locationError || 'Erro desconhecido'}
            onRetry={handleRetry}
            retryText="Tentar novamente"
          />
        </View>
      )}

      {/* Offline Indicator */}
      {isOffline && (
        <View className="absolute top-20 left-5 right-5 z-50">
          <ErrorMessage
            message="Sem conexão com a internet"
            showIcon={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

