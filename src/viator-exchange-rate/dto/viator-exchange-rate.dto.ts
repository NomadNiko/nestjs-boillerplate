// src/viator-exchange-rate/dto/viator-exchange-rate.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ExchangeRateRequestDto {
  @ApiProperty({
    example: ['USD', 'EUR'],
    description: 'Source currencies to convert from',
  })
  sourceCurrencies: string[];

  @ApiProperty({
    example: ['GBP', 'AUD'],
    description: 'Target currencies to convert to',
  })
  targetCurrencies: string[];
}

export class ExchangeRateItemDto {
  @ApiProperty({ example: 'USD', description: 'Source currency code' })
  sourceCurrency: string;

  @ApiProperty({ example: 'EUR', description: 'Target currency code' })
  targetCurrency: string;

  @ApiProperty({ example: 0.939702066, description: 'Conversion rate value' })
  rate: number;

  @ApiProperty({
    example: '2025-03-29T23:59:59Z',
    description: 'When the rate was last updated',
  })
  lastUpdated: string;

  @ApiProperty({
    example: '2025-03-31T01:09:59Z',
    description: 'When the rate will expire',
  })
  expiry: string;
}

export class ExchangeRateResponseDto {
  @ApiProperty({
    type: [ExchangeRateItemDto],
    description: 'List of exchange rates',
  })
  rates: ExchangeRateItemDto[];
}

export class ConversionResultDto {
  @ApiProperty({ example: 100, description: 'Original amount' })
  amount: number;

  @ApiProperty({ example: 'USD', description: 'Source currency code' })
  sourceCurrency: string;

  @ApiProperty({ example: 'EUR', description: 'Target currency code' })
  targetCurrency: string;

  @ApiProperty({ example: 93.97, description: 'Converted amount' })
  convertedAmount: number;

  @ApiProperty({ example: 0.9397, description: 'Rate used for conversion' })
  rate: number;

  @ApiProperty({
    example: '2025-03-31T01:09:59Z',
    description: 'When the rate will expire',
  })
  rateExpiry: string;
}
