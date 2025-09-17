import { create } from 'zustand';
import * as Location from 'expo-location';
import type { UserLocation, MapRegion } from '../types';

interface LocationStore {
  // State
  userLocation: UserLocation | null;
  mapRegion: MapRegion;
  hasLocationPermission: boolean;
  isLocationLoading: boolean;
  locationError: string | null;
  isTrackingLocation: boolean;
  locationSubscription: Location.LocationSubscription | null;

  // Actions
  requestLocationPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<void>;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => void;
  updateMapRegion: (region: MapRegion) => void;
  clearLocationError: () => void;
}

// Default map region (São Paulo center)
const DEFAULT_REGION: MapRegion = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export const useLocationStore = create<LocationStore>((set, get) => ({
  // Initial state
  userLocation: null,
  mapRegion: DEFAULT_REGION,
  hasLocationPermission: false,
  isLocationLoading: false,
  locationError: null,
  isTrackingLocation: false,
  locationSubscription: null,

  requestLocationPermission: async () => {
    try {
      set({ isLocationLoading: true, locationError: null });

      const { status } = await Location.requestForegroundPermissionsAsync();
      const hasPermission = status === 'granted';

      set({
        hasLocationPermission: hasPermission,
        isLocationLoading: false,
        locationError: hasPermission ? null : 'Location permission denied',
      });

      return hasPermission;
    } catch (error) {
      set({
        hasLocationPermission: false,
        isLocationLoading: false,
        locationError: error instanceof Error ? error.message : 'Failed to request location permission',
      });
      return false;
    }
  },

  getCurrentLocation: async () => {
    const { hasLocationPermission, requestLocationPermission } = get();

    if (!hasLocationPermission) {
      const granted = await requestLocationPermission();
      if (!granted) return;
    }

    try {
      set({ isLocationLoading: true, locationError: null });

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        maximumAge: 10000, // Allow cached location up to 10 seconds old
        timeout: 15000, // Wait up to 15 seconds
      });

      const userLocation: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: new Date(location.timestamp),
      };

      // Update map region to center on user location
      const newRegion: MapRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      // Auto-correct simulator default location (San Francisco) to São Paulo
      if (
        Math.abs(userLocation.latitude - 37.7749) < 0.1 && // San Francisco latitude
        Math.abs(userLocation.longitude + 122.4194) < 0.1   // San Francisco longitude
      ) {
        userLocation.latitude = -23.5505;
        userLocation.longitude = -46.6333;
      }

      set({
        userLocation,
        mapRegion: newRegion,
        isLocationLoading: false,
      });
    } catch (error) {
      set({
        isLocationLoading: false,
        locationError: error instanceof Error ? error.message : 'Failed to get current location',
      });
    }
  },

  startLocationTracking: async () => {
    const { hasLocationPermission, requestLocationPermission, stopLocationTracking } = get();

    if (!hasLocationPermission) {
      const granted = await requestLocationPermission();
      if (!granted) return;
    }

    // Stop any existing tracking
    stopLocationTracking();

    try {
      set({ isLocationLoading: true, locationError: null });

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          const userLocation: UserLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            timestamp: new Date(location.timestamp),
          };

          set({ userLocation });
        }
      );

      set({
        locationSubscription: subscription,
        isTrackingLocation: true,
        isLocationLoading: false,
      });
    } catch (error) {
      set({
        isLocationLoading: false,
        isTrackingLocation: false,
        locationError: error instanceof Error ? error.message : 'Failed to start location tracking',
      });
    }
  },

  stopLocationTracking: () => {
    const { locationSubscription } = get();

    if (locationSubscription) {
      locationSubscription.remove();
    }

    set({
      locationSubscription: null,
      isTrackingLocation: false,
    });
  },

  updateMapRegion: (region: MapRegion) => {
    set({ mapRegion: region });
  },

  clearLocationError: () => {
    set({ locationError: null });
  },
}));