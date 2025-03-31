// src/viator-location/viator-location.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ViatorApiService } from '../viator-api/viator-api.service';
import { ViatorLocationDto } from './dto/viator-location.dto';
import {
  ViatorLocationSchemaClass,
  ViatorLocationSchemaDocument,
} from './viator-location.schema';

@Injectable()
export class ViatorLocationService {
  private readonly logger = new Logger(ViatorLocationService.name);
  private readonly maxLocationBulkSize = 500; // Viator's limit for bulk location requests

  constructor(
    private readonly viatorApiService: ViatorApiService,
    @InjectModel(ViatorLocationSchemaClass.name)
    private readonly locationModel: Model<ViatorLocationSchemaDocument>,
  ) {}

  async fetchLocationsByReferences(references: string[]): Promise<void> {
    try {
      this.logger.log(
        `Fetching ${references.length} locations from Viator API`,
      );

      // Filter out empty or invalid references
      const validReferences = (references || []).filter((ref) => !!ref);

      if (validReferences.length === 0) {
        this.logger.log('No valid references to fetch');
        return;
      }

      // Process in batches of maxLocationBulkSize
      let successCount = 0;
      let errorCount = 0;

      for (
        let i = 0;
        i < validReferences.length;
        i += this.maxLocationBulkSize
      ) {
        try {
          const batch = validReferences.slice(i, i + this.maxLocationBulkSize);

          let response;
          try {
            response = await this.viatorApiService.makeRequest<{
              locations: any[];
            }>('/locations/bulk', 'POST', { locations: batch });
          } catch (apiError) {
            this.logger.error(
              `API error when fetching locations batch ${i}-${
                i + batch.length
              }: ${apiError.message || apiError}`,
            );
            errorCount += batch.length;
            continue; // Skip to next batch
          }

          const locations = response?.locations || [];

          // Process and save each location
          for (const location of locations) {
            try {
              await this.saveLocation(location);
              successCount++;
            } catch (saveError) {
              errorCount++;
              this.logger.error(
                `Failed to save location ${location?.reference}: ${
                  saveError.message || saveError
                }`,
              );
              // Continue with next location despite error
            }
          }
        } catch (batchError) {
          this.logger.error(
            `Error processing location batch: ${
              batchError.message || batchError
            }`,
          );
          errorCount += this.maxLocationBulkSize;
          // Continue with next batch
        }
      }

      this.logger.log(
        `Locations processed: ${successCount} saved, ${errorCount} failed`,
      );
    } catch (error) {
      this.logger.error(`Failed to fetch locations: ${error.message || error}`);
      // Don't rethrow - just log the error
    }
  }
  private async saveLocation(locationData: any): Promise<void> {
    try {
      // Handle null location data
      if (!locationData) {
        this.logger.warn('Skipping null location data');
        return;
      }

      // Skip if no reference provided
      if (!locationData.reference) {
        this.logger.warn('Skipping location with missing reference');
        return;
      }

      const existingLocation = await this.locationModel.findOne({
        reference: locationData.reference,
      });

      if (existingLocation) {
        // Update existing location
        await this.locationModel.updateOne(
          { reference: locationData.reference },
          {
            $set: {
              ...this.transformLocationData(locationData),
              lastRefreshed: new Date(),
            },
          },
        );
      } else {
        // Create new location
        const newLocation = new this.locationModel({
          ...this.transformLocationData(locationData),
          lastRefreshed: new Date(),
        });

        await newLocation.save({ validateBeforeSave: false }); // Skip validation
      }
    } catch (error) {
      this.logger.error(
        `Failed to save location ${locationData?.reference}: ${
          error.message || error
        }`,
      );
      // Don't rethrow - just log the error
    }
  }

  private transformLocationData(
    locationData: any,
  ): Partial<ViatorLocationSchemaClass> {
    try {
      // Create a safe object with defaults for missing data
      return {
        reference: locationData.reference,
        provider: locationData.provider || 'UNKNOWN',
        name: locationData.name || `Unknown Location ${Date.now()}`,
        unstructuredAddress: locationData.unstructuredAddress,
        address: locationData.address || {},
        latitude: locationData.center?.latitude,
        longitude: locationData.center?.longitude,
        // Store the raw data to ensure we don't lose any fields
        additionalData: locationData,
      };
    } catch (error) {
      this.logger.error(
        `Error transforming location data: ${error.message || error}`,
      );

      // Return minimal valid data
      return {
        reference: locationData.reference || `unknown-${Date.now()}`,
        provider: 'UNKNOWN',
        name: 'Error Processing Location',
      };
    }
  }

  async findAll(): Promise<ViatorLocationDto[]> {
    try {
      const locations = await this.locationModel.find().lean();
      return locations.map((location) => this.transformToDto(location));
    } catch (error) {
      this.logger.error(
        `Error finding all locations: ${error.message || error}`,
      );
      return []; // Return empty array instead of throwing
    }
  }

  async findByReference(reference: string): Promise<ViatorLocationDto> {
    try {
      const location = await this.locationModel.findOne({ reference }).lean();

      if (!location) {
        this.logger.warn(`Location with reference ${reference} not found`);

        // Return placeholder instead of throwing
        return {
          reference: reference,
          provider: 'UNKNOWN',
          name: `Unknown Location ${reference}`,
        } as ViatorLocationDto;
      }

      return this.transformToDto(location);
    } catch (error) {
      this.logger.error(
        `Error finding location by reference: ${error.message || error}`,
      );

      // Return placeholder instead of throwing
      return {
        reference: reference || 'unknown',
        provider: 'ERROR',
        name: 'Error Finding Location',
      } as ViatorLocationDto;
    }
  }

  async findOrFetchByReference(reference: string): Promise<ViatorLocationDto> {
    try {
      // Skip invalid reference
      if (!reference) {
        return {
          reference: 'invalid',
          provider: 'UNKNOWN',
          name: 'Invalid Reference',
        } as ViatorLocationDto;
      }

      // Try to find in database first
      const existingLocation = await this.locationModel
        .findOne({ reference })
        .lean();

      if (existingLocation) {
        return this.transformToDto(existingLocation);
      }

      // Not found, fetch from API
      try {
        await this.fetchLocationsByReferences([reference]);
      } catch (fetchError) {
        this.logger.error(
          `Error fetching location ${reference}: ${
            fetchError.message || fetchError
          }`,
        );
        // Continue despite error
      }

      // Try again after fetch
      const location = await this.locationModel.findOne({ reference }).lean();

      if (location) {
        return this.transformToDto(location);
      }

      // Still not found, return placeholder
      return {
        reference: reference,
        provider: 'UNKNOWN',
        name: `Location Not Found ${reference}`,
      } as ViatorLocationDto;
    } catch (error) {
      this.logger.error(
        `Error in findOrFetchByReference for ${reference}: ${
          error.message || error
        }`,
      );

      // Return placeholder instead of throwing
      return {
        reference: reference || 'unknown',
        provider: 'ERROR',
        name: 'Error Processing Location',
      } as ViatorLocationDto;
    }
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
  ): Promise<ViatorLocationDto[]> {
    try {
      // Validate inputs
      if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
        this.logger.warn(
          `Invalid parameters for findNearby: lat=${latitude}, lng=${longitude}, radius=${radiusKm}`,
        );
        return [];
      }

      // Find locations with coordinates
      const locations = await this.locationModel
        .find({
          latitude: { $exists: true },
          longitude: { $exists: true },
        })
        .where({
          $and: [{ latitude: { $ne: null } }, { longitude: { $ne: null } }],
        })
        .lean();

      // Filter manually by distance
      const nearbyLocations = locations.filter((loc) => {
        try {
          if (!loc.latitude || !loc.longitude) return false;
          const distance = this.calculateDistance(
            latitude,
            longitude,
            loc.latitude,
            loc.longitude,
          );
          return distance <= radiusKm;
        } catch (distanceError) {
          this.logger.error(
            `Error calculating distance for location ${loc.reference}: ${
              distanceError.message || distanceError
            }`,
          );
          return false;
        }
      });

      return nearbyLocations.map((location) => this.transformToDto(location));
    } catch (error) {
      this.logger.error(
        `Error finding nearby locations: ${error.message || error}`,
      );
      return []; // Return empty array instead of throwing
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    try {
      // Validate coordinates
      if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
        return Infinity; // Return Infinity for invalid coordinates
      }

      const R = 6371; // Earth's radius in km
      const dLat = this.toRadians(lat2 - lat1);
      const dLon = this.toRadians(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.toRadians(lat1)) *
          Math.cos(this.toRadians(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    } catch (error) {
      this.logger.error(
        `Error calculating distance: ${error.message || error}`,
      );
      return Infinity; // Return Infinity on error
    }
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private transformToDto(location: any): ViatorLocationDto {
    try {
      return {
        reference: location.reference || 'unknown',
        provider: location.provider || 'UNKNOWN',
        name: location.name || 'Unnamed Location',
        unstructuredAddress: location.unstructuredAddress,
        address: location.address,
        center:
          location.latitude && location.longitude
            ? {
                latitude: location.latitude,
                longitude: location.longitude,
              }
            : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Error transforming location to DTO: ${error.message || error}`,
      );

      // Return minimal object instead of throwing
      return {
        reference: location.reference || 'error',
        provider: 'ERROR',
        name: 'Error Processing Location',
      };
    }
  }
}
