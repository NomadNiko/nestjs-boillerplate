import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED'
}

export interface StripeTransferDetails {
  transferId: string;
  destination?: string;  // Stripe account ID where funds were transferred
  destinationPayment?: string;  // Stripe payment ID on the destination account
  sourceType?: string;
  transferGroup?: string;
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret._id = ret._id.toString();
      if (typeof ret.amount === 'number') {
        ret.amount = (ret.amount / 100).toFixed(2);
      }
      delete ret.__v;
      return ret;
    },
    virtuals: true
  }
})
export class PayoutSchemaClass extends EntityDocumentHelper {
  @Prop({ required: true })
  vendorId: string;

  @Prop({ 
    type: Number,
    required: true,
    get: (v: number) => (v/100).toFixed(2),
    set: (v: number) => v * 100
  })
  amount: number;

  @Prop({
    type: String,
    enum: PayoutStatus,
    default: PayoutStatus.PENDING
  })
  status: PayoutStatus;

  @Prop({ type: Object })
  stripeTransferDetails?: StripeTransferDetails;

  @Prop()
  description?: string;

  @Prop()
  error?: string;

  @Prop({ type: Date })
  processedAt?: Date;
}

export const PayoutSchema = SchemaFactory.createForClass(PayoutSchemaClass);

// Indexes for efficient querying
PayoutSchema.index({ vendorId: 1 });
PayoutSchema.index({ status: 1 });
PayoutSchema.index({ createdAt: -1 });