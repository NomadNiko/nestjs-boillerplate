import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TransactionDocument = HydratedDocument<TransactionSchemaClass>;

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  DISPUTED = 'disputed',
}

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  PAYOUT = 'payout',
}

export interface StripePaymentMethodDetails {
  type?: string;
  card?: {
    brand?: string;
    last4?: string;
    exp_month?: number;
    exp_year?: number;
    country?: string;
  };
  billing_details?: {
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postal_code?: string;
      state?: string;
    };
    email?: string;
    name?: string;
    phone?: string;
  };
}

export interface CheckoutData {
  chargeId: string;
  amount: number;
  amount_captured: number;
  amount_refunded: number;
  billing_details: {
    address?: {
      city?: string | null;
      country?: string | null;
      line1?: string | null;
      line2?: string | null;
      postal_code?: string | null;
      state?: string | null;
    } | null;
    email?: string | null;
    name?: string | null;
    phone?: string | null;
  };
  captured: boolean;
  created: number;
  currency: string;
  paid: boolean;
  payment_intent: string;
  payment_method: string;
  receipt_email?: string | null;
  receipt_url?: string | null;
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret._id = ret._id.toString();
      if (typeof ret.amount === 'number') {
        ret.amount = (ret.amount / 100).toFixed(2);
      }
      if (typeof ret.refundAmount === 'number') {
        ret.refundAmount = (ret.refundAmount / 100).toFixed(2);
      }
      if (typeof ret.disputeAmount === 'number') {
        ret.disputeAmount = (ret.disputeAmount / 100).toFixed(2);
      }
      delete ret.__v;
      return ret;
    },
    virtuals: true,
  },
})
export class TransactionSchemaClass {
  @Prop({
    required: function (this: TransactionSchemaClass) {
      return this.type === TransactionType.PAYMENT;
    },
  })
  stripeCheckoutSessionId?: string;

  @Prop()
  paymentIntentId?: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({
    required: function (this: TransactionSchemaClass) {
      return this.type === TransactionType.PAYMENT;
    },
  })
  customerId?: string;

  @Prop({
    required: function (this: TransactionSchemaClass) {
      return this.type === TransactionType.PAYMENT;
    },
    type: [String],
  })
  productItemIds?: string[];

  @Prop({
    type: String,
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Prop({
    type: String,
    enum: TransactionType,
    required: true,
  })
  type: TransactionType;

  @Prop({ type: Object })
  paymentMethodDetails?: StripePaymentMethodDetails;

  @Prop()
  description?: string;

  @Prop()
  receiptEmail?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  refundId?: string;

  @Prop()
  refundAmount?: number;

  @Prop()
  refundReason?: string;

  @Prop()
  disputeId?: string;

  @Prop()
  disputeStatus?: string;

  @Prop()
  disputeAmount?: number;

  @Prop()
  error?: string;

  @Prop({ type: [Object], default: [] })
partialRefunds?: Array<{
  ticketId: string;
  refundId: string;
  amount: number;
  reason?: string;
  refundedAt: Date;
}>;

@Prop({ type: Object })
checkoutData?: CheckoutData;
}

export const TransactionSchema = SchemaFactory.createForClass(
  TransactionSchemaClass,
);

TransactionSchema.index(
  { stripeCheckoutSessionId: 1 },
  { unique: true, partialFilterExpression: { type: TransactionType.PAYMENT } },
);
TransactionSchema.index({ paymentIntentId: 1 }, { sparse: true });
TransactionSchema.index({ vendorId: 1 });
TransactionSchema.index({ customerId: 1 });
TransactionSchema.index({ productItemIds: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ createdAt: 1 });
TransactionSchema.index({ vendorId: 1, type: 1, status: 1 });
