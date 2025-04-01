// src/viator-availability/viator-availability.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now } from 'mongoose';

export type ViatorAvailabilitySchemaDocument =
  HydratedDocument<ViatorAvailabilitySchemaClass>;

@Schema({
  timestamps: true,
  strict: false,
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
export class ViatorAvailabilitySchemaClass {
  @Prop({ required: true, index: true })
  productCode: string;

  @Prop({ required: true, index: true })
  startDate: Date;

  @Prop({ index: true })
  endDate: Date;

  @Prop({ type: Object })
  availability: Record<string, unknown>;

  @Prop({ type: Date, default: now })
  lastRefreshed: Date;
}

export const ViatorAvailabilitySchema = SchemaFactory.createForClass(
  ViatorAvailabilitySchemaClass,
);

// Create compound index for product and date range
ViatorAvailabilitySchema.index({ productCode: 1, startDate: 1, endDate: 1 });
