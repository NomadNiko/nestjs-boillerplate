import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class StripeBalanceRetrievalDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  vendorId: string;
}

export class StripeBalanceResponseDto {
  @ApiProperty({ example: 1000.00 })
  availableBalance: number;

  @ApiProperty({ example: 500.00 })
  pendingBalance: number;
}