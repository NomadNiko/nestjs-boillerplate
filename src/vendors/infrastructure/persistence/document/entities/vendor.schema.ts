import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now } from 'mongoose';

export type VendorSchemaDocument = HydratedDocument<VendorSchemaClass>;

export enum VendorStatusEnum {
  SUBMITTED = 'SUBMITTED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTION_NEEDED = 'ACTION_NEEDED', 
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export type VendorType = 'tours' | 'lessons' | 'rentals' | 'tickets';

export enum StripeRequirementErrorEnum {
  INVALID_ADDRESS_CITY_STATE = 'invalid_address_city_state',
  INVALID_STREET_ADDRESS = 'invalid_street_address',
  INVALID_POSTAL_CODE = 'invalid_postal_code',
  INVALID_SSN_LAST_4 = 'invalid_ssn_last_4',
  INVALID_PHONE_NUMBER = 'invalid_phone_number',
  INVALID_EMAIL = 'invalid_email',
  INVALID_DOB = 'invalid_dob',
  VERIFICATION_FAILED_OTHER = 'verification_failed_other',
  VERIFICATION_DOCUMENT_FAILED = 'verification_document_failed',
  TAX_ID_INVALID = 'tax_id_invalid'
}

export interface StripeRequirement {
  requirement: string;
  dueDate?: Date;
  error?: StripeRequirementErrorEnum;
}

export interface StripePendingVerification {
  details: string;
  dueBy?: Date;
}

@Schema()
export class StripeAccountStatus {
  @Prop({ default: false })
  chargesEnabled: boolean;

  @Prop({ default: false })
  payoutsEnabled: boolean;

  @Prop({ default: false })
  detailsSubmitted: boolean;

  @Prop({ type: [String], default: [] })
  currentlyDue: string[];

  @Prop({ type: [String], default: [] })
  eventuallyDue: string[];

  @Prop({ type: [String], default: [] })
  pastDue: string[];

  @Prop({ type: Object })
  pendingVerification?: StripePendingVerification;

  @Prop({ type: [Object], default: [] })
  errors: StripeRequirement[];
}

@Schema({
  timestamps: true,
})
export class VendorSchemaClass {
  @Prop({ required: true })
  businessName: string;

  @Prop({ required: true })
  description: string;

  @Prop({ 
    type: [String],
    enum: ['tours', 'lessons', 'rentals', 'tickets'],
    default: []
  })
  vendorTypes: VendorType[];

  @Prop()
  website?: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop({ 
    required: true, 
    type: Number,
  })
  longitude: number;

  @Prop({ 
    required: true, 
    type: Number,
  })
  latitude: number;

  @Prop()
  logoUrl?: string;

  @Prop({
    type: String,
    enum: VendorStatusEnum,
    default: VendorStatusEnum.SUBMITTED
  })
  vendorStatus: VendorStatusEnum;

  @Prop()
  actionNeeded?: string;

  @Prop()
  adminNotes?: string;

  @Prop({ 
    type: [String],
    default: [] 
  })
  ownerIds: string[];

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop()
  stripeConnectId?: string;

  @Prop({ type: StripeAccountStatus })
  stripeAccountStatus?: StripeAccountStatus;

  @Prop({ 
    type: Number,
    default: 0,
    get: (v: number) => (v/100).toFixed(2),
    set: (v: number) => v * 100
  })
  accountBalance: number;

  @Prop({ 
    type: Number,
    default: 0,
    get: (v: number) => (v/100).toFixed(2),
    set: (v: number) => v * 100
  })
  pendingBalance: number;

  @Prop({ 
    type: Number,
    default: 0,
    get: (v: number) => (v/100).toFixed(2),
    set: (v: number) => v * 100
  })
  internalAccountBalance: number;

  @Prop({
    type: Number,
    default: 0.13,
    min: 0,
    max: 1
  })
  vendorApplicationFee: number;

  @Prop([String])
  vendorPayments: string[];

  @Prop([String])
  vendorPayouts: string[];

  @Prop({
    type: Boolean,
    default: false
  })
  isStripeSetupComplete: boolean;
  
}

export const VendorSchema = SchemaFactory.createForClass(VendorSchemaClass);

// Indexes
VendorSchema.index({ latitude: 1, longitude: 1 });
VendorSchema.index({ vendorStatus: 1 });
VendorSchema.index({ vendorTypes: 1 });
VendorSchema.index({ businessName: 'text', description: 'text' });

// Schema transform for JSON serialization
VendorSchema.set('toJSON', {
  transform: (doc, ret) => {
    return {
      ...ret,
      _id: ret._id.toString(),
      location: {
        type: 'Point',
        coordinates: [Number(ret.longitude), Number(ret.latitude)]
      },
      stripeConnectId: ret.stripeConnectId,
      stripeAccountStatus: ret.stripeAccountStatus,
      accountBalance: ret.accountBalance,
      pendingBalance: ret.pendingBalance,
      createdAt: ret.createdAt?.toISOString(),
      updatedAt: ret.updatedAt?.toISOString()
    };
  },
  virtuals: true,
  getters: true,
});

// Pre-save middleware
VendorSchema.pre('save', function(next) {
  // Initialize stripeAccountStatus if it doesn't exist
  if (!this.stripeAccountStatus) {
    this.stripeAccountStatus = {
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      currentlyDue: [],
      eventuallyDue: [],
      pastDue: [],
      errors: []
    };
  }
  next();
});