import { ApiProperty } from '@nestjs/swagger';

export class InvoiceItemDto {
  @ApiProperty({ example: '67a595d60c52dd570aa42f5b' })
  productItemId: string;

  @ApiProperty({ example: 'Nightly Beach Walk' })
  productName: string;

  @ApiProperty({ example: 42.00 })
  price: number;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: '2025-02-11T00:00:00.000Z' })
  productDate: string;

  @ApiProperty({ example: '14:00' })
  productStartTime: string;

  @ApiProperty({ example: 60 })
  productDuration: number;
}

export class VendorGroupDto {
  @ApiProperty()
  vendorId: string;

  @ApiProperty()
  vendorName: string;

  @ApiProperty()
  subtotal: number;

  @ApiProperty({ type: [InvoiceItemDto] })
  items: InvoiceItemDto[];
}

export class InvoiceResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  stripeCheckoutSessionId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty({ type: [String] })
  productItemIds: string[];

  @ApiProperty({ type: [VendorGroupDto] })
  vendorGroups: VendorGroupDto[];

  @ApiProperty()
  status: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  invoiceDate: string;

  @ApiProperty()
  description: string;
}