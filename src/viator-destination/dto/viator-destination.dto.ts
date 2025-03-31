// src/viator-destination/dto/viator-destination.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationDto {
  @ApiProperty({ example: 'Point' })
  type: 'Point';

  @ApiProperty({
    type: 'array',
    items: { type: 'number' },
    example: [-157.82778, 21.27694],
  })
  coordinates: [number, number];
}

export class ViatorDestinationDto {
  @ApiProperty({ example: 737 })
  destinationId: number;

  @ApiProperty({ example: 'London' })
  name: string;

  @ApiProperty({ example: 'CITY' })
  type: string;

  @ApiProperty({ example: 142 })
  parentDestinationId: number;

  @ApiProperty({ example: '6.142.737' })
  lookupId: string;

  @ApiPropertyOptional({ example: 'https://www.viator.com/London/d737-ttd' })
  destinationUrl?: string;

  @ApiPropertyOptional({ example: 'GBP' })
  defaultCurrencyCode?: string;

  @ApiPropertyOptional({ example: 'Europe/London' })
  timeZone?: string;

  @ApiPropertyOptional({ type: [String], example: ['LHR', 'LGW'] })
  iataCodes?: string[];

  @ApiPropertyOptional({ example: '+44' })
  countryCallingCode?: string;

  @ApiPropertyOptional({ type: [String], example: ['en-GB'] })
  languages?: string[];

  @ApiPropertyOptional({ type: () => LocationDto })
  center?: LocationDto;
}
