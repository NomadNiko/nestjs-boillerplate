import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsDate, 
  IsOptional,
  Min,
  IsLatitude,
  IsLongitude,
  Matches,
  IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductItemStatusEnum } from '../infrastructure/persistence/document/entities/product-item.schema';

export class CreateProductItemDto {
  @ApiProperty({ example: 'template123' })
  @IsString()
  templateId: string;

  @ApiProperty({ example: 'vendor123' })
  @IsString()
  vendorId: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  productDate: Date;

  @ApiProperty({ example: '14:30' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in 24-hour format (HH:mm)'
  })
  startTime: string;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  @Min(0)
  duration: number;

  @ApiProperty({ example: 149.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  quantityAvailable: number;

  // Optional overrides from template
  @ApiPropertyOptional({ example: -157.82778 })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ example: 21.27694 })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  // Type-specific optional fields
  @ApiPropertyOptional({ example: 'John Smith' })
  @IsOptional()
  @IsString()
  instructorName?: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  tourGuide?: string;

  @ApiPropertyOptional({ example: 'Large' })
  @IsOptional()
  @IsString()
  equipmentSize?: string;

  @ApiPropertyOptional({ example: 'Special instructions for this session' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProductItemDto extends CreateProductItemDto {
  @ApiPropertyOptional({ enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  itemStatus?: string;
}

export class ProductItemResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  templateId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  vendorId: string;

  @ApiProperty()
  productDate: string;

  @ApiProperty({ example: '14:30' })
  startTime: string;

  @ApiProperty({ example: 2.5 })
  duration: number;

  @ApiProperty({ example: 149.99 })
  price: number;

  @ApiProperty({ example: 20 })
  quantityAvailable: number;

  @ApiProperty({ type: () => LocationDto })
  location: LocationDto;

  @ApiProperty({ enum: ProductItemStatusEnum })
  itemStatus: ProductItemStatusEnum;

  @ApiPropertyOptional()
  instructorName?: string;

  @ApiPropertyOptional()
  tourGuide?: string;

  @ApiPropertyOptional()
  equipmentSize?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

// shared location type
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