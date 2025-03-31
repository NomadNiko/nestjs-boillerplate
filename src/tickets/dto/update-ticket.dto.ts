import { IsOptional, IsString, IsNumber, IsDate } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTicketDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productDescription?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  productPrice?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productType?: string;

  @ApiPropertyOptional()
  @IsDate()
  @IsOptional()
  productDate?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productStartTime?: string;
}
