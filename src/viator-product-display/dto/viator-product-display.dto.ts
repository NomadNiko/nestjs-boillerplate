import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductDisplayRequestDto {
  @ApiProperty({ example: '7908P9' })
  productCode: string;

  @ApiPropertyOptional({ example: '2025-06-20' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-06-24' })
  endDate?: string;

  @ApiPropertyOptional({ example: 'USD' })
  currency?: string;
}

export class ProductDisplayResponseDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  product: Record<string, unknown>;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  availability: Record<string, unknown>;

  @ApiProperty({ example: 'https://www.viator.com/tours/...' })
  bookingUrl: string;
}
