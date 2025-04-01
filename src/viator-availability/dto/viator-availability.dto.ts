// src/viator-availability/dto/viator-availability.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsISO8601 } from 'class-validator';

export class AvailabilityCheckRequestDto {
  @ApiProperty({ example: '7908P9' })
  @IsString()
  @IsNotEmpty({ message: 'Product code is required' })
  productCode: string;

  @ApiProperty({ example: '2025-06-20' })
  @IsString()
  @IsISO8601(
    {},
    { message: 'startDate must be a valid ISO 8601 date string (YYYY-MM-DD)' },
  )
  startDate: string;

  @ApiPropertyOptional({ example: '2025-06-24' })
  @IsOptional()
  @IsISO8601(
    {},
    { message: 'endDate must be a valid ISO 8601 date string (YYYY-MM-DD)' },
  )
  endDate?: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class AvailabilityResponseDto {
  @ApiProperty({ example: '7908P9' })
  productCode: string;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: true,
    },
  })
  bookableItems: Record<string, unknown>[];

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  summary: Record<string, unknown>;
}
