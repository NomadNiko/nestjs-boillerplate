import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CartItemClass } from '../entities/cart.schema';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  vendorId: string;  // Add vendorId to DTO

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productStartTime?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  productItemId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: '2025-02-10T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  productDate: Date;
}

export class UpdateCartItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  productItemId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity: number;
}

export class CartResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({ type: [CartItemClass] })
  items: CartItemClass[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}