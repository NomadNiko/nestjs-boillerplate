// src/viator-tag/viator-tag.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now } from 'mongoose';
export type ViatorTagSchemaDocument = HydratedDocument<ViatorTagSchemaClass>;

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
export class ViatorTagSchemaClass {
  @Prop({ index: true })
  tagId: number;

  @Prop({ type: [Number], default: [], index: true })
  parentTagIds: number[];

  @Prop({ type: Object, default: {} })
  allNamesByLocale: Record<string, string>;

  @Prop({ type: Date, default: now })
  lastRefreshed: Date;
}

export const ViatorTagSchema =
  SchemaFactory.createForClass(ViatorTagSchemaClass);

// Create additional indexes
ViatorTagSchema.index({ 'allNamesByLocale.en': 'text' }, { sparse: true });
