import React, { useEffect, useRef, useState } from 'react';
import { View, Alert, Dimensions, StatusBar, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchBar } from '../components/ui/search-bar';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { ErrorMessage } from '../components/ui/error-message';
import { BusMarker } from '../components/maps/bus-marker';

import { useBusStore } from '../stores/bus-store';
import { useLocationStore } from '../stores/location-store';
import { useAppStore } from '../stores/app-store';

import type { BusPosition } from '../types/bus';
import type { MapRegion } from '../types';

const { width, height } = Dimensions.get('window');

export function MapScreen() {
  const mapRef = useRef<MapView>(null);
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
    userLocation,
    mapRegion,
    hasLocationPermission,
    isLocationLoading,
    locationError,
    requestLocationPermission,
    getCurrentLocation,
    updateMapRegion,
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

      // Center map on São Paulo if no user location
      if (!userLocation) {
        const spRegion = {
          latitude: -23.5505,
          longitude: -46.6333,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        updateMapRegion(spRegion);
        mapRef.current?.animateToRegion(spRegion, 1000);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleBusPress = (bus: BusPosition) => {
    Alert.alert(
      `Ônibus ${bus.lineCode}`,
      `Status: ${getStatusLabel(bus.status)}\nÚltima atualização: ${bus.lastUpdate.toLocaleTimeString()}`,
      [
        {
          text: 'Fechar',
          style: 'cancel',
        },
        {
          text: 'Centralizar no mapa',
          onPress: () => {
            const region = {
              latitude: bus.latitude,
              longitude: bus.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            mapRef.current?.animateToRegion(region, 1000);
          },
        },
      ]
    );
  };

  const handleMapPress = () => {
    // Hide search suggestions when tapping on map
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

  const renderBusMarkers = () => {
    return Array.from(buses.values()).map((bus) => (
      <BusMarker
        key={bus.id}
        bus={bus}
        onPress={handleBusPress}
      />
    ));
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

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={mapRegion}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={hasLocationPermission}
        showsTraffic={false}
        showsBuildings={true}
        onPress={handleMapPress}
        onRegionChangeComplete={updateMapRegion}
        mapType="standard"
        pitchEnabled={true}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
      >
        {renderBusMarkers()}
      </MapView>

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
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  map: {
    width,
    height,
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