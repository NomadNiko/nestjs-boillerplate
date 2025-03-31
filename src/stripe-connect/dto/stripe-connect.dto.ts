import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class StripeAccountSessionDto {
  @ApiProperty({ example: 'acct_1234567890' })
  @IsString()
  @IsNotEmpty()
  account: string;
}