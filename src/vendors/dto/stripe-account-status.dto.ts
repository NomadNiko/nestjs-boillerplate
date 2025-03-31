import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsString, IsArray, IsOptional, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { StripeRequirementErrorEnum } from '../infrastructure/persistence/document/entities/vendor.schema';

export class StripePendingVerificationDto {
  @ApiProperty()
  @IsString()
  details: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueBy?: Date;
}

export class StripeRequirementDto {
  @ApiProperty()
  @IsString()
  requirement: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({ enum: StripeRequirementErrorEnum })
  @IsOptional()
  @IsEnum(StripeRequirementErrorEnum)
  error?: StripeRequirementErrorEnum;
}

export class StripeAccountStatusDto {
  @ApiProperty()
  @IsBoolean()
  chargesEnabled: boolean;

  @ApiProperty()
  @IsBoolean()
  payoutsEnabled: boolean;

  @ApiProperty()
  @IsBoolean()
  detailsSubmitted: boolean;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  currentlyDue: string[];

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  eventuallyDue: string[];

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  pastDue: string[];

  @ApiPropertyOptional()
  pendingVerification?: StripePendingVerificationDto;

  @ApiProperty({ type: [StripeRequirementDto] })
  @IsArray()
  errors: StripeRequirementDto[];
}
