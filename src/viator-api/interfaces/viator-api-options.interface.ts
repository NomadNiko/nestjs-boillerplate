export interface ViatorApiOptions {
  method?: 'GET' | 'POST';
  data?: Record<string, unknown>;
  params?: Record<string, unknown>;
  language?: string;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  endpoint?: string;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  maxRetries: number;
  retryDelay: number;
}

export interface RateLimitInfo {
  endpoint: string;
  timestamp: number;
}
