import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsArray,
  IsEnum, 
  IsOptional, 
  IsEmail, 
  IsUrl, 
  IsLatitude, 
  IsLongitude 
} from 'class-validator';
import { VendorType } from '../infrastructure/persistence/document/entities/vendor.schema';

export class CreateVendorDto {
  @ApiProperty({ example: 'Beach Adventures LLC' })
  @IsString()
  businessName: string;

  @ApiProperty({ example: 'We offer the best surfing lessons in Waikiki' })
  @IsString()
  description: string;

  @ApiProperty({ 
    enum: ['tours', 'lessons', 'rentals', 'tickets'],
    isArray: true,
    example: ['tours', 'lessons']
  })
  @IsArray()
  @IsEnum(['tours', 'lessons', 'rentals', 'tickets'], { each: true })
  vendorTypes: VendorType[];

  @ApiPropertyOptional({ example: 'https://www.beachadventures.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ example: 'contact@beachadventures.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '808-555-0123' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '2335 Kalakaua Ave' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Honolulu' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'HI' })
  @IsString()
  state: string;

  @ApiProperty({ example: '96815' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: 21.27694 })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -157.82778 })
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;
}