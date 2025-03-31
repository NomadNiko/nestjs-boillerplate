import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DestinationSearchResultDto {
  @ApiProperty({ example: 687 })
  destinationId: number;

  @ApiProperty({ example: 'London' })
  name: string;

  @ApiProperty({ example: 'CITY' })
  type: string;

  @ApiPropertyOptional({ example: 142 })
  parentDestinationId?: number;

  @ApiPropertyOptional({ example: 'United Kingdom' })
  parentName?: string;
}
