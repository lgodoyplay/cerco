import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

export interface FluxerApiConfig {
  baseUrl?: string;
  botToken?: string;
  bearerToken?: string;
  timeout?: number;
}

function buildUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function buildHeaders(config: FluxerApiConfig) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.botToken) {
    headers['Authorization'] = `Bot ${config.botToken}`;
  } else if (config.bearerToken) {
    headers['Authorization'] = `Bearer ${config.bearerToken}`;
  }

  return headers;
}

export class FluxerApiClient {
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor(config: FluxerApiConfig = {}) {
    this.baseUrl = (config.baseUrl || process.env.FLUXER_API_URL || 'https://api.fluxer.app/v1').replace(/\/$/, '');

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 15_000,
      headers: buildHeaders(config),
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        console.error('[Fluxer API]', status, message);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(buildUrl(this.baseUrl, path), config);
    return response.data;
  }

  async post<T>(path: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(buildUrl(this.baseUrl, path), body, config);
    return response.data;
  }

  async patch<T>(path: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(buildUrl(this.baseUrl, path), body, config);
    return response.data;
  }

  async put<T>(path: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(buildUrl(this.baseUrl, path), body, config);
    return response.data;
  }

  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(buildUrl(this.baseUrl, path), config);
    return response.data;
  }
}

export const fluxerApi = new FluxerApiClient({
  botToken: process.env.FLUXER_BOT_TOKEN,
  bearerToken: process.env.FLUXER_BEARER_TOKEN,
  baseUrl: process.env.FLUXER_API_URL || 'https://api.fluxer.app/v1',
});
