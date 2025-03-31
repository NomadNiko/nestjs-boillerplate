import { ApiProperty } from '@nestjs/swagger';
import { VendorResponseDto } from './vendor-response.dto';

export class PaginatedVendorResponse {
  @ApiProperty({ type: [VendorResponseDto] })
  data: VendorResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;
}

export enum VendorSortField {
  NAME = 'businessName',
  POSTCODE = 'postalCode',
  CITY = 'city',
  STATE = 'state',
  STATUS = 'vendorStatus',
  CREATED = 'createdAt',
  UPDATED = 'updatedAt'
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}