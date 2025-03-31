import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductSearchRequestDto {
  @ApiProperty({ example: '687' })
  @IsString()
  destination: string;

  @ApiPropertyOptional({ type: [Number], example: [21972, 11930] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  tags?: number[];

  @ApiPropertyOptional({ type: [String], example: ['FREE_CANCELLATION'] })
  @IsOptional()
  @IsArray()
  flags?: string[];

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lowestPrice?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  highestPrice?: number;

  @ApiPropertyOptional({ example: '2025-06-20' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-06-24' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    example: 'PRICE',
    enum: ['DEFAULT', 'PRICE', 'TRAVELER_RATING', 'ITINERARY_DURATION'],
  })
  @IsOptional()
  @IsEnum(['DEFAULT', 'PRICE', 'TRAVELER_RATING', 'ITINERARY_DURATION'], {
    message:
      'sortBy must be one of: DEFAULT, PRICE, TRAVELER_RATING, ITINERARY_DURATION',
  })
  sortBy?: string;

  @ApiPropertyOptional({
    example: 'DESCENDING',
    enum: ['ASCENDING', 'DESCENDING'],
  })
  @IsOptional()
  @IsEnum(['ASCENDING', 'DESCENDING'], {
    message: 'sortOrder must be either ASCENDING or DESCENDING',
  })
  sortOrder?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class ProductSearchResponseDto {
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  products: Record<string, unknown>[];

  @ApiProperty({ example: 45 })
  totalCount: number;
}
