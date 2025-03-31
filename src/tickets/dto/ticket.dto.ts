import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsDate, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { TicketStatus } from '../infrastructure/persistence/document/entities/ticket.schema';

export class CreateTicketDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  userId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  transactionId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  vendorId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  productItemId: string;

  @ApiProperty({ example: 'Sunset Sailing Tour' })
  @IsString()
  productName: string;

  @ApiProperty({ example: 'Beautiful sunset sailing experience' })
  @IsString()
  productDescription: string;

  @ApiProperty({ example: 100.00 })
  @IsNumber()
  productPrice: number;

  @ApiProperty({ example: 'tours' })
  @IsString()
  productType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  productDate?: Date;

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional()
  @IsString()
  productStartTime?: string;

  @ApiPropertyOptional({ example: 2.5 })
  @IsOptional()
  @IsNumber()
  productDuration?: number;

  @ApiProperty()
  productLocation: {
    type: string;
    coordinates: number[];
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productImageURL?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productAdditionalInfo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productRequirements?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productWaiver?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 85.00 })
  @IsNumber()
  vendorOwed: number;
}

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: TicketStatus })
  @IsEnum(TicketStatus)
  status: TicketStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

export class TicketResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  userId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  transactionId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  vendorId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  productItemId: string;

  @ApiProperty({ example: 'Sunset Sailing Tour' })
  productName: string;

  @ApiProperty({ example: 'Beautiful sunset sailing experience' })
  productDescription: string;

  @ApiProperty({ example: 100.00 })
  productPrice: number;

  @ApiProperty({ example: 'tours' })
  productType: string;

  @ApiPropertyOptional()
  productDate?: string;

  @ApiPropertyOptional({ example: '18:00' })
  productStartTime?: string;

  @ApiPropertyOptional({ example: 2.5 })
  productDuration?: number;

  @ApiProperty()
  productLocation: {
    type: string;
    coordinates: number[];
  };

  @ApiPropertyOptional()
  productImageURL?: string;

  @ApiPropertyOptional()
  productAdditionalInfo?: string;

  @ApiPropertyOptional({ type: [String] })
  productRequirements?: string[];

  @ApiPropertyOptional()
  productWaiver?: string;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: false })
  used: boolean;

  @ApiPropertyOptional()
  usedAt?: string;

  @ApiProperty({ enum: TicketStatus })
  status: TicketStatus;

  @ApiPropertyOptional()
  statusUpdateReason?: string;

  @ApiPropertyOptional()
  statusUpdatedAt?: string;

  @ApiPropertyOptional()
  statusUpdatedBy?: string;

  @ApiProperty({ example: 85.00 })
  vendorOwed: number;

  @ApiProperty({ example: false })
  vendorPaid: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}