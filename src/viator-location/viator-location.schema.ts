// src/viator-location/viator-location.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now } from 'mongoose';
export type ViatorLocationSchemaDocument =
  HydratedDocument<ViatorLocationSchemaClass>;

export enum ViatorLocationProvider {
  TRIPADVISOR = 'TRIPADVISOR',
  GOOGLE = 'GOOGLE',
}

@Schema({
  timestamps: true,
  strict: false, // Accept any fields even if not in schema
  toJSON: {
    transform: (_, ret) => {
      ret._id = ret._id.toString();
      delete ret.__v;
      return ret;
    },
    virtuals: true,
    getters: true,
  },
})
export class ViatorLocationSchemaClass {
  @Prop({ index: true })
  reference: string;

  @Prop()
  provider: string;

  @Prop()
  name: string;

  @Prop({ type: String })
  unstructuredAddress?: string;

  @Prop({ type: Object })
  address?: {
    street?: string;
    administrativeArea?: string;
    state?: string;
    country?: string;
    countryCode?: string;
    postcode?: string;
  };

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ type: Date, default: now })
  lastRefreshed: Date;

  // Add this to support rawData
  @Prop({ type: Object })
  additionalData?: Record<string, any>;
}

export const ViatorLocationSchema = SchemaFactory.createForClass(
  ViatorLocationSchemaClass,
);

// Create additional indexes
ViatorLocationSchema.index({ name: 'text' });
ViatorLocationSchema.index({ provider: 1 });
ViatorLocationSchema.index({ 'address.countryCode': 1 });
ViatorLocationSchema.index({ latitude: 1, longitude: 1 }, { sparse: true });
