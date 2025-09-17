import { BusPosition, BusLine } from './bus';

export interface OlhoVivoConfig {
  baseURL: string;
  token: string;
  timeout: number;
  retryAttempts: number;
}

export interface AuthResult {
  success: boolean;
  cookie?: string;
  error?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface BusPositionResponse {
  vs: Array<{
    p: number; // código da linha
    a: boolean; // acessível
    ta: string; // horário última atualização
    py: number; // latitude
    px: number; // longitude
  }>;
}

export interface BusLineResponse {
  l: Array<{
    cl: number; // código da linha
    lc: boolean; // circular
    lt: number; // tipo de linha
    tl: number; // sentido
    tp: string; // descrição tipo
    ts: string; // descrição sentido
  }>;
}

export interface SearchSuggestion {
  lineCode: string;
  lineName: string;
}