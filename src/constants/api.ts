export const API_CONFIG = {
  BASE_URL: 'http://api.olhovivo.sptrans.com.br/v2.1',
  TOKEN: '27b2832b3776bed3d4db8ab82c0e62d09182c2d8ebf142c48baded1ce78461f8', // Replace with actual token
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  REFRESH_INTERVAL: 30000, // 30 seconds
};

export const ENDPOINTS = {
  LOGIN: '/Login/Autenticar',
  LINES: '/Linha/Buscar',
  POSITIONS: '/Posicao/Linha',
  STOPS: '/Parada/Buscar',
} as const;

export const POPULAR_LINES = [
  { code: '6824-10', name: 'Lapa - Pirituba' },
  { code: '701U-10', name: 'Terminal São Miguel - Metrô Tucuruvi' },
  { code: '2029-10', name: 'Capão Redondo - Metrô Giovanni Gronchi' },
  { code: '177A-10', name: 'Terminal Pirituba - Shopping Eldorado' },
  { code: '175R-10', name: 'Jardim Rincão - Terminal Pirituba' },
] as const;