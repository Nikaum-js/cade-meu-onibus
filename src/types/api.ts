import { BusPosition, BusLine } from './bus';

// Configuration for your API gateway
export interface APIGatewayConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
}

// Standard response format from your API gateway
export interface APIResponse<T> {
  success: boolean;
  data: T;
  meta: {
    cached: boolean;
    responseTime: string;
    timestamp: string;
  };
}

// Response types from your API gateway endpoints
export interface LineSearchResponse {
  lineId: number;
  lineNumber: string;
  serviceType: string;
  direction: string;
  isCircular: boolean;
  fromTerminal: string;
  toTerminal: string;
  displayName: string;
}

export interface BusPositionResponse {
  lineId: number;
  referenceTime: string;
  buses: {
    vehicleId: string;
    latitude: number;
    longitude: number;
    isAccessible: boolean;
    lastUpdate: string;
    status: string;
  }[];
  totalBuses: number;
}

