// src/viator-exchange-rate/viator-exchange-rate.controller.ts
import { Controller, Get, Post, Param, Body, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ViatorExchangeRateService } from './viator-exchange-rate.service';
import {
  ExchangeRateItemDto,
  ExchangeRateRequestDto,
  ConversionResultDto,
} from './dto/viator-exchange-rate.dto';

@ApiTags('Viator Exchange Rates')
@Controller('viator-exchange-rates')
export class ViatorExchangeRateController {
  private readonly logger = new Logger(ViatorExchangeRateController.name);

  constructor(
    private readonly exchangeRateService: ViatorExchangeRateService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all exchange rates in the database' })
  @ApiResponse({
    status: 200,
    description: 'Returns all exchange rates',
    type: [ExchangeRateItemDto],
  })
  async findAll(): Promise<{ data: ExchangeRateItemDto[] }> {
    const rates = await this.exchangeRateService.findAll();
    return { data: rates };
  }

  @Get(':sourceCurrency/:targetCurrency')
  @ApiOperation({ summary: 'Get exchange rate for a specific currency pair' })
  @ApiParam({
    name: 'sourceCurrency',
    description: 'Source currency code (e.g., USD)',
  })
  @ApiParam({
    name: 'targetCurrency',
    description: 'Target currency code (e.g., EUR)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the exchange rate',
    type: ExchangeRateItemDto,
  })
  async getExchangeRate(
    @Param('sourceCurrency') sourceCurrency: string,
    @Param('targetCurrency') targetCurrency: string,
  ): Promise<{ data: ExchangeRateItemDto | null }> {
    const rate = await this.exchangeRateService.getExchangeRate(
      sourceCurrency,
      targetCurrency,
    );
    return { data: rate };
  }

  @Get('convert/:amount/:sourceCurrency/:targetCurrency')
  @ApiOperation({ summary: 'Convert amount between currencies' })
  @ApiParam({ name: 'amount', description: 'Amount to convert' })
  @ApiParam({
    name: 'sourceCurrency',
    description: 'Source currency code (e.g., USD)',
  })
  @ApiParam({
    name: 'targetCurrency',
    description: 'Target currency code (e.g., EUR)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the converted amount',
    type: ConversionResultDto,
  })
  async convertAmount(
    @Param('amount') amount: string,
    @Param('sourceCurrency') sourceCurrency: string,
    @Param('targetCurrency') targetCurrency: string,
  ): Promise<{ data: ConversionResultDto }> {
    const result = await this.exchangeRateService.convertAmount(
      Number(amount),
      sourceCurrency,
      targetCurrency,
    );
    return { data: result };
  }

  @Post('fetch')
  @ApiOperation({ summary: 'Fetch specific exchange rates from Viator API' })
  @ApiBody({ type: ExchangeRateRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Exchange rates fetched successfully',
  })
  async fetchSpecificRates(
    @Body() requestDto: ExchangeRateRequestDto,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Fetching specific exchange rates for ${requestDto.sourceCurrencies.length} source currencies and ${requestDto.targetCurrencies.length} target currencies`,
    );

    try {
      // This is a custom endpoint, implement if needed
      return { message: 'This endpoint is not yet implemented' };
    } catch (error) {
      this.logger.error(`Error fetching specific rates: ${error.message}`);
      return { message: `Error: ${error.message}` };
    }
  }

  @Post('fetch-all')
  @ApiOperation({ summary: 'Fetch all exchange rates from Viator API' })
  @ApiResponse({
    status: 200,
    description: 'All exchange rates fetched successfully',
  })
  async fetchAllRates(): Promise<{ message: string }> {
    this.logger.log('Starting to fetch all exchange rates');
    await this.exchangeRateService.fetchAllExchangeRates();
    return { message: 'Exchange rates fetched and saved successfully' };
  }

  @Post('refresh-expired')
  @ApiOperation({ summary: 'Refresh all expired exchange rates' })
  @ApiResponse({
    status: 200,
    description: 'Expired exchange rates refreshed successfully',
  })
  async refreshExpiredRates(): Promise<{ message: string }> {
    this.logger.log('Starting to refresh expired exchange rates');
    await this.exchangeRateService.refreshExpiredRates();
    return { message: 'Expired exchange rates refreshed successfully' };
  }
}
