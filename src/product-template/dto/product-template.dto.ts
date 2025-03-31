import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsEnum, 
  IsNumber, 
  IsOptional, 
  IsUrl, 
  IsArray,
  Min,
  IsLatitude,
  IsLongitude
} from 'class-validator';
import { ProductType, ProductTemplateStatusEnum } from '../infrastructure/persistence/document/entities/product-template.schema';

// Define LocationDto within this file since it's used here
class LocationDto {
  @ApiProperty({ example: 'Point' })
  type: 'Point';

  @ApiProperty({
    type: 'array',
    items: { type: 'number' },
    example: [-157.82778, 21.27694]
  })
  coordinates: [number, number];
}

export class CreateProductTemplateDto {
  @ApiProperty({ example: 'Waikiki Sunset Tour' })
  @IsString()
  templateName: string;

  @ApiProperty({ example: 'Experience a beautiful Hawaiian sunset from the ocean' })
  @IsString()
  description: string;

  @ApiProperty({ example: 149.99 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({ enum: ['tours', 'lessons', 'rentals', 'tickets'] })
  @IsEnum(['tours', 'lessons', 'rentals', 'tickets'])
  productType: ProductType;

  @ApiProperty({ example: 'vendor123' })
  @IsString()
  vendorId: string;

  @ApiProperty({ example: ['Swimming ability', 'Minimum age 8'] })
  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @ApiProperty({ example: 'Standard liability waiver text...' })
  @IsString()
  waiver: string;

  @ApiPropertyOptional({ example: 'https://example.com/tour-image.jpg' })
  @IsOptional()
  @IsUrl()
  imageURL?: string;

  @ApiPropertyOptional({ example: 'Additional tour details...' })
  @IsOptional()
  @IsString()
  additionalInfo?: string;

  @ApiPropertyOptional({ example: -157.82778 })
  @IsOptional()
  @IsLongitude()
  defaultLongitude?: number;

  @ApiPropertyOptional({ example: 21.27694 })
  @IsOptional()
  @IsLatitude()
  defaultLatitude?: number;

  @ApiPropertyOptional({ example: 2.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultDuration?: number;
}

export class UpdateProductTemplateDto extends CreateProductTemplateDto {
  @ApiPropertyOptional({ enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  templateStatus?: string;
}

export class ProductTemplateResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ example: 'Waikiki Sunset Tour' })
  templateName: string;

  @ApiProperty({ example: 'Experience a beautiful Hawaiian sunset from the ocean' })
  description: string;

  @ApiProperty({ example: 149.99 })
  basePrice: number;

  @ApiProperty({ enum: ['tours', 'lessons', 'rentals', 'tickets'] })
  productType: ProductType;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  vendorId: string;

  @ApiProperty({ type: [String] })
  requirements: string[];

  @ApiProperty()
  waiver: string;

  @ApiProperty({ enum: ProductTemplateStatusEnum })
  templateStatus: ProductTemplateStatusEnum;

  @ApiPropertyOptional()
  imageURL?: string;

  @ApiPropertyOptional()
  additionalInfo?: string;

  @ApiProperty({ type: () => LocationDto })
  location: LocationDto;

  @ApiPropertyOptional()
  defaultDuration?: number;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
