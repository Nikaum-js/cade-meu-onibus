export type BusStatus = 'moving' | 'stopped' | 'delayed' | 'offline';

export interface BusPosition {
  id: string;
  lineCode: string;
  latitude: number;
  longitude: number;
  status: BusStatus;
  lastUpdate: Date;
  speed?: number;
  direction?: number;
}

export interface BusLine {
  code: string;
  name: string;
  direction: string;
  active: boolean;
}

export interface BusRoute {
  lineCode: string;
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  stops: BusStop[];
}

export interface BusStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  accessible: boolean;
}