import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsObject, IsDate } from 'class-validator';
import { PayoutStatus, StripeTransferDetails } from '../infrastructure/persistence/document/entities/payout.schema';
import { Type } from 'class-transformer';

export class CreatePayoutDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  vendorId: string;

  @ApiProperty({ example: 100.00 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: 'Monthly vendor payout' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePayoutDto {
  @ApiProperty({ enum: PayoutStatus })
  @IsEnum(PayoutStatus)
  status: PayoutStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  stripeTransferDetails?: StripeTransferDetails;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  processedAt?: Date;
}

export class PayoutResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  vendorId: string;

  @ApiProperty({ example: 100.00 })
  amount: number;

  @ApiProperty({ enum: PayoutStatus })
  status: PayoutStatus;

  @ApiPropertyOptional()
  stripeTransferDetails?: StripeTransferDetails;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  error?: string;

  @ApiPropertyOptional()
  processedAt?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}