import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type ProductSchemaDocument = HydratedDocument<ProductSchemaClass>;

export enum ProductStatusEnum {
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
export class ProductSchemaClass extends EntityDocumentHelper {
  // Required fields
  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  productDescription: string;

  @Prop({ 
    required: true,
    type: Number,
    min: 0
  })
  productPrice: number;

  @Prop({ 
    required: true,
    type: String,
    enum: ['tours', 'lessons', 'rentals', 'tickets']
  })
  productType: ProductType;

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

  // Optional fields
  @Prop()
  productImageURL?: string;

  @Prop({ type: Number })
  productDuration?: number; // Duration in hours

  @Prop({ type: Date })
  productDate?: Date;

  @Prop({ type: String })
  productStartTime?: string;

  @Prop({ type: String })
  productAdditionalInfo?: string;

  @Prop({ type: [String] })
  productRequirements?: string[];

  @Prop({ type: String })
  productWaiver?: string;

  @Prop({
    type: String,
    enum: ProductStatusEnum,
    default: ProductStatusEnum.DRAFT,
    required: true
  })
  productStatus: ProductStatusEnum;

  // Reference to vendor
  @Prop({ type: String, required: true })
  vendorId: string;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(ProductSchemaClass);

// Indexes
ProductSchema.index({ latitude: 1, longitude: 1 });
ProductSchema.index({ productStatus: 1 });
ProductSchema.index({ productType: 1 });
ProductSchema.index({ vendorId: 1 });
ProductSchema.index({ productName: 'text', productDescription: 'text' });
ProductSchema.index({ productPrice: 1 });