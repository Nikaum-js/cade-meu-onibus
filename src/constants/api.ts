export const API_CONFIG = {
  BASE_URL: 'http://192.168.15.10:3000', // Use your machine's IP address
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  REFRESH_INTERVAL: 30000, // 30 seconds
};

export const ENDPOINTS = {
  LINES_SEARCH: '/api/lines/search',
  LINES_BUSES: '/api/lines/{lineId}/buses',
  LINES_DETAILS: '/api/lines/{lineId}/details',
  HEALTH: '/health',
} as const;