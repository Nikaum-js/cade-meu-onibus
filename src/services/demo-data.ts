import type { BusPosition } from '../types/bus';

// Dados simulados para demonstração
export const DEMO_BUS_DATA: Record<string, BusPosition[]> = {
  '6824-10': [
    {
      id: '6824-001',
      lineCode: '6824-10',
      latitude: -23.5291,
      longitude: -46.6658,
      status: 'moving',
      lastUpdate: new Date(),
      speed: 25,
      direction: 45,
    },
    {
      id: '6824-002',
      lineCode: '6824-10',
      latitude: -23.5185,
      longitude: -46.6542,
      status: 'stopped',
      lastUpdate: new Date(Date.now() - 120000), // 2 minutes ago
      speed: 0,
      direction: 90,
    },
    {
      id: '6824-003',
      lineCode: '6824-10',
      latitude: -23.5398,
      longitude: -46.6729,
      status: 'moving',
      lastUpdate: new Date(Date.now() - 30000), // 30 seconds ago
      speed: 18,
      direction: 180,
    },
    {
      id: '6824-004',
      lineCode: '6824-10',
      latitude: -23.5156,
      longitude: -46.6389,
      status: 'offline',
      lastUpdate: new Date(Date.now() - 900000), // 15 minutes ago
      speed: 0,
      direction: 0,
    },
  ],
  '701U-10': [
    {
      id: '701U-001',
      lineCode: '701U-10',
      latitude: -23.5505,
      longitude: -46.6333,
      status: 'moving',
      lastUpdate: new Date(),
      speed: 32,
      direction: 270,
    },
    {
      id: '701U-002',
      lineCode: '701U-10',
      latitude: -23.5612,
      longitude: -46.6556,
      status: 'moving',
      lastUpdate: new Date(Date.now() - 45000),
      speed: 28,
      direction: 315,
    },
  ],
  '2029-10': [
    {
      id: '2029-001',
      lineCode: '2029-10',
      latitude: -23.5892,
      longitude: -46.6198,
      status: 'stopped',
      lastUpdate: new Date(Date.now() - 180000), // 3 minutes ago
      speed: 0,
      direction: 0,
    },
    {
      id: '2029-002',
      lineCode: '2029-10',
      latitude: -23.5734,
      longitude: -46.6445,
      status: 'moving',
      lastUpdate: new Date(Date.now() - 15000),
      speed: 22,
      direction: 135,
    },
    {
      id: '2029-003',
      lineCode: '2029-10',
      latitude: -23.5623,
      longitude: -46.6301,
      status: 'moving',
      lastUpdate: new Date(),
      speed: 30,
      direction: 60,
    },
  ],
  '177A-10': [
    {
      id: '177A-001',
      lineCode: '177A-10',
      latitude: -23.5087,
      longitude: -46.6792,
      status: 'moving',
      lastUpdate: new Date(Date.now() - 60000),
      speed: 35,
      direction: 225,
    },
  ],
  '175R-10': [
    {
      id: '175R-001',
      lineCode: '175R-10',
      latitude: -23.4876,
      longitude: -46.6998,
      status: 'stopped',
      lastUpdate: new Date(Date.now() - 300000), // 5 minutes ago
      speed: 0,
      direction: 0,
    },
    {
      id: '175R-002',
      lineCode: '175R-10',
      latitude: -23.5043,
      longitude: -46.6845,
      status: 'moving',
      lastUpdate: new Date(Date.now() - 20000),
      speed: 26,
      direction: 150,
    },
  ],
};

// Simula variação na posição dos ônibus para demo dinâmica
export function getSimulatedBusData(lineCode: string): BusPosition[] {
  const buses = DEMO_BUS_DATA[lineCode] || [];

  return buses.map(bus => {
    // Simula movimento apenas para ônibus em movimento
    if (bus.status === 'moving') {
      const variation = 0.001; // ~100 metros
      const latVariation = (Math.random() - 0.5) * variation;
      const lngVariation = (Math.random() - 0.5) * variation;

      return {
        ...bus,
        id: `${bus.lineCode}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        latitude: bus.latitude + latVariation,
        longitude: bus.longitude + lngVariation,
        lastUpdate: new Date(),
        speed: bus.speed ? bus.speed + Math.floor((Math.random() - 0.5) * 10) : 0,
      };
    }

    return {
      ...bus,
      id: `${bus.lineCode}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  });
}

// Lista de linhas disponíveis na demo
export const DEMO_LINES = [
  { code: '6824-10', name: 'Lapa - Pirituba' },
  { code: '701U-10', name: 'Terminal São Miguel - Metrô Tucuruvi' },
  { code: '2029-10', name: 'Capão Redondo - Metrô Giovanni Gronchi' },
  { code: '177A-10', name: 'Terminal Pirituba - Shopping Eldorado' },
  { code: '175R-10', name: 'Jardim Rincão - Terminal Pirituba' },
];

export function isDemoLine(lineCode: string): boolean {
  return lineCode in DEMO_BUS_DATA;
}