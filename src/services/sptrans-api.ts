import { API_CONFIG, ENDPOINTS } from '../constants/api';
import { retry } from '../utils/api';
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
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(this.authCookie && { Cookie: this.authCookie }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

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
      await retry(async () => {
        const response = await this.makeRequest<boolean>(
          `${ENDPOINTS.LOGIN}?token=${this.config.token}`,
          { method: 'POST' }
        );

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Authentication failed');
        }

        return response;
      }, this.config.retryAttempts);

      this.authenticated = true;

      // In a real implementation, you'd extract the cookie from response headers
      // For now, we'll simulate a successful authentication
      this.authCookie = 'authenticated=true';

      return {
        success: true,
        cookie: this.authCookie,
      };
    } catch (error) {
      this.authenticated = false;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  async fetchBusPositions(lineCode: string): Promise<BusPosition[]> {
    if (!this.authenticated) {
      const authResult = await this.authenticate();
      if (!authResult.success) {
        throw new Error('Failed to authenticate with SPTrans API');
      }
    }

    try {
      const result = await retry(async () => {
        const response = await this.makeRequest<BusPositionResponse>(
          `${ENDPOINTS.POSITIONS}?codigoLinha=${lineCode}`
        );

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch bus positions');
        }

        return response.data?.vs || [];
      }, this.config.retryAttempts);

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
        code: lineData.cl.toString(),
        name: lineData.tp || 'Unknown Line',
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