// src/viator-seeder/viator-seeder.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ViatorDestinationService } from '../viator-destination/viator-destination.service';
import { ViatorTagService } from '../viator-tag/viator-tag.service';
import { ViatorExchangeRateService } from '../viator-exchange-rate/viator-exchange-rate.service';

@Injectable()
export class ViatorSeederService {
  private readonly logger = new Logger(ViatorSeederService.name);

  constructor(
    private readonly destinationService: ViatorDestinationService,
    private readonly tagService: ViatorTagService,
    private readonly exchangeRateService: ViatorExchangeRateService,
  ) {}

  async seedAll(): Promise<any> {
    this.logger.log('Starting full data seeding process');

    const results = {
      destinations: { success: false, count: 0, error: null },
      tags: { success: false, count: 0, error: null },
      exchangeRates: { success: false, count: 0, error: null },
    };

    try {
      // Seed destinations
      this.logger.log('Seeding destinations');
      await this.destinationService.fetchAllDestinations();
      const destinationsCount = (await this.destinationService.findAll())
        .length;
      results.destinations = {
        success: true,
        count: destinationsCount,
        error: null,
      };
    } catch (error) {
      this.logger.error(`Failed to seed destinations: ${error.message}`);
      results.destinations.error = error.message;
    }

    try {
      // Seed tags
      this.logger.log('Seeding tags');
      await this.tagService.fetchAllTags();
      const tagsCount = (await this.tagService.findAll()).length;
      results.tags = {
        success: true,
        count: tagsCount,
        error: null,
      };
    } catch (error) {
      this.logger.error(`Failed to seed tags: ${error.message}`);
      results.tags.error = error.message;
    }

    try {
      // Fixed: Use correct method name fetchAllExchangeRates instead of fetchExchangeRates
      // Seed exchange rates
      this.logger.log('Seeding exchange rates');
      await this.exchangeRateService.fetchAllExchangeRates(); // Fixed line
      const exchangeRatesCount = (await this.exchangeRateService.findAll())
        .length;
      results.exchangeRates = {
        success: true,
        count: exchangeRatesCount,
        error: null,
      };
    } catch (error) {
      this.logger.error(`Failed to seed exchange rates: ${error.message}`);
      results.exchangeRates.error = error.message;
    }

    return results;
  }
}
