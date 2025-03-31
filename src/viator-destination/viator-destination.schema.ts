// src/viator-destination/viator-destination.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now } from 'mongoose';
export type ViatorDestinationSchemaDocument =
  HydratedDocument<ViatorDestinationSchemaClass>;

@Schema({
  timestamps: true,
  strict: false, // Accept any fields even if not in schema
  toJSON: {
    transform: (_, ret) => {
      ret._id = ret._id.toString();
      if (ret.longitude !== undefined && ret.latitude !== undefined) {
        ret.center = {
          type: 'Point',
          coordinates: [ret.longitude, ret.latitude],
        };
      }
      delete ret.__v;
      return ret;
    },
    virtuals: true,
    getters: true,
  },
})
export class ViatorDestinationSchemaClass {
  @Prop({ index: true })
  destinationId: number;

  @Prop({ index: 'text' })
  name: string;

  @Prop()
  type: string;

  @Prop()
  parentDestinationId: number;

  @Prop({ index: true })
  lookupId: string;

  @Prop()
  destinationUrl?: string;

  @Prop()
  defaultCurrencyCode?: string;

  @Prop()
  timeZone?: string;

  @Prop({ type: [String], default: [] })
  iataCodes: string[];

  @Prop()
  countryCallingCode?: string;

  @Prop({ type: [String], default: [] })
  languages: string[];

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

export const ViatorDestinationSchema = SchemaFactory.createForClass(
  ViatorDestinationSchemaClass,
);

// Create additional indexes
ViatorDestinationSchema.index({ parentDestinationId: 1 });
ViatorDestinationSchema.index({ name: 1 });
