import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

class ApiClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "GET", url: path });
  }

  async post<T, TBody = unknown>(
    path: string,
    data?: TBody,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.request<T>({ ...config, method: "POST", url: path, data });
  }

  async put<T, TBody = unknown>(
    path: string,
    data?: TBody,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.request<T>({ ...config, method: "PUT", url: path, data });
  }

  async patch<T, TBody = unknown>(
    path: string,
    data?: TBody,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.request<T>({ ...config, method: "PATCH", url: path, data });
  }

  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "DELETE", url: path });
  }
}

export const apiClient = new ApiClient();
