import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ViatorApiOptions,
  RateLimitConfig,
  RateLimitInfo,
} from './interfaces/viator-api-options.interface';

@Injectable()
export class ViatorApiService {
  private readonly logger = new Logger(ViatorApiService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  // Rate limiting configuration
  private readonly defaultRateLimit: RateLimitConfig;
  private readonly endpointRateLimits: Map<string, RateLimitConfig>;
  private readonly requestLog: Map<string, RateLimitInfo[]>;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('VIATOR_API_URL', '');
    this.apiKey = this.configService.get<string>('VIATOR_API_KEY', '');

    // Rate limit configuration from env vars
    this.defaultRateLimit = {
      requestsPerMinute: this.configService.get<number>(
        'VIATOR_API_RATE_LIMIT_DEFAULT',
        60,
      ),
      maxRetries: this.configService.get<number>('VIATOR_API_MAX_RETRIES', 3),
      retryDelay: this.configService.get<number>(
        'VIATOR_API_RETRY_DELAY',
        1000,
      ),
    };

    // Initialize endpoint-specific rate limits
    this.endpointRateLimits = new Map<string, RateLimitConfig>();
    this.endpointRateLimits.set('search', {
      requestsPerMinute: this.configService.get<number>(
        'VIATOR_API_RATE_LIMIT_SEARCH',
        30,
      ),
      maxRetries: this.configService.get<number>('VIATOR_API_MAX_RETRIES', 3),
      retryDelay: this.configService.get<number>(
        'VIATOR_API_RETRY_DELAY',
        1000,
      ),
    });
    this.endpointRateLimits.set('availability', {
      requestsPerMinute: this.configService.get<number>(
        'VIATOR_API_RATE_LIMIT_AVAILABILITY',
        40,
      ),
      maxRetries: this.configService.get<number>('VIATOR_API_MAX_RETRIES', 3),
      retryDelay: this.configService.get<number>(
        'VIATOR_API_RETRY_DELAY',
        1000,
      ),
    });
    this.endpointRateLimits.set('booking', {
      requestsPerMinute: this.configService.get<number>(
        'VIATOR_API_RATE_LIMIT_BOOKING',
        20,
      ),
      maxRetries: this.configService.get<number>('VIATOR_API_MAX_RETRIES', 3),
      retryDelay: this.configService.get<number>(
        'VIATOR_API_RETRY_DELAY',
        1000,
      ),
    });

    // Initialize request log
    this.requestLog = new Map<string, RateLimitInfo[]>();

    if (!this.baseUrl || !this.apiKey) {
      this.logger.warn(
        'Viator API configuration missing. Check VIATOR_API_URL and VIATOR_API_KEY env variables.',
      );
    }
  }

  /**
   * Determines the rate limit configuration for a given endpoint
   */
  private getRateLimitConfig(endpoint: string): RateLimitConfig {
    // Check if the endpoint contains any of our known endpoint types
    if (
      endpoint.includes('products/search') ||
      endpoint.includes('search/freetext')
    ) {
      return this.endpointRateLimits.get('search') || this.defaultRateLimit;
    }
    if (endpoint.includes('availability')) {
      return (
        this.endpointRateLimits.get('availability') || this.defaultRateLimit
      );
    }
    if (endpoint.includes('booking')) {
      return this.endpointRateLimits.get('booking') || this.defaultRateLimit;
    }

    // Default rate limit for all other endpoints
    return this.defaultRateLimit;
  }

  /**
   * Checks if a request should be throttled based on rate limits
   */
  private shouldThrottle(endpoint: string): boolean {
    const config = this.getRateLimitConfig(endpoint);
    const endpointKey = this.getEndpointKey(endpoint);

    // Get recent requests for this endpoint
    const recentRequests = this.requestLog.get(endpointKey) || [];

    // Clean up old requests (older than 1 minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentValidRequests = recentRequests.filter(
      (req) => req.timestamp > oneMinuteAgo,
    );

    // Check if we're over the limit
    const isOverLimit = recentValidRequests.length >= config.requestsPerMinute;

    // Update the request log
    this.requestLog.set(endpointKey, recentValidRequests);

    return isOverLimit;
  }

  /**
   * Get a simplified key for the endpoint to use in rate limiting
   */
  private getEndpointKey(endpoint: string): string {
    // Extract the main endpoint path for rate limiting purposes
    const parts = endpoint.split('/');
    return parts.length > 1 ? parts[1] : endpoint;
  }

  /**
   * Add a request to the log
   */
  private logRequest(endpoint: string): void {
    const endpointKey = this.getEndpointKey(endpoint);
    const recentRequests = this.requestLog.get(endpointKey) || [];

    // Add the current request
    recentRequests.push({
      endpoint,
      timestamp: Date.now(),
    });

    // Update the log
    this.requestLog.set(endpointKey, recentRequests);
  }

  /**
   * Sleep for a given duration
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Make a request to the Viator API with rate limiting and retries
   */
  async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    data?: Record<string, unknown>,
    params?: Record<string, unknown>,
    language: string = 'en-US',
  ): Promise<T> {
    const options: ViatorApiOptions = {
      method,
      data,
      params,
      language,
      endpoint,
    };

    return this.makeRequestWithRetry<T>(endpoint, options);
  }

  /**
   * Make a request with retry logic
   */
  private async makeRequestWithRetry<T>(
    endpoint: string,
    options: ViatorApiOptions,
    retryCount = 0,
  ): Promise<T> {
    const config = this.getRateLimitConfig(endpoint);

    try {
      // Check if we should throttle this request
      if (this.shouldThrottle(endpoint)) {
        const delay = config.retryDelay * Math.pow(2, retryCount);
        this.logger.warn(
          `Rate limit reached for ${endpoint}, delaying for ${delay}ms`,
        );
        await this.sleep(delay);

        // Retry with incremented retry count
        if (retryCount < config.maxRetries) {
          return this.makeRequestWithRetry<T>(
            endpoint,
            options,
            retryCount + 1,
          );
        } else {
          this.logger.error(`Max retries reached for ${endpoint}`);
          throw new Error(`Rate limit exceeded for ${endpoint}`);
        }
      }

      // Log this request
      this.logRequest(endpoint);

      // Make the actual request
      let url = `${this.baseUrl}${endpoint}`;

      // Add query parameters if provided
      if (options.params) {
        try {
          const queryParams = new URLSearchParams();
          Object.entries(options.params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, String(value));
            }
          });
          const queryString = queryParams.toString();
          if (queryString) {
            url += `?${queryString}`;
          }
        } catch (paramError) {
          this.logger.error(
            `Error processing query params: ${paramError.message}`,
          );
        }
      }

      const headers = {
        'Accept-Language': options.language || 'en-US',
        Accept: 'application/json;version=2.0',
        'exp-api-key': this.apiKey,
        'Content-Type': 'application/json',
      };

      const requestOptions: RequestInit = {
        method: options.method,
        headers,
      };

      if (options.data && options.method === 'POST') {
        requestOptions.body = JSON.stringify(options.data);
      }

      this.logger.debug(`Making ${options.method} request to ${endpoint}`);
      const response = await fetch(url, requestOptions);

      // Check for rate limit response
      if (response.status === 429) {
        if (retryCount < config.maxRetries) {
          const delay = config.retryDelay * Math.pow(2, retryCount);
          this.logger.warn(
            `Rate limit response (429) from API for ${endpoint}, retrying in ${delay}ms`,
          );
          await this.sleep(delay);
          return this.makeRequestWithRetry<T>(
            endpoint,
            options,
            retryCount + 1,
          );
        } else {
          this.logger.error(
            `Max retries reached for ${endpoint} after receiving 429 responses`,
          );
          throw new Error(`Rate limit exceeded for ${endpoint} (429 response)`);
        }
      }

      // Check for server errors
      if (response.status >= 500) {
        if (retryCount < config.maxRetries) {
          const delay = config.retryDelay * Math.pow(2, retryCount);
          this.logger.warn(
            `Server error (${response.status}) for ${endpoint}, retrying in ${delay}ms`,
          );
          await this.sleep(delay);
          return this.makeRequestWithRetry<T>(
            endpoint,
            options,
            retryCount + 1,
          );
        }
      }

      // Parse rate limit headers if present
      const rateLimit = response.headers.get('RateLimit-Limit');
      const rateLimitRemaining = response.headers.get('RateLimit-Remaining');
      const rateLimitReset = response.headers.get('RateLimit-Reset');

      if (rateLimit && rateLimitRemaining && rateLimitReset) {
        this.logger.debug(
          `Rate limit info for ${endpoint}: ${rateLimitRemaining}/${rateLimit}, reset in ${rateLimitReset}s`,
        );
      }

      // Try to parse response as JSON
      let responseData: Record<string, unknown> = {};
      try {
        responseData = await response.json();
      } catch (jsonError) {
        this.logger.error(
          `Failed to parse response as JSON: ${jsonError.message}`,
        );
        responseData = {};
      }

      // Log warning for non-200 responses but don't throw error
      if (!response.ok) {
        this.logger.warn(
          `API returned non-OK status ${
            response.status
          } for ${endpoint}: ${JSON.stringify(responseData)}`,
        );
      }

      return responseData as T;
    } catch (error) {
      this.logger.error(
        `Error in makeRequest to ${endpoint}: ${error.message}`,
      );
      return {} as T;
    }
  }
}
