import { API_CONFIG, ENDPOINTS } from '../constants/api';
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
    console.log(`🚌 Attempting to use real SPTrans API for line ${lineCode}`);

    await this.ensureAuthenticated();

    try {
      const internalLineCode = await this.getInternalLineCode(lineCode);
      const buses = await this.fetchBusPositionsByInternalCode(internalLineCode, lineCode);

      console.log(`✅ Found ${buses.length} buses for line ${lineCode}`);
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

    // Try to find exact match first
    const exactMatch = response.find(line => {
      const publicLineCode = `${line.lt}-${line.tl}`.replace(/^-|-$/g, '');
      return publicLineCode === lineCode;
    });

    const selectedLine = exactMatch || response[0];
    const internalLineCode = selectedLine.cl;
    const publicLineCode = `${selectedLine.lt}-${selectedLine.tl}`.replace(/^-|-$/g, '');

    console.log(`🔢 Using internal line code: ${internalLineCode} for public line: ${publicLineCode}`);

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
      id: `${busData.p}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
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


  async fetchBusLines(searchTerm?: string): Promise<BusLine[]> {
    await this.ensureAuthenticated();

    try {
      const url = searchTerm
        ? `${this.config.baseURL}${ENDPOINTS.LINES}?termosBusca=${encodeURIComponent(searchTerm)}`
        : `${this.config.baseURL}${ENDPOINTS.LINES}`;

      const linesData = await this.makeGetRequest<SPTransLineResponse[]>(url);

      return linesData.map(lineData => this.transformLineData(lineData));
    } catch (error) {
      console.error('Failed to fetch bus lines:', error);
      console.log(`❌ API failed, returning empty results`);
      return [];
    }
  }

  async searchBusLines(searchTerm: string): Promise<BusLine[]> {
    if (!searchTerm.trim()) {
      return [];
    }

    await this.ensureAuthenticated();

    try {
      const url = `${this.config.baseURL}${ENDPOINTS.LINES}?termosBusca=${encodeURIComponent(searchTerm)}`;

      console.log(`🌐 API REQUEST GET: ${url}`);
      console.log(`📝 Search term: "${searchTerm}"`);

      const linesData = await this.makeGetRequest<SPTransLineResponse[]>(url);

      console.log(`📋 API RESPONSE - Found ${linesData.length} lines for search "${searchTerm}"`);
      console.log(`📄 Raw API Response:`, JSON.stringify(linesData, null, 2));

      // Log each line details for debugging
      linesData.forEach((line, index) => {
        console.log(`🚌 Line ${index + 1}:`, {
          internalCode: line.cl,
          publicCode: `${line.lt}-${line.tl}`,
          primaryTerminal: line.tp,
          secondaryTerminal: line.ts,
          direction: line.sl,
          circular: line.lc,
          rawData: line
        });
      });

      console.log(`🔍 ANALYSIS: Different terminals found:`);
      const uniqueTerminals = new Set();
      linesData.forEach(line => {
        uniqueTerminals.add(`Primary: ${line.tp}`);
        uniqueTerminals.add(`Secondary: ${line.ts}`);
      });
      console.log(`📍 Unique terminals:`, Array.from(uniqueTerminals));

      const transformedLines = linesData.map(lineData => {
        const transformed = this.transformLineData(lineData);
        console.log(`🔄 Transformed: ${JSON.stringify(lineData)} → ${JSON.stringify(transformed)}`);
        return transformed;
      });

      console.log(`✅ Final transformed lines:`, JSON.stringify(transformedLines, null, 2));

      return transformedLines;
    } catch (error) {
      console.error(`❌ API Error for search "${searchTerm}":`, error);

      // Return empty array on API failure
      console.log(`❌ API failed, returning empty results for "${searchTerm}"`);
      return [];
    }
  }


  private transformLineData(lineData: SPTransLineResponse): BusLine {
    const lineNumber = `${lineData.lt}-${lineData.tl}`.replace(/^-|-$/g, '');

    // Choose terminal based on direction for better variety
    let terminalName = '';
    if (lineData.sl === 1) {
      // Direction 1: Primary to Secondary - show primary
      terminalName = lineData.tp || '';
    } else {
      // Direction 2: Secondary to Primary - show secondary
      terminalName = lineData.ts || lineData.tp || '';
    }

    console.log(`🏷️ Direction ${lineData.sl}: Using terminal "${terminalName}" (tp: "${lineData.tp}", ts: "${lineData.ts}")`);

    return {
      code: lineNumber,
      name: terminalName,
      direction: lineData.sl === 1 ? 'Ida' : 'Volta',
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