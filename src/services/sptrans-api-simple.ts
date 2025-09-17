import { API_CONFIG, ENDPOINTS } from '../constants/api';
import { retry } from '../utils/api';
import { getSimulatedBusData } from './demo-data';
import type { BusPosition, BusLine, BusStatus } from '../types/bus';

export class SPTransAPISimple {
  private config = {
    baseURL: API_CONFIG.BASE_URL,
    token: API_CONFIG.TOKEN,
    timeout: API_CONFIG.TIMEOUT,
    retryAttempts: API_CONFIG.RETRY_ATTEMPTS,
  };

  private authenticated = false;

  async authenticate(): Promise<boolean> {
    try {
      console.log('🔐 Authenticating with SPTrans API...');

      const url = `${this.config.baseURL}${ENDPOINTS.LOGIN}?token=${this.config.token}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      const isAuthenticated = responseText === 'true';

      if (isAuthenticated) {
        this.authenticated = true;
        console.log('✅ SPTrans API authenticated successfully');
        return true;
      } else {
        console.error('❌ SPTrans API returned false for authentication');
        return false;
      }
    } catch (error) {
      console.error('❌ SPTrans API authentication failed:', error);
      return false;
    }
  }

  async fetchBusPositions(lineCode: string): Promise<BusPosition[]> {
    // Use demo data if token is placeholder
    if (this.config.token === 'YOUR_API_TOKEN_HERE') {
      console.log(`🚌 Using demo data for line ${lineCode} (no real token)`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return getSimulatedBusData(lineCode);
    }

    console.log(`🚌 Attempting to use real SPTrans API for line ${lineCode}`);

    // Authenticate if not already authenticated
    if (!this.authenticated) {
      const authSuccess = await this.authenticate();
      if (!authSuccess) {
        throw new Error('Failed to authenticate with SPTrans API');
      }
    }

    try {
      // Try a direct approach - search for the line first to get internal code
      console.log(`🔍 Searching for line ${lineCode}...`);

      const linesUrl = `${this.config.baseURL}${ENDPOINTS.LINES}?termosBusca=${encodeURIComponent(lineCode)}`;

      const linesResponse = await fetch(linesUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!linesResponse.ok) {
        throw new Error(`Failed to search lines: HTTP ${linesResponse.status}`);
      }

      const linesData = await linesResponse.json();
      console.log(`📋 Found ${linesData.length} lines for search term "${lineCode}"`);

      if (!linesData || linesData.length === 0) {
        throw new Error(`No lines found for ${lineCode}`);
      }

      // Use the first matching line's internal code
      const internalLineCode = linesData[0].cl;
      console.log(`🔢 Using internal line code: ${internalLineCode} for ${lineCode}`);

      // Now fetch bus positions using the internal code
      const positionsUrl = `${this.config.baseURL}${ENDPOINTS.POSITIONS}?codigoLinha=${internalLineCode}`;

      const positionsResponse = await fetch(positionsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!positionsResponse.ok) {
        throw new Error(`Failed to fetch positions: HTTP ${positionsResponse.status}`);
      }

      const positionsData = await positionsResponse.json();
      const buses = positionsData.vs || [];

      console.log(`✅ Found ${buses.length} buses for line ${lineCode}`);

      // Transform API data to our format
      return buses.map((busData: any): BusPosition => ({
        id: `${busData.p}-${Date.now()}-${Math.random()}`,
        lineCode: lineCode,
        latitude: busData.py,
        longitude: busData.px,
        status: this.determineBusStatus(busData),
        lastUpdate: new Date(busData.ta),
        speed: 0,
        direction: 0,
      }));

    } catch (error) {
      console.error('❌ Failed to fetch bus positions:', error);
      throw error;
    }
  }

  async fetchBusLines(searchTerm?: string): Promise<BusLine[]> {
    // Use demo data if token is placeholder
    if (this.config.token === 'YOUR_API_TOKEN_HERE') {
      console.log(`🚌 Using demo lines data`);
      return [
        { code: '6824-10', name: 'Lapa - Pirituba (DEMO)', direction: 'Ida/Volta', active: true },
        { code: '701U-10', name: 'Terminal São Miguel - Metrô Tucuruvi (DEMO)', direction: 'Ida/Volta', active: true },
      ];
    }

    if (!this.authenticated) {
      const authSuccess = await this.authenticate();
      if (!authSuccess) {
        throw new Error('Failed to authenticate with SPTrans API');
      }
    }

    try {
      const url = searchTerm
        ? `${this.config.baseURL}${ENDPOINTS.LINES}?termosBusca=${encodeURIComponent(searchTerm)}`
        : `${this.config.baseURL}${ENDPOINTS.LINES}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return data.map((lineData: any): BusLine => ({
        code: lineData.cl.toString(),
        name: `${lineData.lt || ''}-${lineData.tl || ''} ${lineData.tp || 'Unknown Line'}`.trim(),
        direction: lineData.ts || 'Unknown Direction',
        active: true,
      }));
    } catch (error) {
      console.error('Failed to fetch bus lines:', error);
      throw error;
    }
  }

  private determineBusStatus(busData: any): BusStatus {
    const lastUpdate = new Date(busData.ta);
    const now = new Date();
    const timeDiff = now.getTime() - lastUpdate.getTime();

    if (timeDiff > 10 * 60 * 1000) {
      return 'offline';
    }

    return 'moving';
  }

  checkConnection(): Promise<boolean> {
    return Promise.resolve(true);
  }

  getAuthStatus(): boolean {
    return this.authenticated;
  }

  invalidateAuth(): void {
    this.authenticated = false;
  }
}