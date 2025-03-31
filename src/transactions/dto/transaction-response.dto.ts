import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus, TransactionType } from '../infrastructure/persistence/document/entities/transaction.schema';


export class TransactionResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ example: 'pi_1234567890' })
  stripeCheckoutSessionId: string;

  @ApiProperty({ example: 10000 })
  amount: number;

  @ApiProperty({ example: 'usd' })
  currency: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  vendorId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  customerId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  productItemId: string;

  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Payment method details from Stripe'
  })
  paymentMethodDetails?: Record<string, any>;


  @ApiPropertyOptional({ example: 'Payment for surfing lesson' })
  description?: string;

  @ApiPropertyOptional({ example: 'customer@example.com' })
  receiptEmail?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Additional metadata for the transaction'
  })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: 're_1234567890' })
  refundId?: string;

  @ApiPropertyOptional({ example: 5000 })
  refundAmount?: number;

  @ApiPropertyOptional({ example: 'requested_by_customer' })
  refundReason?: string;

  @ApiPropertyOptional({ example: 'dp_1234567890' })
  disputeId?: string;

  @ApiPropertyOptional({ example: 'needs_response' })
  disputeStatus?: string;

  @ApiPropertyOptional({ example: 10000 })
  disputeAmount?: number;

  @ApiPropertyOptional({ example: 'Card declined' })
  error?: string;

  @ApiProperty({ example: '2025-02-11T19:25:21.000Z' })
  transactionDate: string;  // Added explicit transaction date field

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}