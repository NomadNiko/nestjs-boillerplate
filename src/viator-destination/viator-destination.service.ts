// src/viator-destination/viator-destination.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ViatorApiService } from '../viator-api/viator-api.service';
import { ViatorDestinationDto } from './dto/viator-destination.dto';
import { DestinationSearchResultDto } from './dto/destination-search.dto';
import {
  ViatorDestinationSchemaClass,
  ViatorDestinationSchemaDocument,
} from './viator-destination.schema';

@Injectable()
export class ViatorDestinationService {
  private readonly logger = new Logger(ViatorDestinationService.name);

  constructor(
    private readonly viatorApiService: ViatorApiService,
    @InjectModel(ViatorDestinationSchemaClass.name)
    private readonly destinationModel: Model<ViatorDestinationSchemaDocument>,
  ) {}

  async fetchAllDestinations(): Promise<void> {
    try {
      this.logger.log('Fetching all destinations from Viator API');
      let allDestinations: any[] = [];
      try {
        const response = await this.viatorApiService.makeRequest<{
          destinations?: any[];
          totalCount?: number;
        }>('/destinations');
        this.logger.log(
          `Retrieved ${
            response.destinations?.length || 0
          } destinations from Viator API`,
        );
        allDestinations = response.destinations || [];
      } catch (apiError) {
        this.logger.error(
          `API error when fetching destinations: ${
            apiError.message || apiError
          }`,
        );
        // Continue execution despite API error
      }

      // Process and save each destination
      let savedCount = 0;
      let errorCount = 0;
      for (const destination of allDestinations) {
        try {
          await this.saveDestination(destination);
          savedCount++;
        } catch (saveError) {
          errorCount++;
          this.logger.error(
            `Failed to save destination: ${saveError.message || saveError}`,
          );
          // Continue with next destination despite error
        }
      }
      this.logger.log(
        `Destinations processed: ${savedCount} saved, ${errorCount} failed`,
      );
    } catch (error) {
      this.logger.error(
        `Error in fetchAllDestinations: ${error.message || error}`,
      );
      // Don't rethrow - just log the error
    }
  }

  private async saveDestination(destinationData: any): Promise<void> {
    try {
      // Handle case where data might be invalid
      if (!destinationData) {
        this.logger.warn('Received undefined or null destination data');
        return;
      }

      // Try to get destination ID, skip if missing
      const destinationId = destinationData.destinationId;
      if (destinationId === undefined || destinationId === null) {
        this.logger.warn('Skipping destination with missing ID');
        return;
      }

      const existingDestination = await this.destinationModel.findOne({
        destinationId: destinationId,
      });

      if (existingDestination) {
        // Update existing destination, only set fields that exist
        const transformedData = this.transformDestinationData(destinationData);
        await this.destinationModel.updateOne(
          { destinationId: destinationId },
          {
            $set: {
              ...transformedData,
              lastRefreshed: new Date(),
            },
          },
        );
      } else {
        // Create new destination
        const newDestination = new this.destinationModel({
          ...this.transformDestinationData(destinationData),
          lastRefreshed: new Date(),
        });
        await newDestination.save({ validateBeforeSave: false }); // Skip validation
      }
    } catch (error) {
      this.logger.error(
        `Failed to save destination ${destinationData?.destinationId}: ${
          error.message || error
        }`,
      );
      // Don't rethrow error, just log it
    }
  }

  private transformDestinationData(
    destinationData: any,
  ): Partial<ViatorDestinationSchemaClass> {
    // Create a safe object with all possible fields, handling any missing data
    return {
      destinationId: destinationData.destinationId,
      name: destinationData.name || `Unknown-${Date.now()}`, // Fallback value
      type: destinationData.type || 'UNKNOWN',
      parentDestinationId: destinationData.parentDestinationId || 0,
      lookupId: destinationData.lookupId || `unknown-${Date.now()}`,
      destinationUrl: destinationData.destinationUrl,
      defaultCurrencyCode: destinationData.defaultCurrencyCode,
      timeZone: destinationData.timeZone,
      iataCodes: Array.isArray(destinationData.iataCodes)
        ? destinationData.iataCodes
        : [],
      countryCallingCode: destinationData.countryCallingCode,
      languages: Array.isArray(destinationData.languages)
        ? destinationData.languages
        : [],
      latitude: destinationData.center?.latitude,
      longitude: destinationData.center?.longitude,
      // Store the raw data to prevent data loss
      additionalData: destinationData,
    };
  }

  async findAll(): Promise<ViatorDestinationDto[]> {
    try {
      const destinations = await this.destinationModel.find().lean();
      return destinations.map((destination) =>
        this.transformToDto(destination),
      );
    } catch (error) {
      this.logger.error(
        `Error finding all destinations: ${error.message || error}`,
      );
      return []; // Return empty array instead of throwing
    }
  }

  async findById(destinationId: number): Promise<ViatorDestinationDto> {
    try {
      const destination = await this.destinationModel
        .findOne({ destinationId })
        .lean();
      if (!destination) {
        this.logger.warn(`Destination with ID ${destinationId} not found`);
        return {
          destinationId: destinationId,
          name: `Unknown Destination ${destinationId}`,
          type: 'UNKNOWN',
          parentDestinationId: 0,
          lookupId: `unknown-${destinationId}`,
        } as ViatorDestinationDto;
      }
      return this.transformToDto(destination);
    } catch (error) {
      this.logger.error(
        `Error finding destination by ID: ${error.message || error}`,
      );
      // Return a fallback destination instead of throwing
      return {
        destinationId: destinationId,
        name: `Error Finding Destination ${destinationId}`,
        type: 'ERROR',
        parentDestinationId: 0,
        lookupId: `error-${destinationId}`,
      } as ViatorDestinationDto;
    }
  }

  async findByParentId(parentId: number): Promise<ViatorDestinationDto[]> {
    try {
      const destinations = await this.destinationModel
        .find({ parentDestinationId: parentId })
        .lean();
      return destinations.map((destination) =>
        this.transformToDto(destination),
      );
    } catch (error) {
      this.logger.error(
        `Error finding destinations by parent ID: ${error.message || error}`,
      );
      return []; // Return empty array instead of throwing
    }
  }

  async searchDestinations(
    query: string,
    limit: number = 10,
  ): Promise<DestinationSearchResultDto[]> {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      this.logger.log(`Searching destinations for query: ${query}`);

      // Create a case-insensitive regex for the search
      const searchRegex = new RegExp(query, 'i');

      // Search in the local database
      const destinations = await this.destinationModel
        .find({ name: searchRegex })
        .limit(limit)
        .lean();

      // Transform results
      const results: DestinationSearchResultDto[] = [];

      for (const destination of destinations) {
        if (!destination) continue;

        let parentName = '';
        if (destination.parentDestinationId) {
          const parent = await this.destinationModel
            .findOne({ destinationId: destination.parentDestinationId })
            .lean();
          parentName = parent?.name || '';
        }

        results.push({
          destinationId: destination.destinationId,
          name: destination.name || '',
          type: destination.type || '',
          parentDestinationId: destination.parentDestinationId,
          parentName,
        });
      }

      return results;
    } catch (error) {
      this.logger.error(`Error searching destinations: ${error.message}`);
      return [];
    }
  }

  async getPopularDestinations(
    limit: number = 10,
  ): Promise<DestinationSearchResultDto[]> {
    try {
      this.logger.log('Getting popular destinations');

      // Since we don't have real popularity data, we'll use a predefined list
      const popularDestinationIds = [
        687, 737, 662, 684, 661, 55, 664, 525, 4771, 4232,
      ];

      const destinations = await this.destinationModel
        .find({ destinationId: { $in: popularDestinationIds } })
        .lean();

      // Create a map for faster lookups
      const destinationsMap: Record<number, any> = {};
      destinations.forEach((dest) => {
        if (dest && dest.destinationId) {
          destinationsMap[dest.destinationId] = dest;
        }
      });

      // Sort according to the predefined order
      const results: DestinationSearchResultDto[] = [];

      // Process each popular destination ID in order
      for (const destId of popularDestinationIds) {
        const destination = destinationsMap[destId];
        if (!destination) continue;

        let parentName = '';
        if (destination.parentDestinationId) {
          const parent = await this.destinationModel
            .findOne({ destinationId: destination.parentDestinationId })
            .lean();
          parentName = parent?.name || '';
        }

        results.push({
          destinationId: destination.destinationId,
          name: destination.name || '',
          type: destination.type || '',
          parentDestinationId: destination.parentDestinationId,
          parentName,
        });

        // Stop if we've reached the limit
        if (results.length >= limit) break;
      }

      return results;
    } catch (error) {
      this.logger.error(`Error getting popular destinations: ${error.message}`);
      return [];
    }
  }

  private transformToDto(destination: any): ViatorDestinationDto {
    try {
      return {
        destinationId: destination.destinationId,
        name: destination.name || 'Unknown',
        type: destination.type || 'UNKNOWN',
        parentDestinationId: destination.parentDestinationId || 0,
        lookupId: destination.lookupId || 'unknown',
        destinationUrl: destination.destinationUrl,
        defaultCurrencyCode: destination.defaultCurrencyCode,
        timeZone: destination.timeZone,
        iataCodes: destination.iataCodes || [],
        countryCallingCode: destination.countryCallingCode,
        languages: destination.languages || [],
        center:
          destination.latitude && destination.longitude
            ? {
                type: 'Point',
                coordinates: [destination.longitude, destination.latitude],
              }
            : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Error transforming destination to DTO: ${error.message || error}`,
      );
      // Return a minimal object instead of throwing
      return {
        destinationId: destination.destinationId || 0,
        name: 'Error Processing Destination',
        type: 'ERROR',
        parentDestinationId: 0,
        lookupId: 'error',
      };
    }
  }
}
