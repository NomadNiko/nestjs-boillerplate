// src/viator-availability/viator-availability.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ViatorApiService } from '../viator-api/viator-api.service';
import {
  AvailabilityCheckRequestDto,
  AvailabilityResponseDto,
} from './dto/viator-availability.dto';
import {
  ViatorAvailabilitySchemaClass,
  ViatorAvailabilitySchemaDocument,
} from './viator-availability.schema';

@Injectable()
export class ViatorAvailabilityService {
  private readonly logger = new Logger(ViatorAvailabilityService.name);

  constructor(
    private readonly viatorApiService: ViatorApiService,
    @InjectModel(ViatorAvailabilitySchemaClass.name)
    private readonly availabilityModel: Model<ViatorAvailabilitySchemaDocument>,
  ) {}

  async checkAvailability(
    request: AvailabilityCheckRequestDto,
  ): Promise<Record<string, unknown>> {
    try {
      this.logger.log(
        `Checking availability for product: ${request.productCode}`,
      );

      // Parse dates properly
      const startDate = request.startDate
        ? new Date(request.startDate)
        : undefined;
      const endDate = request.endDate ? new Date(request.endDate) : undefined;

      // Validate dates to ensure they're valid
      if (startDate && isNaN(startDate.getTime())) {
        throw new Error(`Invalid startDate: ${request.startDate}`);
      }

      if (endDate && isNaN(endDate.getTime())) {
        throw new Error(`Invalid endDate: ${request.endDate}`);
      }

      // Try to get from cache first
      const cachedAvailability = await this.getCachedAvailability(
        request.productCode,
        startDate,
        endDate,
      );

      if (
        cachedAvailability &&
        this.isCacheValid(cachedAvailability.lastRefreshed)
      ) {
        return cachedAvailability.availability as Record<string, unknown>;
      }

      // If not in cache or expired, fetch from API
      const availability = await this.viatorApiService.makeRequest<
        Record<string, unknown>
      >(`/availability/schedules/${request.productCode}`);

      if (availability && availability.productCode) {
        // Cache the availability data
        if (startDate) {
          await this.cacheAvailability(
            request.productCode,
            startDate,
            endDate,
            availability,
          );
        }
        return availability;
      }

      // If API request failed but we have expired cache, use it
      if (cachedAvailability) {
        return cachedAvailability.availability as Record<string, unknown>;
      }

      // Return empty response if nothing found
      return {
        productCode: request.productCode,
        bookableItems: [],
        currency: request.currency || 'USD',
        summary: {},
      };
    } catch (error) {
      this.logger.error(`Error checking availability: ${error.message}`);
      return {
        productCode: request.productCode,
        bookableItems: [],
        currency: request.currency || 'USD',
        summary: {},
      };
    }
  }

  private async getCachedAvailability(
    productCode: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ViatorAvailabilitySchemaDocument | null> {
    try {
      if (!productCode) {
        this.logger.warn(
          'Cannot get cached availability: productCode is undefined',
        );
        return null;
      }

      // Validate dates
      if (startDate && isNaN(startDate.getTime())) {
        this.logger.warn(`Invalid startDate for cache lookup: ${startDate}`);
        return null;
      }

      if (endDate && isNaN(endDate.getTime())) {
        this.logger.warn(`Invalid endDate for cache lookup: ${endDate}`);
        return null;
      }

      const query: Record<string, unknown> = { productCode };

      if (startDate && !isNaN(startDate.getTime())) {
        query.startDate = { $lte: startDate };
      }

      if (endDate && !isNaN(endDate.getTime())) {
        query.endDate = { $gte: endDate };
      } else if (startDate && !isNaN(startDate.getTime())) {
        query.endDate = { $gte: startDate };
      }

      return this.availabilityModel.findOne(query).exec();
    } catch (error) {
      this.logger.error(`Error getting cached availability: ${error.message}`);
      return null;
    }
  }

  private async cacheAvailability(
    productCode: string,
    startDate: Date,
    endDate: Date | undefined,
    availability: Record<string, unknown>,
  ): Promise<void> {
    try {
      if (!productCode) {
        this.logger.warn('Cannot cache availability: productCode is undefined');
        return;
      }

      // Validate dates
      if (isNaN(startDate.getTime())) {
        this.logger.warn(
          `Cannot cache availability: invalid startDate ${startDate}`,
        );
        return;
      }

      // If no end date provided, set it to 30 days after start date
      const effectiveEndDate =
        endDate && !isNaN(endDate.getTime()) ? endDate : new Date(startDate);

      if (!endDate || isNaN(endDate.getTime())) {
        effectiveEndDate.setDate(effectiveEndDate.getDate() + 30);
      }

      await this.availabilityModel.updateOne(
        {
          productCode,
          startDate: { $lte: startDate },
          endDate: { $gte: effectiveEndDate },
        },
        {
          $set: {
            productCode,
            startDate,
            endDate: effectiveEndDate,
            availability,
            lastRefreshed: new Date(),
          },
        },
        { upsert: true },
      );
    } catch (error) {
      this.logger.error(`Error caching availability: ${error.message}`);
    }
  }

  private isCacheValid(lastRefreshed: Date): boolean {
    // Cache is valid for 1 hour (availability changes frequently)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    return lastRefreshed > oneHourAgo;
  }
}
