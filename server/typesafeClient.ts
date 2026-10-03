import type {
  SystemOneQuestion,
  SystemOneRequest,
  SystemOneResponse,
} from '../services/typesafeTypes.js';

const TYPESAFE_API_URL = 'https://api.typesafe.ai/v1/systemone';
const DEFAULT_TIMEOUT_MS = 4000;

export const getTypeSafeApiKey = (): string | undefined => {
  return process.env.TYPESAFE_API_KEY;
};

export interface TypeSafeClientOptions {
  apiKey?: string;
  apiUrl?: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
}

export class TypeSafeClient {
  private readonly apiKey?: string;
  private readonly apiUrl: string;
  private readonly timeoutMs: number;
  private readonly fetcher: typeof fetch;

  constructor(options: TypeSafeClientOptions = {}) {
    this.apiKey = options.apiKey !== undefined ? options.apiKey : getTypeSafeApiKey();
    this.apiUrl = options.apiUrl || TYPESAFE_API_URL;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetcher = options.fetcher || globalThis.fetch;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async evaluate<Q extends Record<string, SystemOneQuestion>>(
    request: SystemOneRequest<Q>,
  ): Promise<SystemOneResponse | null> {
    if (!this.apiKey || !this.apiKey.trim()) {
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetcher(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.warn(`[TypeSafeClient] HTTP error ${response.status}: ${response.statusText}`);
        return null;
      }

      const data = (await response.json()) as SystemOneResponse;
      return data;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(`[TypeSafeClient] Request timed out after ${this.timeoutMs}ms`);
      } else {
        console.warn('[TypeSafeClient] Request failed:', error);
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const typesafeClient = new TypeSafeClient();
