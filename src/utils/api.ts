export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < attempts - 1) {
        await delay(delayMs * Math.pow(2, i)); // Exponential backoff
      }
    }
  }

  throw lastError!;
}

export function validateLineCode(lineCode: string): boolean {
  // SPTrans line code format: NNNN-NN or NNNNA-NN
  const lineCodePattern = /^\d{4}[A-Z]?-\d{2}$/;
  return lineCodePattern.test(lineCode);
}

export function transformBusPositionData(apiData: any): any {
  // Transform SPTrans API response to our BusPosition format
  return {
    id: `${apiData.p}-${Date.now()}`, // Generate unique ID
    lineCode: apiData.p?.toString() || '',
    latitude: apiData.py || 0,
    longitude: apiData.px || 0,
    status: apiData.a ? 'moving' : 'stopped',
    lastUpdate: new Date(apiData.ta || Date.now()),
    accessible: apiData.a || false,
  };
}