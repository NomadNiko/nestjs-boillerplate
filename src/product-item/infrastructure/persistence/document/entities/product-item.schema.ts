import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';
import { ProductType } from '../../../../../product-template/infrastructure/persistence/document/entities/product-template.schema';

export type ProductItemSchemaDocument = HydratedDocument<ProductItemSchemaClass>;

export enum ProductItemStatusEnum {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret._id = ret._id.toString();
      ret.location = {
        type: 'Point',
        coordinates: [Number(ret.longitude), Number(ret.latitude)]
      };
      delete ret.__v;
      return ret;
    },
    virtuals: true,
    getters: true,
  }
})
export class ProductItemSchemaClass extends EntityDocumentHelper {
  // Reference fields
  @Prop({ required: true })
  templateId: string;

  @Prop({ required: true })
  vendorId: string;

  // Core item-specific fields
  @Prop({ type: Date, required: true })
  productDate: Date;

  @Prop({ type: String, required: true })
  startTime: string;

  @Prop({ 
    type: Number,
    required: true,
    min: 0
  })
  duration: number;

  @Prop({ 
    type: Number,
    required: true,
    min: 0
  })
  price: number;

  @Prop({ 
    type: Number,
    required: true,
    min: 0,
    default: 0
  })
  quantityAvailable: number;

  // Location fields
  @Prop({ 
    required: true, 
    type: Number,
    set: (val: string | number) => Number(val)
  })
  longitude: number;

  @Prop({ 
    required: true, 
    type: Number,
    set: (val: string | number) => Number(val)
  })
  latitude: number;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  })
  location: {
    type: string;
    coordinates: number[];
  };


  // Template snapshot fields
  @Prop({ required: true })
  templateName: string;

  @Prop({ required: true })
  description: string;

  @Prop({ 
    required: true,
    type: String,
    enum: ['tours', 'lessons', 'rentals', 'tickets']
  })
  productType: ProductType;

  @Prop({ type: [String], default: [] })
  requirements: string[];

  @Prop({ type: String })
  waiver: string;

  @Prop()
  imageURL?: string;

  @Prop()
  additionalInfo?: string;

  // Status field
  @Prop({
    type: String,
    enum: ProductItemStatusEnum,
    default: ProductItemStatusEnum.DRAFT,
    required: true
  })
  itemStatus: ProductItemStatusEnum;

  // Optional item-specific fields
  @Prop()
  instructorName?: string;

  @Prop()
  tourGuide?: string;

  @Prop()
  equipmentSize?: string;

  @Prop({ type: String })
  notes?: string;

  // Timestamps
  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const ProductItemSchema = SchemaFactory.createForClass(ProductItemSchemaClass);

// Indexes
ProductItemSchema.index({ templateId: 1 });
ProductItemSchema.index({ vendorId: 1 });
ProductItemSchema.index({ productDate: 1 });
ProductItemSchema.index({ startTime: 1 });
ProductItemSchema.index({ itemStatus: 1 });
ProductItemSchema.index({ latitude: 1, longitude: 1 });
ProductItemSchema.index({ quantityAvailable: 1 });
ProductItemSchema.index({ templateName: 'text', description: 'text' });
// Location index for geospatial queries
ProductItemSchema.index({ location: '2dsphere' });
// Individual coordinate indexes