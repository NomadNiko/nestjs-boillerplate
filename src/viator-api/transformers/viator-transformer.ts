// src/viator-api/transformers/viator-transformer.ts
import { Injectable, Logger } from '@nestjs/common';

// Type definitions for Viator API responses
export interface ViatorProductRaw {
  productCode: string;
  title?: string;
  description?: string;
  pricing?: {
    summary?: {
      fromPrice?: number;
      fromPriceBeforeDiscount?: number;
    };
    currency?: string;
  };
  images?: Array<{
    imageSource?: string;
    caption?: string;
    isCover?: boolean;
    variants?: Array<{
      height?: number;
      width?: number;
      url?: string;
    }>;
  }>;
  reviews?: {
    sources?: Array<{
      provider?: string;
      totalCount?: number;
      averageRating?: number;
    }>;
    totalReviews?: number;
    combinedAverageRating?: number;
  };
  destinations?: Array<{
    ref?: string;
    primary?: boolean;
  }>;
  tags?: number[];
  flags?: string[];
  productUrl?: string;
  translationInfo?: {
    containsMachineTranslatedText?: boolean;
  };
}

export interface ViatorDestinationRaw {
  destinationId?: number;
  name?: string;
  type?: string;
  parentDestinationId?: number;
  lookupId?: string;
  destinationUrl?: string;
  defaultCurrencyCode?: string;
  timeZone?: string;
  iataCodes?: string[];
  countryCallingCode?: string;
  languages?: string[];
  center?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface ViatorAvailabilityRaw {
  productCode?: string;
  bookableItems?: Array<{
    productOptionCode?: string;
    seasons?: Array<{
      startDate?: string;
      endDate?: string;
      pricingRecords?: Array<{
        daysOfWeek?: string[];
        timedEntries?: Array<{
          startTime?: string;
          unavailableDates?: Array<{
            date?: string;
            reason?: string;
          }>;
        }>;
        pricingDetails?: Array<{
          pricingPackageType?: string;
          minTravelers?: number;
          maxTravelers?: number;
          ageBand?: string;
          price?: {
            original?: {
              recommendedRetailPrice?: number;
              partnerNetPrice?: number;
              bookingFee?: number;
              partnerTotalPrice?: number;
            };
            special?: {
              recommendedRetailPrice?: number;
              partnerNetPrice?: number;
              bookingFee?: number;
              partnerTotalPrice?: number;
              offerStartDate?: string;
              offerEndDate?: string;
            };
          };
        }>;
      }>;
    }>;
  }>;
  currency?: string;
  summary?: {
    fromPrice?: number;
    fromPriceBeforeDiscount?: number;
  };
}

export interface ViatorLocationRaw {
  reference?: string;
  provider?: string;
  name?: string;
  unstructuredAddress?: string;
  address?: {
    street?: string;
    administrativeArea?: string;
    state?: string;
    country?: string;
    countryCode?: string;
    postcode?: string;
  };
  center?: {
    latitude?: number;
    longitude?: number;
  };
}

// Type definitions for our internal DTOs
export interface ProductDto {
  productCode: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  imageUrl: string;
  thumbnailUrl: string;
  averageRating: number;
  reviewCount: number;
  destinationIds: string[];
  primaryDestinationId?: string;
  tags: number[];
  flags: string[];
  bookingUrl: string;
  isMachineTranslated: boolean;
}

export interface DestinationDto {
  destinationId: number;
  name: string;
  type: string;
  parentDestinationId?: number;
  lookupId: string;
  url?: string;
  currencyCode?: string;
  timeZone?: string;
  iataCodes: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface AvailabilityDto {
  productCode: string;
  available: boolean;
  options: Array<{
    productOptionCode: string;
    availableDates: string[];
    unavailableDates: string[];
    startTimes: Record<string, string[]>;
    pricing: {
      adult: {
        price: number;
        specialPrice?: number;
        specialPriceEndDate?: string;
      };
      child?: {
        price: number;
        specialPrice?: number;
      };
      infant?: {
        price: number;
        specialPrice?: number;
      };
    };
  }>;
  lowestPrice: number;
  originalPrice?: number;
  currency: string;
}

export interface LocationDto {
  reference: string;
  provider: string;
  name: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

@Injectable()
export class ViatorTransformer {
  private readonly logger = new Logger(ViatorTransformer.name);

  /**
   * Transforms a raw product from Viator API to our internal DTO format
   * @param raw Raw product data from Viator API
   * @returns Standardized product DTO
   */
  transformProduct(raw: ViatorProductRaw): ProductDto {
    try {
      // Find the main image (cover or first available)
      const coverImage =
        raw.images?.find((img) => img.isCover) || raw.images?.[0];
      const largeImageVariant = coverImage?.variants?.find(
        (v) => v.width === 720 && v.height === 480,
      );
      const thumbnailVariant = coverImage?.variants?.find(
        (v) => v.width === 100 && v.height === 100,
      );

      // Extract primary destination
      const primaryDestination = raw.destinations?.find((d) => d.primary)?.ref;

      return {
        productCode: raw.productCode,
        title: raw.title || 'Unknown Title',
        description: raw.description || '',
        price: raw.pricing?.summary?.fromPrice || 0,
        originalPrice: raw.pricing?.summary?.fromPriceBeforeDiscount,
        currency: raw.pricing?.currency || 'USD',
        imageUrl: largeImageVariant?.url || '',
        thumbnailUrl: thumbnailVariant?.url || '',
        averageRating: raw.reviews?.combinedAverageRating || 0,
        reviewCount: raw.reviews?.totalReviews || 0,
        destinationIds: raw.destinations?.map((d) => d.ref || '') || [],
        primaryDestinationId: primaryDestination,
        tags: raw.tags || [],
        flags: raw.flags || [],
        bookingUrl: raw.productUrl || '',
        isMachineTranslated:
          raw.translationInfo?.containsMachineTranslatedText || false,
      };
    } catch (error) {
      this.logger.error(
        `Error transforming product: ${error.message}`,
        error.stack,
      );
      return {
        productCode: raw.productCode,
        title: raw.title || 'Error Processing Product',
        description: '',
        price: 0,
        currency: 'USD',
        imageUrl: '',
        thumbnailUrl: '',
        averageRating: 0,
        reviewCount: 0,
        destinationIds: [],
        tags: [],
        flags: [],
        bookingUrl: '',
        isMachineTranslated: false,
      };
    }
  }

  /**
   * Transforms a raw destination from Viator API to our internal DTO format
   * @param raw Raw destination data from Viator API
   * @returns Standardized destination DTO
   */
  transformDestination(raw: ViatorDestinationRaw): DestinationDto {
    try {
      return {
        destinationId: raw.destinationId || 0,
        name: raw.name || 'Unknown Destination',
        type: raw.type || 'UNKNOWN',
        parentDestinationId: raw.parentDestinationId,
        lookupId: raw.lookupId || '',
        url: raw.destinationUrl,
        currencyCode: raw.defaultCurrencyCode,
        timeZone: raw.timeZone,
        iataCodes: raw.iataCodes || [],
        coordinates:
          raw.center?.latitude && raw.center?.longitude
            ? {
                latitude: raw.center.latitude,
                longitude: raw.center.longitude,
              }
            : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Error transforming destination: ${error.message}`,
        error.stack,
      );
      return {
        destinationId: raw.destinationId || 0,
        name: 'Error Processing Destination',
        type: 'ERROR',
        lookupId: '',
        iataCodes: [],
      };
    }
  }

  /**
   * Transforms raw availability data from Viator API to our internal DTO format
   * @param raw Raw availability data from Viator API
   * @returns Standardized availability DTO
   */
  transformAvailability(raw: ViatorAvailabilityRaw): AvailabilityDto {
    try {
      const options =
        raw.bookableItems?.map((item) => {
          // Process available dates
          const availableDates: string[] = [];
          const unavailableDates: string[] = [];
          const startTimes: Record<string, string[]> = {};

          // Process each season's availability
          item.seasons?.forEach((season) => {
            const startDate = new Date(season.startDate || '');
            const endDate = new Date(season.endDate || '');

            // Create a date range for the season
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
              const dateStr = currentDate.toISOString().split('T')[0];

              // Process availability for each pricing record
              season.pricingRecords?.forEach((record) => {
                // Check if this date's day of week is covered
                const dayOfWeek = [
                  'SUNDAY',
                  'MONDAY',
                  'TUESDAY',
                  'WEDNESDAY',
                  'THURSDAY',
                  'FRIDAY',
                  'SATURDAY',
                ][currentDate.getDay()];
                if (record.daysOfWeek?.includes(dayOfWeek)) {
                  // Get all timed entries for this day
                  record.timedEntries?.forEach((entry) => {
                    // Initialize start times array for this date if not exists
                    if (!startTimes[dateStr]) {
                      startTimes[dateStr] = [];
                    }

                    // Add the start time if not already included
                    if (
                      entry.startTime &&
                      !startTimes[dateStr].includes(entry.startTime)
                    ) {
                      startTimes[dateStr].push(entry.startTime);
                    }

                    // Check if this date is unavailable
                    const isUnavailable = entry.unavailableDates?.some(
                      (ud) => ud.date === dateStr,
                    );

                    if (isUnavailable) {
                      unavailableDates.push(dateStr);
                    } else {
                      availableDates.push(dateStr);
                    }
                  });
                }
              });

              // Move to next day
              currentDate.setDate(currentDate.getDate() + 1);
            }
          });

          // Process pricing from the first season and pricing record
          const firstPricingRecord = item.seasons?.[0]?.pricingRecords?.[0];
          const adultPricing = firstPricingRecord?.pricingDetails?.find(
            (pd) => pd.ageBand === 'ADULT',
          );
          const childPricing = firstPricingRecord?.pricingDetails?.find(
            (pd) => pd.ageBand === 'CHILD',
          );
          const infantPricing = firstPricingRecord?.pricingDetails?.find(
            (pd) => pd.ageBand === 'INFANT',
          );

          return {
            productOptionCode: item.productOptionCode || '',
            availableDates: [...new Set(availableDates)], // Remove duplicates
            unavailableDates: [...new Set(unavailableDates)], // Remove duplicates
            startTimes,
            pricing: {
              adult: {
                price:
                  adultPricing?.price?.original?.recommendedRetailPrice || 0,
                specialPrice:
                  adultPricing?.price?.special?.recommendedRetailPrice,
                specialPriceEndDate: adultPricing?.price?.special?.offerEndDate,
              },
              child: childPricing
                ? {
                    price:
                      childPricing.price?.original?.recommendedRetailPrice || 0,
                    specialPrice:
                      childPricing.price?.special?.recommendedRetailPrice,
                  }
                : undefined,
              infant: infantPricing
                ? {
                    price:
                      infantPricing.price?.original?.recommendedRetailPrice ||
                      0,
                    specialPrice:
                      infantPricing.price?.special?.recommendedRetailPrice,
                  }
                : undefined,
            },
          };
        }) || [];

      return {
        productCode: raw.productCode || '',
        available: options.length > 0,
        options,
        lowestPrice: raw.summary?.fromPrice || 0,
        originalPrice: raw.summary?.fromPriceBeforeDiscount,
        currency: raw.currency || 'USD',
      };
    } catch (error) {
      this.logger.error(
        `Error transforming availability: ${error.message}`,
        error.stack,
      );
      return {
        productCode: raw.productCode || '',
        available: false,
        options: [],
        lowestPrice: 0,
        currency: 'USD',
      };
    }
  }

  /**
   * Transforms a raw location from Viator API to our internal DTO format
   * @param raw Raw location data from Viator API
   * @returns Standardized location DTO
   */
  transformLocation(raw: ViatorLocationRaw): LocationDto {
    try {
      // Create a formatted address string
      let addressStr = '';
      if (raw.address) {
        const addressParts = [
          raw.address.street,
          raw.address.administrativeArea,
          raw.address.state,
          raw.address.country,
        ].filter(Boolean);
        addressStr = addressParts.join(', ');
      } else if (raw.unstructuredAddress) {
        addressStr = raw.unstructuredAddress;
      }

      return {
        reference: raw.reference || '',
        provider: raw.provider || 'UNKNOWN',
        name: raw.name || 'Unknown Location',
        address: addressStr || undefined,
        coordinates:
          raw.center?.latitude && raw.center?.longitude
            ? {
                latitude: raw.center.latitude,
                longitude: raw.center.longitude,
              }
            : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Error transforming location: ${error.message}`,
        error.stack,
      );
      return {
        reference: raw.reference || '',
        provider: 'ERROR',
        name: 'Error Processing Location',
      };
    }
  }

  /**
   * Safely format a date string to ISO format
   * @param date Date string in any format
   * @param fallback Optional fallback string if date is invalid
   * @returns ISO date string or fallback
   */
  formatDate(date: string | undefined, fallback?: string): string | undefined {
    if (!date) return fallback;
    try {
      return new Date(date).toISOString();
    } catch (error) {
      this.logger.warn(`Error formatting date '${date}': ${error.message}`);
      return fallback;
    }
  }

  /**
   * Safely parse a price value
   * @param price Price value from API
   * @param defaultValue Default value if price is invalid
   * @returns Parsed price or default value
   */
  parsePrice(price: number | undefined, defaultValue = 0): number {
    if (price === undefined || price === null || isNaN(Number(price))) {
      return defaultValue;
    }
    return Number(price);
  }
}
