// src/viator-location/dto/viator-location.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ViatorLocationProvider } from '../viator-location.schema';

export class LocationAddressDto {
  @ApiPropertyOptional({ example: '123 Main St' })
  street?: string;

  @ApiPropertyOptional({ example: 'Manhattan' })
  administrativeArea?: string;

  @ApiPropertyOptional({ example: 'New York' })
  state?: string;

  @ApiPropertyOptional({ example: 'United States' })
  country?: string;

  @ApiPropertyOptional({ example: 'US' })
  countryCode?: string;

  @ApiPropertyOptional({ example: '10001' })
  postcode?: string;
}

export class LocationCenterDto {
  @ApiProperty({ example: 40.7128 })
  latitude: number;

  @ApiProperty({ example: -74.006 })
  longitude: number;
}

export class ViatorLocationDto {
  @ApiProperty({ example: 'LOC-123abc456def' })
  reference: string;

  @ApiProperty({ enum: ViatorLocationProvider, example: 'TRIPADVISOR' })
  provider: string;

  @ApiProperty({ example: 'Empire State Building' })
  name: string;

  @ApiPropertyOptional({ example: '350 5th Ave, New York, NY 10118' })
  unstructuredAddress?: string;

  @ApiPropertyOptional({ type: LocationAddressDto })
  address?: LocationAddressDto;

  @ApiPropertyOptional({ type: LocationCenterDto })
  center?: LocationCenterDto;
}
