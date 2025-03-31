import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  VendorType,
  VendorStatusEnum,
} from '../infrastructure/persistence/document/entities/vendor.schema';
import { StripeAccountStatusDto } from './stripe-account-status.dto';

export class LocationDto {
  @ApiProperty({ example: 'Point' })
  type: 'Point';

  @ApiProperty({
    type: 'array',
    items: {
      type: 'number',
    },
    example: [-157.82778, 21.27694],
  })
  coordinates: [number, number];
}

export class VendorResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ example: 'Beach Adventures LLC' })
  businessName: string;

  @ApiProperty({ example: 'We offer the best surfing lessons in Waikiki' })
  description: string;

  @ApiProperty({
    enum: ['tours', 'lessons', 'rentals', 'tickets'],
    isArray: true,
    example: ['tours', 'lessons'],
  })
  vendorTypes: VendorType[];

  @ApiPropertyOptional({ example: 'https://www.beachadventures.com' })
  website?: string;

  @ApiProperty({ example: 'contact@beachadventures.com' })
  email: string;

  @ApiProperty({ example: '808-555-0123' })
  phone: string;

  @ApiProperty({ example: '2335 Kalakaua Ave' })
  address: string;

  @ApiProperty({ example: 'Honolulu' })
  city: string;

  @ApiProperty({ example: 'HI' })
  state: string;

  @ApiProperty({ example: '96815' })
  postalCode: string;

  @ApiProperty({ type: () => LocationDto })
  location: LocationDto;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  logoUrl?: string;

  @ApiProperty({ enum: VendorStatusEnum })
  vendorStatus: VendorStatusEnum;

  @ApiPropertyOptional({ example: 'Need additional documentation' })
  actionNeeded?: string;

  @ApiPropertyOptional()
  adminNotes?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional({ example: 'acct_1234567890' })
  stripeConnectId?: string;

  @ApiPropertyOptional()
  stripeAccountStatus?: StripeAccountStatusDto;

  @ApiPropertyOptional({ example: 1000.0 })
  accountBalance?: number;

  @ApiPropertyOptional({ example: 500.0 })
  pendingBalance?: number;

  @ApiPropertyOptional({ example: 1500.0 })
  internalAccountBalance?: number;

  @ApiProperty({ example: 0.13 })
  vendorApplicationFee: number;

  @ApiProperty({ type: [String] })
  vendorPayments: string[];

  @ApiProperty({ type: [String] })
  vendorPayouts: string[];
}
