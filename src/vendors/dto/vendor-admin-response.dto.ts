import { ApiProperty } from '@nestjs/swagger';
import { VendorResponseDto } from './vendor-response.dto';

export class VendorAdminResponseDto extends VendorResponseDto {
  @ApiProperty({ type: [String], example: ['userId1', 'userId2'] })
  ownerIds: string[];

  @ApiProperty({ example: 'Internal notes about vendor approval process' })
  adminNotes: string;
}