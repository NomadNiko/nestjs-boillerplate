import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now } from 'mongoose';

export type ViatorProductSchemaDocument =
  HydratedDocument<ViatorProductSchemaClass>;

@Schema({
  timestamps: true,
  strict: false,
  toJSON: {
    transform: (_, ret) => {
      // Properly handle ObjectId conversion to string
      if (ret._id) {
        ret._id = ret._id.toString();
      }
      delete ret.__v;
      return ret;
    },
    virtuals: true,
    getters: true,
  },
})
export class ViatorProductSchemaClass {
  @Prop({ index: true })
  productCode: string;

  @Prop({ index: 'text' })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: [Object], default: [] })
  images: Record<string, unknown>[];

  @Prop({ type: Object })
  pricing: Record<string, unknown>;

  @Prop({ type: Object })
  reviews: Record<string, unknown>;

  @Prop({ type: [Number], index: true })
  tags: number[];

  @Prop({ type: [Object], index: true })
  destinations: Record<string, unknown>[];

  @Prop({ type: [String] })
  flags: string[];

  @Prop()
  productUrl: string;

  @Prop({ type: Date, default: now })
  lastRefreshed: Date;

  // Store raw data
  @Prop({ type: Object })
  additionalData?: Record<string, unknown>;
}

export const ViatorProductSchema = SchemaFactory.createForClass(
  ViatorProductSchemaClass,
);

// Create indexes
ViatorProductSchema.index({ tags: 1 });
ViatorProductSchema.index({ 'destinations.ref': 1 });
