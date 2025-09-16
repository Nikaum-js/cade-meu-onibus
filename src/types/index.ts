export * from './bus';
export * from './api';

export interface AppState {
  isLoading: boolean;
  isOffline: boolean;
  lastUpdate?: Date;
  error?: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}