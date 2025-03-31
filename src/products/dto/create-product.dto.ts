import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsEnum, 
  IsNumber, 
  IsOptional, 
  IsUrl, 
  IsLatitude, 
  IsLongitude, 
  IsDate, 
  Min, 
  IsArray,
  Matches
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType } from '../infrastructure/persistence/document/entities/product.schema';

export class CreateProductDto {
  @ApiProperty({ example: 'Sunset Sailing Adventure' })
  @IsString()
  productName: string;

  @ApiProperty({ example: 'Experience a beautiful Hawaiian sunset from the ocean' })
  @IsString()
  productDescription: string;

  @ApiProperty({ example: 149.99 })
  @IsNumber()
  @Min(0)
  productPrice: number;

  @ApiProperty({ enum: ['tours', 'lessons', 'rentals', 'tickets'] })
  @IsEnum(['tours', 'lessons', 'rentals', 'tickets'])
  productType: ProductType;

  @ApiProperty({ example: 21.27694 })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -157.82778 })
  @IsLongitude()
  longitude: number;

  @ApiProperty({ example: 'vendor123' })
  @IsString()
  vendorId: string;

  @ApiPropertyOptional({ example: 'https://example.com/product-image.jpg' })
  @IsOptional()
  @IsUrl()
  productImageURL?: string;

  @ApiPropertyOptional({ example: 2.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  productDuration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  productDate?: Date;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  productStartTime?: string;

  @ApiPropertyOptional({ example: 'Please arrive 15 minutes early' })
  @IsOptional()
  @IsString()
  productAdditionalInfo?: string;

  @ApiPropertyOptional({ example: ['Swimming ability', 'Minimum age 8'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productRequirements?: string[];

  @ApiPropertyOptional({ example: 'Standard liability waiver text...' })
  @IsOptional()
  @IsString()
  productWaiver?: string;
}

export class UpdateProductDto extends CreateProductDto {
  @ApiPropertyOptional({ enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  productStatus?: string;
}