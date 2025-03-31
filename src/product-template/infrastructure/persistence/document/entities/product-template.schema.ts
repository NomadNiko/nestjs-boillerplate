import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type ProductTemplateSchemaDocument = HydratedDocument<ProductTemplateSchemaClass>;

export enum ProductTemplateStatusEnum {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export type ProductType = 'tours' | 'lessons' | 'rentals' | 'tickets';

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
export class ProductTemplateSchemaClass extends EntityDocumentHelper {
  // Required Fields
  @Prop({ required: true })
  templateName: string;

  @Prop({ required: true })
  description: string;

  @Prop({ 
    required: true,
    type: Number,
    min: 0
  })
  basePrice: number;

  @Prop({ 
    required: true,
    type: String,
    enum: ['tours', 'lessons', 'rentals', 'tickets']
  })
  productType: ProductType;

  @Prop({ required: true })
  vendorId: string;

  @Prop({ type: [String], default: [] })
  requirements: string[];

  @Prop({ type: String })
  waiver: string;

  @Prop({
    type: String,
    enum: ProductTemplateStatusEnum,
    default: ProductTemplateStatusEnum.DRAFT,
    required: true
  })
  templateStatus: ProductTemplateStatusEnum;

  // Optional Fields
  @Prop()
  imageURL?: string;

  @Prop()
  additionalInfo?: string;

  // Default fields that can be overridden by ProductItem
  @Prop({ 
    type: Number,
    set: (val: string | number) => Number(val)
  })
  defaultLongitude?: number;

  @Prop({ 
    type: Number,
    set: (val: string | number) => Number(val)
  })
  defaultLatitude?: number;

  @Prop({ type: Number })
  defaultDuration?: number; // Duration in hours

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const ProductTemplateSchema = SchemaFactory.createForClass(ProductTemplateSchemaClass);

// Indexes
ProductTemplateSchema.index({ templateName: 'text', description: 'text' });
ProductTemplateSchema.index({ templateStatus: 1 });
ProductTemplateSchema.index({ productType: 1 });
ProductTemplateSchema.index({ vendorId: 1 });
ProductTemplateSchema.index({ basePrice: 1 });