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
    const timestamp = new Date().toISOString();

    try {
      // First, search for the line to get the lineId
      const searchUrl = `${this.config.baseURL}${ENDPOINTS.LINES_SEARCH}?query=${encodeURIComponent(lineCode)}`;
      console.log(`🔍 [${timestamp}] Search URL:`, searchUrl);

      const searchResponse = await this.makeGetRequest<APIResponse<LineSearchResponse[]>>(searchUrl);

      console.log(`📊 [${timestamp}] Search Response:`, {
        success: searchResponse.success,
        dataLength: searchResponse.data?.length || 0,
        cached: searchResponse.meta?.cached,
        responseTime: searchResponse.meta?.responseTime,
      });

      if (!searchResponse.success || searchResponse.data.length === 0) {
        throw new Error(`No lines found for ${lineCode}`);
      }

      const line = searchResponse.data[0];
      console.log(`🔢 [${timestamp}] Using line ID: ${line.lineId} for line: ${line.lineNumber}`);

      // Get bus positions using the lineId
      const busesUrl = `${this.config.baseURL}${ENDPOINTS.LINES_BUSES.replace('{lineId}', line.lineId.toString())}`;
      console.log(`🚍 [${timestamp}] Buses URL:`, busesUrl);

      const busesResponse = await this.makeGetRequest<APIResponse<BusPositionResponse>>(busesUrl);

      console.log(`📊 [${timestamp}] Buses Response:`, {
        success: busesResponse.success,
        totalBuses: busesResponse.data?.totalBuses || 0,
        busesArrayLength: busesResponse.data?.buses?.length || 0,
        cached: busesResponse.meta?.cached,
        responseTime: busesResponse.meta?.responseTime,
        referenceTime: busesResponse.data?.referenceTime,
      });

      // Log raw buses data for debugging
      if (busesResponse.data?.buses) {
        console.log(`🔍 [${timestamp}] Raw buses data:`, busesResponse.data.buses);
      }

      if (!busesResponse.success) {
        console.error(`❌ [${timestamp}] API returned unsuccessful response for line ${lineCode}`);
        throw new Error(`Failed to fetch buses for line ${lineCode}`);
      }

      if (!busesResponse.data || !busesResponse.data.buses) {
        console.warn(`⚠️ [${timestamp}] No buses data in response for line ${lineCode}`);
        return [];
      }

      const buses = busesResponse.data.buses.map(busData => this.transformBusData(busData, lineCode));
      console.log(`✅ [${timestamp}] Found ${buses.length} buses for line ${lineCode}`);

      // Log individual bus transformations for debugging
      buses.forEach((bus, index) => {
        console.log(`🚌 [${timestamp}] Bus ${index + 1}:`, {
          id: bus.id,
          status: bus.status,
          lat: bus.latitude,
          lng: bus.longitude,
          lastUpdate: bus.lastUpdate.toISOString(),
        });
      });

      return buses;

    } catch (error) {
      console.error(`❌ [${timestamp}] Failed to fetch buses for line ${lineCode}:`, error);
      throw error;
    }
  }

  private transformBusData(busData: BusPositionResponse['buses'][0], lineCode: string): BusPosition {
    const timestamp = new Date().toISOString();

    console.log(`🔄 [${timestamp}] Transforming bus data:`, {
      rawVehicleId: busData.vehicleId,
      rawLatitude: busData.latitude,
      rawLongitude: busData.longitude,
      rawStatus: busData.status,
      rawLastUpdate: busData.lastUpdate,
      rawIsAccessible: busData.isAccessible,
    });

    const transformedBus = {
      id: `${busData.vehicleId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      lineCode,
      latitude: busData.latitude,
      longitude: busData.longitude,
      status: this.mapBusStatus(busData.status),
      lastUpdate: new Date(busData.lastUpdate),
      speed: 0, // Not provided by gateway
      direction: 0, // Not provided by gateway
    };

    console.log(`✅ [${timestamp}] Transformed bus:`, {
      id: transformedBus.id,
      lineCode: transformedBus.lineCode,
      latitude: transformedBus.latitude,
      longitude: transformedBus.longitude,
      status: transformedBus.status,
      lastUpdate: transformedBus.lastUpdate.toISOString(),
    });

    return transformedBus;
  }

  private mapBusStatus(status: string): BusStatus {
    const normalizedStatus = status.toLowerCase();
    const timestamp = new Date().toISOString();

    let mappedStatus: BusStatus;
    switch (normalizedStatus) {
      case 'active':
        mappedStatus = 'moving';
        break;
      case 'inactive':
        mappedStatus = 'offline';
        break;
      case 'stopped':
        mappedStatus = 'stopped';
        break;
      default:
        console.warn(`⚠️ [${timestamp}] Unknown bus status: "${status}", defaulting to 'moving'`);
        mappedStatus = 'moving';
        break;
    }

    console.log(`🔄 [${timestamp}] Status mapping: "${status}" → "${mappedStatus}"`);
    return mappedStatus;
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
    // Extract complete line code from displayName (e.g., "6824-10 - Terminal Lapa → Metrô Santana")
    const lineCodeMatch = lineData.displayName.match(/^(\d+(?:-\d+)?)/);
    const completeLineCode = lineCodeMatch ? lineCodeMatch[1] : lineData.lineNumber;

    return {
      code: completeLineCode,
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