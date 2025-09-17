import { API_CONFIG, ENDPOINTS } from '../constants/api';
import { getSimulatedBusData, isDemoLine } from './demo-data';
import type { BusPosition, BusLine, BusStatus } from '../types/bus';

// API Response types from SPTrans documentation
interface SPTransLineResponse {
  cl: number;    // Internal line code
  lc: boolean;   // Circular line indicator
  lt: string;    // Line identifier part 1
  tl: number;    // Line identifier part 2
  sl: number;    // Direction (1 or 2)
  tp: string;    // Primary terminal description
  ts: string;    // Secondary terminal description
}

interface SPTransBusResponse {
  p: string;     // Vehicle prefix
  a: boolean;    // Accessibility
  ta: string;    // Last update timestamp (ISO 8601)
  py: number;    // Latitude
  px: number;    // Longitude
}

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
    // Use demo data if token is placeholder or line is in demo list
    if (this.config.token === 'YOUR_API_TOKEN_HERE' || isDemoLine(lineCode)) {
      console.log(`🚌 Using demo data for line ${lineCode}`);
      await this.simulateDelay();
      return getSimulatedBusData(lineCode);
    }

    console.log(`🚌 Fetching real data for line ${lineCode} from SPTrans API`);

    await this.ensureAuthenticated();

    try {
      const internalLineCode = await this.getInternalLineCode(lineCode);
      const buses = await this.fetchBusPositionsByInternalCode(internalLineCode, lineCode);

      console.log(`✅ Successfully found ${buses.length} buses for line ${lineCode}`);
      return buses;

    } catch (error) {
      console.error(`❌ Failed to fetch buses for line ${lineCode}:`, error);
      throw error;
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.authenticated) {
      const authSuccess = await this.authenticate();
      if (!authSuccess) {
        throw new Error('Failed to authenticate with SPTrans API');
      }
    }
  }

  private async getInternalLineCode(lineCode: string): Promise<number> {
    console.log(`🔍 Searching for line ${lineCode}...`);

    const url = `${this.config.baseURL}${ENDPOINTS.LINES}?termosBusca=${encodeURIComponent(lineCode)}`;
    const response = await this.makeGetRequest<SPTransLineResponse[]>(url);

    console.log(`📋 Found ${response.length} lines for "${lineCode}"`);

    if (response.length === 0) {
      throw new Error(`No lines found for ${lineCode}`);
    }

    const internalLineCode = response[0].cl;
    console.log(`🔢 Using internal line code: ${internalLineCode}`);

    return internalLineCode;
  }

  private async fetchBusPositionsByInternalCode(internalLineCode: number, originalLineCode: string): Promise<BusPosition[]> {
    const url = `${this.config.baseURL}${ENDPOINTS.POSITIONS}?codigoLinha=${internalLineCode}`;
    const response = await this.makeGetRequest<{ vs: SPTransBusResponse[] }>(url);

    const buses = response.vs || [];
    return buses.map(busData => this.transformBusData(busData, originalLineCode));
  }

  private transformBusData(busData: SPTransBusResponse, lineCode: string): BusPosition {
    return {
      id: `${busData.p}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lineCode,
      latitude: busData.py,
      longitude: busData.px,
      status: this.determineBusStatus(busData),
      lastUpdate: new Date(busData.ta),
      speed: 0, // Not provided by SPTrans API
      direction: 0, // Not provided by SPTrans API
    };
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

  private async simulateDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  }

  async fetchBusLines(searchTerm?: string): Promise<BusLine[]> {
    // Use demo data if token is placeholder
    if (this.config.token === 'YOUR_API_TOKEN_HERE') {
      console.log(`🚌 Using demo lines data`);
      return this.getDemoLines();
    }

    await this.ensureAuthenticated();

    try {
      const url = searchTerm
        ? `${this.config.baseURL}${ENDPOINTS.LINES}?termosBusca=${encodeURIComponent(searchTerm)}`
        : `${this.config.baseURL}${ENDPOINTS.LINES}`;

      const linesData = await this.makeGetRequest<SPTransLineResponse[]>(url);

      return linesData.map(lineData => this.transformLineData(lineData));
    } catch (error) {
      console.error('Failed to fetch bus lines:', error);
      throw error;
    }
  }

  private getDemoLines(): BusLine[] {
    return [
      { code: '6824-10', name: 'Lapa - Pirituba (DEMO)', direction: 'Ida/Volta', active: true },
      { code: '701U-10', name: 'Terminal São Miguel - Metrô Tucuruvi (DEMO)', direction: 'Ida/Volta', active: true },
      { code: '2029-10', name: 'Capão Redondo - Metrô Giovanni Gronchi (DEMO)', direction: 'Ida/Volta', active: true },
    ];
  }

  private transformLineData(lineData: SPTransLineResponse): BusLine {
    const lineNumber = `${lineData.lt}-${lineData.tl}`.replace(/^-|-$/g, '');
    const lineName = `${lineNumber} ${lineData.tp}`.trim();

    return {
      code: lineData.cl.toString(),
      name: lineName,
      direction: lineData.ts || 'Unknown Direction',
      active: true,
    };
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