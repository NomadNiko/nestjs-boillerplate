// src/viator-exchange-rate/viator-exchange-rate.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ViatorExchangeRateSchemaDocument =
  HydratedDocument<ViatorExchangeRateSchemaClass>;

@Schema({
  timestamps: true,
})
export class ViatorExchangeRateSchemaClass {
  @Prop({ required: true, index: true })
  sourceCurrency: string;

  @Prop({ required: true, index: true })
  targetCurrency: string;

  @Prop({ required: true, type: Number })
  rate: number;

  @Prop({ required: true })
  lastUpdated: Date;

  @Prop({ required: true, index: true })
  expiry: Date;
}

export const ViatorExchangeRateSchema = SchemaFactory.createForClass(
  ViatorExchangeRateSchemaClass,
);

// Create compound index for currency pair
ViatorExchangeRateSchema.index(
  { sourceCurrency: 1, targetCurrency: 1 },
  { unique: true },
);
