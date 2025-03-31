// src/viator-exchange-rate/viator-exchange-rate.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ViatorApiService } from '../viator-api/viator-api.service';
import {
  ExchangeRateItemDto,
  ExchangeRateResponseDto,
  ConversionResultDto,
} from './dto/viator-exchange-rate.dto';
import {
  ViatorExchangeRateSchemaClass,
  ViatorExchangeRateSchemaDocument,
} from './viator-exchange-rate.schema';

@Injectable()
export class ViatorExchangeRateService {
  private readonly logger = new Logger(ViatorExchangeRateService.name);

  // All supported supplier currencies according to the documentation
  private readonly supportedSupplierCurrencies = [
    'AED',
    'ARS',
    'AUD',
    'BRL',
    'CAD',
    'CHF',
    'CLP',
    'CNY',
    'COP',
    'DKK',
    'EUR',
    'FJD',
    'GBP',
    'HKD',
    'IDR',
    'ILS',
    'INR',
    'ISK',
    'JPY',
    'KRW',
    'MXN',
    'MYR',
    'NOK',
    'NZD',
    'PEN',
    'PHP',
    'PLN',
    'RUB',
    'SEK',
    'SGD',
    'THB',
    'TRY',
    'TWD',
    'USD',
    'VND',
    'ZAR',
  ];

  // Currencies that can be used for payment (invoicing)
  private readonly paymentCurrencies = ['GBP', 'EUR', 'USD', 'AUD', 'CAD'];

  constructor(
    private readonly viatorApiService: ViatorApiService,
    @InjectModel(ViatorExchangeRateSchemaClass.name)
    private readonly exchangeRateModel: Model<ViatorExchangeRateSchemaDocument>,
  ) {}

  /**
   * Fetch exchange rates for all payment currencies against all supplier currencies
   * and store them in the database
   */
  async fetchAllExchangeRates(): Promise<void> {
    this.logger.log('Fetching exchange rates for all currency pairs');

    try {
      // Request rates from all supplier currencies to all payment currencies
      const response =
        await this.viatorApiService.makeRequest<ExchangeRateResponseDto>(
          '/exchange-rates',
          'POST',
          {
            sourceCurrencies: this.supportedSupplierCurrencies,
            targetCurrencies: this.paymentCurrencies,
          },
        );

      if (!response || !response.rates || !Array.isArray(response.rates)) {
        this.logger.warn(
          'Invalid response from exchange rates API - no rates found',
        );
        return;
      }

      this.logger.log(
        `Received ${response.rates.length} exchange rates from API`,
      );
      let savedCount = 0;

      // Save all rates to the database
      for (const rate of response.rates) {
        try {
          await this.saveExchangeRate(rate);
          savedCount++;
        } catch (error) {
          this.logger.error(
            `Error saving rate ${rate.sourceCurrency} to ${rate.targetCurrency}: ${error.message}`,
          );
        }
      }

      this.logger.log(`Successfully saved ${savedCount} exchange rates`);
    } catch (error) {
      this.logger.error(`Error fetching exchange rates: ${error.message}`);
    }
  }

  /**
   * Save a single exchange rate to the database
   */
  private async saveExchangeRate(rate: ExchangeRateItemDto): Promise<void> {
    await this.exchangeRateModel.updateOne(
      {
        sourceCurrency: rate.sourceCurrency,
        targetCurrency: rate.targetCurrency,
      },
      {
        $set: {
          rate: rate.rate,
          lastUpdated: new Date(rate.lastUpdated),
          expiry: new Date(rate.expiry),
        },
      },
      { upsert: true },
    );
  }

  /**
   * Find all exchange rates in the database
   */
  async findAll(): Promise<ExchangeRateItemDto[]> {
    const rates = await this.exchangeRateModel.find().lean();

    return rates.map((rate) => ({
      sourceCurrency: rate.sourceCurrency,
      targetCurrency: rate.targetCurrency,
      rate: rate.rate,
      lastUpdated: rate.lastUpdated.toISOString(),
      expiry: rate.expiry.toISOString(),
    }));
  }

  /**
   * Get exchange rate for a specific currency pair
   * If the rate doesn't exist or is expired, fetch it from the API
   */
  async getExchangeRate(
    sourceCurrency: string,
    targetCurrency: string,
  ): Promise<ExchangeRateItemDto | null> {
    // Normalize currency codes
    sourceCurrency = sourceCurrency.toUpperCase();
    targetCurrency = targetCurrency.toUpperCase();

    // Same currency, rate is 1:1
    if (sourceCurrency === targetCurrency) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return {
        sourceCurrency,
        targetCurrency,
        rate: 1,
        lastUpdated: now.toISOString(),
        expiry: tomorrow.toISOString(),
      };
    }

    // Check if we have a non-expired rate in the database
    const currentRate = await this.exchangeRateModel
      .findOne({
        sourceCurrency,
        targetCurrency,
        expiry: { $gt: new Date() },
      })
      .lean();

    if (currentRate) {
      return {
        sourceCurrency: currentRate.sourceCurrency,
        targetCurrency: currentRate.targetCurrency,
        rate: currentRate.rate,
        lastUpdated: currentRate.lastUpdated.toISOString(),
        expiry: currentRate.expiry.toISOString(),
      };
    }

    // If not found or expired, fetch from API
    this.logger.log(
      `Fetching fresh exchange rate for ${sourceCurrency} to ${targetCurrency}`,
    );

    try {
      const response =
        await this.viatorApiService.makeRequest<ExchangeRateResponseDto>(
          '/exchange-rates',
          'POST',
          {
            sourceCurrencies: [sourceCurrency],
            targetCurrencies: [targetCurrency],
          },
        );

      if (response?.rates?.length > 0) {
        const newRate = response.rates[0];
        await this.saveExchangeRate(newRate);
        return newRate;
      }
    } catch (error) {
      this.logger.error(`Error fetching exchange rate: ${error.message}`);
    }

    // Fallback: check for inverse rate in database
    const inverseRate = await this.exchangeRateModel
      .findOne({
        sourceCurrency: targetCurrency,
        targetCurrency: sourceCurrency,
        expiry: { $gt: new Date() },
      })
      .lean();

    if (inverseRate) {
      return {
        sourceCurrency,
        targetCurrency,
        rate: 1 / inverseRate.rate,
        lastUpdated: inverseRate.lastUpdated.toISOString(),
        expiry: inverseRate.expiry.toISOString(),
      };
    }

    this.logger.warn(
      `No exchange rate found for ${sourceCurrency} to ${targetCurrency}`,
    );
    return null;
  }

  /**
   * Convert an amount from one currency to another
   */
  async convertAmount(
    amount: number,
    sourceCurrency: string,
    targetCurrency: string,
  ): Promise<ConversionResultDto> {
    // Validate amount
    if (isNaN(amount)) {
      amount = 0;
    }

    // Normalize currency codes
    sourceCurrency = sourceCurrency.toUpperCase();
    targetCurrency = targetCurrency.toUpperCase();

    // Same currency, no conversion needed
    if (sourceCurrency === targetCurrency) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return {
        amount,
        sourceCurrency,
        targetCurrency,
        convertedAmount: amount,
        rate: 1,
        rateExpiry: tomorrow.toISOString(),
      };
    }

    // Get exchange rate
    const rate = await this.getExchangeRate(sourceCurrency, targetCurrency);

    if (!rate) {
      this.logger.warn(
        `Using fallback 1:1 rate for ${sourceCurrency} to ${targetCurrency}`,
      );

      // Fallback to 1:1 rate if no rate found
      return {
        amount,
        sourceCurrency,
        targetCurrency,
        convertedAmount: amount,
        rate: 1,
        rateExpiry: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
      };
    }

    return {
      amount,
      sourceCurrency,
      targetCurrency,
      convertedAmount: amount * rate.rate,
      rate: rate.rate,
      rateExpiry: rate.expiry,
    };
  }

  /**
   * Check if any exchange rates are expired and refresh them
   * This can be called periodically by a cron job
   */
  async refreshExpiredRates(): Promise<void> {
    const expiredPairs = await this.exchangeRateModel
      .find({
        expiry: { $lte: new Date() },
      })
      .lean();

    if (expiredPairs.length === 0) {
      this.logger.log('No expired exchange rates found');
      return;
    }

    this.logger.log(
      `Found ${expiredPairs.length} expired exchange rates to refresh`,
    );

    // Group by source and target currencies to minimize API calls
    const sourceCurrencies = [
      ...new Set(expiredPairs.map((pair) => pair.sourceCurrency)),
    ];
    const targetCurrencies = [
      ...new Set(expiredPairs.map((pair) => pair.targetCurrency)),
    ];

    try {
      const response =
        await this.viatorApiService.makeRequest<ExchangeRateResponseDto>(
          '/exchange-rates',
          'POST',
          {
            sourceCurrencies,
            targetCurrencies,
          },
        );

      if (!response?.rates?.length) {
        this.logger.warn('No rates returned when refreshing expired rates');
        return;
      }

      let updatedCount = 0;
      for (const rate of response.rates) {
        try {
          await this.saveExchangeRate(rate);
          updatedCount++;
        } catch (error) {
          this.logger.error(`Error updating rate: ${error.message}`);
        }
      }

      this.logger.log(`Successfully refreshed ${updatedCount} exchange rates`);
    } catch (error) {
      this.logger.error(`Error refreshing expired rates: ${error.message}`);
    }
  }
}
