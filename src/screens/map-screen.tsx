import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, StatusBar, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

import { SearchBar } from '../components/ui/search-bar';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { ErrorMessage } from '../components/ui/error-message';
import { BusMarker } from '../components/maps/bus-marker-simple';

import { useBusStore } from '../stores/bus-store';
import { useLocationStore } from '../stores/location-store';
import { useAppStore } from '../stores/app-store';



export function MapScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<MapView>(null);

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
    userLocation,
    mapRegion,
    hasLocationPermission,
    isLocationLoading,
    locationError,
    requestLocationPermission,
    getCurrentLocation,
  } = useLocationStore();

  const { isOffline } = useAppStore();

  useEffect(() => {
    // Request location permission and get location immediately on mount
    const initializeLocation = async () => {
      const granted = await requestLocationPermission();
      if (granted) {
        getCurrentLocation();
      }
    };

    initializeLocation();
  }, [requestLocationPermission, getCurrentLocation]);

  useEffect(() => {
    // Cleanup auto-refresh on unmount
    return () => {
      stopAutoRefresh();
    };
  }, [stopAutoRefresh]);

  // Effect to animate to user location when obtained
  useEffect(() => {
    if (userLocation && mapRef.current && buses.size === 0) {
      // Only center on user if no buses are being shown
      const region: Region = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      // Animate to user location
      mapRef.current.animateToRegion(region, 1000);
    }
  }, [userLocation, buses.size]);

  // Effect to fit both user location and buses when buses are loaded
  useEffect(() => {
    if (buses.size > 0 && mapRef.current) {
      const busArray = Array.from(buses.values());
      const coordinates = busArray.map(bus => ({
        latitude: bus.latitude,
        longitude: bus.longitude,
      }));

      // Add user location if available
      if (userLocation) {
        coordinates.push({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        });
      }

      // Fit all markers (buses + user location) in view
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
        animated: true,
      });
    }
  }, [buses, userLocation]);

  const handleSearch = useCallback(async (lineCode: string) => {
    setSearchQuery(lineCode);
    clearError();

    try {
      await fetchBuses(lineCode);
      startAutoRefresh(lineCode);
    } catch (err) {
      console.error('Search failed:', err);
    }
  }, [fetchBuses, startAutoRefresh, clearError]);

  const handleRetry = useCallback(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  }, [searchQuery, handleSearch]);

  const getStatusLabel = useCallback((status: string) => {
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
  }, []);

  const getStatusColorClass = useCallback((status: string) => {
    switch (status) {
      case 'moving':
        return 'bg-green-500'; // Verde para ônibus em movimento
      case 'stopped':
        return 'bg-amber-500'; // Amarelo para ônibus parado
      case 'offline':
        return 'bg-gray-400'; // Cinza para offline
      default:
        return 'bg-gray-400';
    }
  }, []);

  // Memoized initial region calculation - prefer user location
  const initialRegion: Region = useMemo(() => {
    if (userLocation) {
      // If we have user location, center on them with closer zoom
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01, // Closer zoom when we have user location
        longitudeDelta: 0.01,
      };
    }
    // Fallback to São Paulo center
    return mapRegion;
  }, [userLocation, mapRegion]);

  // Memoized bus markers
  const busMarkers = useMemo(() => {
    return Array.from(buses.values()).map((bus) => (
      <BusMarker
        key={bus.id}
        bus={bus}
        onPress={() => {
          // TODO: Implementar modal de detalhes do ônibus
          console.log(`Ônibus ${bus.id} pressionado`);
        }}
      />
    ));
  }, [buses]);

  // Memoized bus list for overlay
  const busListItems = useMemo(() => {
    return Array.from(buses.values()).slice(0, 3).map((bus, index) => (
      <View key={bus.id} className="flex-row items-center p-3 bg-gray-50 rounded-xl mb-2 border border-gray-100">
        <View className="flex-row items-center flex-1">
          <View className={`w-4 h-4 rounded-full mr-4 ${getStatusColorClass(bus.status)} shadow-sm`} />
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-800">
              Ônibus {bus.id.split('-')[0]}
            </Text>
            <Text className="text-sm text-gray-600 font-medium">
              {getStatusLabel(bus.status)}
            </Text>
          </View>
        </View>
        <View className="items-center">
          <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center border border-gray-200">
            <Text className="text-gray-600 text-xs">🚌</Text>
          </View>
        </View>
      </View>
    ));
  }, [buses, getStatusColorClass, getStatusLabel]);

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

      {/* Google Maps */}
      <View className="flex-1">
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          showsUserLocation={hasLocationPermission}
          showsMyLocationButton={hasLocationPermission}
          loadingEnabled={true}
          loadingIndicatorColor="#1E40AF"
          mapType="standard"
        >
          {busMarkers}
        </MapView>

        {/* Bus List Overlay */}
        {selectedLine && buses.size > 0 && (
          <View className="absolute bottom-5 left-5 right-5 bg-white rounded-3xl shadow-2xl max-h-80 border border-gray-50">
            {/* Header */}
            <View className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-3xl">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold">
                    Linha {selectedLine}
                  </Text>
                  <Text className="text-red-100 text-sm font-medium">
                    {buses.size} ônibus {buses.size === 1 ? 'operando' : 'operando'}
                  </Text>
                </View>
                <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                  <Text className="text-white text-lg">🚌</Text>
                </View>
              </View>
            </View>

            {/* Bus List */}
            <View className="p-4">
              <ScrollView showsVerticalScrollIndicator={false} className="max-h-44">
                {busListItems}
                {buses.size > 3 && (
                  <View className="items-center mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <Text className="text-blue-700 text-sm font-semibold">
                      +{buses.size - 3} ônibus adicional{buses.size - 3 > 1 ? 'is' : ''} no mapa
                    </Text>
                    <Text className="text-blue-600 text-xs mt-1">
                      Amplie o mapa para ver todos
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        )}

        {/* No Buses Found Message */}
        {selectedLine && buses.size === 0 && !isLoading && !error && (
          <View className="absolute bottom-5 left-5 right-5 bg-white rounded-2xl p-6 shadow-xl">
            <View className="items-center">
              <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Text className="text-2xl">🚌</Text>
              </View>
              <Text className="text-lg font-bold text-gray-800 text-center mb-2">
                Nenhum ônibus encontrado
              </Text>
              <Text className="text-sm text-gray-600 text-center mb-4">
                Não encontramos ônibus operando na linha {selectedLine} no momento
              </Text>
              <View className="flex-row items-center justify-center bg-blue-50 px-4 py-2 rounded-xl">
                <Text className="text-xs text-blue-600 text-center">
                  💡 Tente buscar novamente em alguns minutos
                </Text>
              </View>
            </View>
          </View>
        )}
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

