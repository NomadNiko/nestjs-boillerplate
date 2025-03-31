import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class VendorOwnershipDto {
  @ApiProperty({ example: ['userId1', 'userId2'] })
  @IsArray()
  @IsString({ each: true })
  ownerIds: string[];
}
