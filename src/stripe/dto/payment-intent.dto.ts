import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsObject 
} from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 10000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'usd' })
  @IsString()
  currency: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  vendorId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  customerId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  productItemId: string;

  @ApiPropertyOptional({ example: 'Payment for surfing lesson' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
