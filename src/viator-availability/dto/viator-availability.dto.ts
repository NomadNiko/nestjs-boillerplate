import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AvailabilityCheckRequestDto {
  @ApiProperty({ example: '7908P9' })
  productCode: string;

  @ApiProperty({ example: '2025-06-20' })
  startDate: string;

  @ApiPropertyOptional({ example: '2025-06-24' })
  endDate?: string;

  @ApiPropertyOptional({ example: 'USD' })
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
