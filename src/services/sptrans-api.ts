import { API_CONFIG, ENDPOINTS } from '../constants/api';
import type { BusPosition, BusStatus, BusLine } from '../types/bus';

// API Response types from your new gateway
interface APIResponse<T> {
  success: boolean;
  data: T;
  meta: {
    cached: boolean;
    responseTime: string;
    timestamp: string;
  };
}

interface LineSearchResponse {
  lineId: number;
  lineNumber: string;
  displayName: string;
}

interface BusPositionResponse {
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

export class SPTransAPISimple {
  private config = {
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    retryAttempts: API_CONFIG.RETRY_ATTEMPTS,
  };

  constructor() {
    console.log(`🌐 API Gateway configured for: ${this.config.baseURL}`);
  }

  async checkHealth(): Promise<boolean> {
    try {
      console.log('🔍 Checking API gateway health...');

      const url = `${this.config.baseURL}${ENDPOINTS.HEALTH}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ API gateway is healthy');
        return true;
      } else {
        console.error('❌ API gateway health check failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ API gateway health check failed:', error);
      return false;
    }
  }

  async fetchBusPositions(lineCode: string): Promise<BusPosition[]> {
    console.log(`🚌 Fetching buses for line ${lineCode} via API gateway`);

    try {
      // First, search for the line to get the lineId
      const searchResponse = await this.makeGetRequest<APIResponse<LineSearchResponse[]>>(
        `${this.config.baseURL}${ENDPOINTS.LINES_SEARCH}?query=${encodeURIComponent(lineCode)}`
      );

      if (!searchResponse.success || searchResponse.data.length === 0) {
        throw new Error(`No lines found for ${lineCode}`);
      }

      const line = searchResponse.data[0];
      console.log(`🔢 Using line ID: ${line.lineId} for line: ${line.lineNumber}`);

      // Get bus positions using the lineId
      const busesUrl = `${this.config.baseURL}${ENDPOINTS.LINES_BUSES.replace('{lineId}', line.lineId.toString())}`;
      const busesResponse = await this.makeGetRequest<APIResponse<BusPositionResponse>>(busesUrl);

      if (!busesResponse.success) {
        throw new Error(`Failed to fetch buses for line ${lineCode}`);
      }

      const buses = busesResponse.data.buses.map(busData => this.transformBusData(busData, lineCode));
      console.log(`✅ Found ${buses.length} buses for line ${lineCode}`);

      return buses;

    } catch (error) {
      console.error(`❌ Failed to fetch buses for line ${lineCode}:`, error);
      throw error;
    }
  }

  private transformBusData(busData: BusPositionResponse['buses'][0], lineCode: string): BusPosition {
    return {
      id: `${busData.vehicleId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      lineCode,
      latitude: busData.latitude,
      longitude: busData.longitude,
      status: this.mapBusStatus(busData.status),
      lastUpdate: new Date(busData.lastUpdate),
      speed: 0, // Not provided by gateway
      direction: 0, // Not provided by gateway
    };
  }

  private mapBusStatus(status: string): BusStatus {
    switch (status.toLowerCase()) {
      case 'active':
        return 'moving';
      case 'inactive':
        return 'offline';
      case 'stopped':
        return 'stopped';
      default:
        return 'moving';
    }
  }

  private async makeGetRequest<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async searchBusLines(searchTerm: string): Promise<BusLine[]> {
    if (!searchTerm.trim()) {
      return [];
    }

    try {
      const url = `${this.config.baseURL}${ENDPOINTS.LINES_SEARCH}?query=${encodeURIComponent(searchTerm.trim())}`;
      const response = await this.makeGetRequest<APIResponse<LineSearchResponse[]>>(url);

      if (!response.success) {
        return [];
      }

      return response.data.map(lineData => this.transformLineData(lineData));
    } catch (error) {
      console.error(`❌ Search error for "${searchTerm}":`, error);
      return [];
    }
  }

  private transformLineData(lineData: LineSearchResponse): BusLine {
    return {
      code: lineData.lineNumber,
      name: lineData.displayName,
      direction: lineData.displayName.includes('→') ? 'Ida' : 'Volta',
      active: true,
    };
  }




  async checkConnection(): Promise<boolean> {
    return await this.checkHealth();
  }

  getAuthStatus(): boolean {
    return true; // No authentication needed for your API gateway
  }

  invalidateAuth(): void {
    // No-op: No authentication to invalidate
  }
}