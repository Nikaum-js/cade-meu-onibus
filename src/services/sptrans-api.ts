import { API_CONFIG, ENDPOINTS } from '../constants/api';
import { retry } from '../utils/api';
import { getSimulatedBusData, isDemoLine, DEMO_LINES } from './demo-data';
import type {
  OlhoVivoConfig,
  AuthResult,
  APIResponse,
  BusPositionResponse,
  BusLineResponse
} from '../types/api';
import type { BusPosition, BusLine, BusStatus } from '../types/bus';

export class SPTransAPI {
  private config: OlhoVivoConfig;
  private authenticated = false;
  private authCookie: string = '';
  private sessionHeaders: Record<string, string> = {};

  constructor() {
    this.config = {
      baseURL: API_CONFIG.BASE_URL,
      token: API_CONFIG.TOKEN,
      timeout: API_CONFIG.TIMEOUT,
      retryAttempts: API_CONFIG.RETRY_ATTEMPTS,
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      };

      // Add authentication headers
      if (this.authenticated) {
        if (this.authCookie) {
          headers['Cookie'] = this.authCookie;
        }
        // Some APIs might need the token in every request
        // Let's also try adding it as a query parameter for authenticated requests
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data: T;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // For boolean responses like authentication
        const text = await response.text();
        data = (text === 'true') as unknown as T;
      }

      return {
        success: true,
        data,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  async authenticate(): Promise<AuthResult> {
    try {
      const url = `${this.config.baseURL}${ENDPOINTS.LOGIN}?token=${this.config.token}`;

      const response = await retry(async () => {
        const fetchResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!fetchResponse.ok) {
          throw new Error(`HTTP error! status: ${fetchResponse.status}`);
        }

        const responseText = await fetchResponse.text();
        const isAuthenticated = responseText === 'true';

        if (!isAuthenticated) {
          throw new Error('Authentication failed - API returned false');
        }

        // Extract cookies from response headers
        const setCookieHeader = fetchResponse.headers.get('set-cookie');
        console.log('Set-Cookie header:', setCookieHeader);

        if (setCookieHeader) {
          // Parse the cookie from Set-Cookie header
          this.authCookie = setCookieHeader.split(';')[0];
          console.log('Extracted cookie:', this.authCookie);
        } else {
          // The SPTrans API might not use traditional cookies
          // We'll try to maintain the session by sending the token in subsequent requests
          console.log('No Set-Cookie header found, using alternative session management');
          this.authCookie = '';
        }

        return { success: true, authenticated: isAuthenticated };
      }, this.config.retryAttempts);

      this.authenticated = true;

      console.log('✅ SPTrans API authenticated successfully');

      return {
        success: true,
        cookie: this.authCookie,
      };
    } catch (error) {
      this.authenticated = false;
      console.error('❌ SPTrans API authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  async fetchBusPositions(lineCode: string): Promise<BusPosition[]> {
    // Check if we should use demo data (only if token is placeholder)
    if (this.config.token === 'YOUR_API_TOKEN_HERE') {
      console.log(`🚌 Using demo data for line ${lineCode} (no real token)`);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      return getSimulatedBusData(lineCode);
    }

    console.log(`🚌 Attempting to use real SPTrans API for line ${lineCode}`);

    if (!this.authenticated) {
      const authResult = await this.authenticate();
      if (!authResult.success) {
        throw new Error('Failed to authenticate with SPTrans API');
      }
    }

    try {
      // First, we need to find the line code (cl) from the line identifier
      // The lineCode parameter is like "6824-10", but we need the internal code
      const lines = await this.fetchBusLines(lineCode);

      if (lines.length === 0) {
        throw new Error(`Line ${lineCode} not found`);
      }

      // Use the first matching line's internal code
      const internalLineCode = lines[0].code;

      console.log(`🚌 Fetching positions for line ${lineCode} (internal code: ${internalLineCode})`);

      const result = await retry(async () => {
        const response = await this.makeRequest<any>(
          `${ENDPOINTS.POSITIONS}?codigoLinha=${internalLineCode}`
        );

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch bus positions');
        }

        return response.data?.vs || [];
      }, this.config.retryAttempts);

      console.log(`✅ Found ${result.length} buses for line ${lineCode}`);

      // Transform API data to our format
      return result.map((busData: any): BusPosition => ({
        id: `${busData.p}-${Date.now()}-${Math.random()}`,
        lineCode: lineCode,
        latitude: busData.py,
        longitude: busData.px,
        status: this.determineBusStatus(busData),
        lastUpdate: new Date(busData.ta),
        speed: 0, // SPTrans doesn't provide speed data
        direction: 0, // SPTrans doesn't provide direction data
      }));
    } catch (error) {
      console.error('Failed to fetch bus positions:', error);
      throw error;
    }
  }

  async fetchBusLines(searchTerm?: string): Promise<BusLine[]> {
    // Use demo data if token is placeholder
    if (this.config.token === 'YOUR_API_TOKEN_HERE') {
      console.log(`🚌 Using demo lines data`);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

      let filteredLines = DEMO_LINES;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredLines = DEMO_LINES.filter(line =>
          line.code.toLowerCase().includes(searchLower) ||
          line.name.toLowerCase().includes(searchLower)
        );
      }

      return filteredLines.map(line => ({
        code: line.code,
        name: line.name,
        direction: 'Ida/Volta',
        active: true,
      }));
    }

    if (!this.authenticated) {
      const authResult = await this.authenticate();
      if (!authResult.success) {
        throw new Error('Failed to authenticate with SPTrans API');
      }
    }

    try {
      const endpoint = searchTerm
        ? `${ENDPOINTS.LINES}?termosBusca=${encodeURIComponent(searchTerm)}`
        : ENDPOINTS.LINES;

      const result = await retry(async () => {
        const response = await this.makeRequest<BusLineResponse>(endpoint);

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch bus lines');
        }

        return response.data?.l || [];
      }, this.config.retryAttempts);

      return result.map((lineData: any): BusLine => ({
        code: lineData.cl.toString(), // This is the internal code needed for position queries
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
    // Since SPTrans doesn't provide status directly, we'll use heuristics
    const lastUpdate = new Date(busData.ta);
    const now = new Date();
    const timeDiff = now.getTime() - lastUpdate.getTime();

    // If last update was more than 10 minutes ago, consider offline
    if (timeDiff > 10 * 60 * 1000) {
      return 'offline';
    }

    // For now, assume all buses are moving unless proven otherwise
    return 'moving';
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseURL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  getAuthStatus(): boolean {
    return this.authenticated;
  }

  invalidateAuth(): void {
    this.authenticated = false;
    this.authCookie = '';
  }
}