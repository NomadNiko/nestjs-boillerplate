import { PartialType } from '@nestjs/swagger';
import { CreateVendorDto } from './create-vendor.dto';
import { VendorStatusEnum } from '../infrastructure/persistence/document/entities/vendor.schema';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsArray, IsNumber } from 'class-validator';
import { StripeAccountStatusDto } from './stripe-account-status.dto';

export class UpdateVendorDto extends PartialType(CreateVendorDto) {
  @IsOptional()
  @IsEnum(VendorStatusEnum)
  vendorStatus?: VendorStatusEnum;

  @IsOptional()
  @IsString()
  actionNeeded?: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ownerIds?: string[];

  @ApiPropertyOptional({ example: 'acct_1234567890' })
  @IsOptional()
  @IsString()
  stripeConnectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  stripeAccountStatus?: StripeAccountStatusDto;

  @ApiPropertyOptional({ example: 1000.00 })
  @IsOptional()
  @IsNumber()
  accountBalance?: number;

  @ApiPropertyOptional({ example: 500.00 })
  @IsOptional()
  @IsNumber()
  pendingBalance?: number;

  @ApiPropertyOptional({ example: 1500.00 })
  @IsOptional()
  @IsNumber()
  internalAccountBalance?: number;

  @ApiPropertyOptional({ example: 0.13 })
  @IsOptional()
  @IsNumber()
  vendorApplicationFee?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vendorPayments?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vendorPayouts?: string[];
}