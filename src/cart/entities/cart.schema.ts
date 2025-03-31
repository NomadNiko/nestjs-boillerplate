import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export type CartDocument = HydratedDocument<CartSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret._id = ret._id.toString();
      if (ret.items) {
        ret.items = ret.items.map((item: any) => ({
          ...item,
          price: parseFloat(item.price),
          productDate: item.productDate?.toISOString(),
        }));
      }
      delete ret.__v;
      return ret;
    },
    virtuals: true,
  },
})
export class CartItemClass {
  @Prop({ required: true })
  productItemId: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ 
    type: Number,
    required: true,
    get: (v: number) => parseFloat((v/100).toFixed(2)),
    set: (v: number) => Math.round(v * 100)
  })
  price: number;

  @Prop({ 
    type: Number,
    required: true,
    min: 1 
  })
  quantity: number;

  @Prop({ required: true })
  vendorId: string;

  @Prop({ 
    type: Date,
    required: true 
  })
  productDate: Date;

  @Prop({ required: true })
  productStartTime: string;

  @Prop({ 
    type: Number,
    required: true,
    min: 0
  })
  productDuration: number;
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret._id = ret._id.toString();
      delete ret.__v;
      return ret;
    },
    virtuals: true,
  },
})
export class CartSchemaClass {
  @Prop({ required: true })
  userId: string;

  @Prop({
    type: [CartItemClass],
    default: [],
  })
  items: CartItemClass[];

  @Prop({ default: false })
  isCheckingOut: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const CartSchema = SchemaFactory.createForClass(CartSchemaClass);

CartSchema.index({ userId: 1, 'items.productItemId': 1 });
CartSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
CartSchema.index({ userId: 1 });

CartSchema.virtual('total').get(function() {
  return this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
});

CartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

CartSchema.pre('save', function(next) {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  const invalidTimes = this.items.filter(item => 
    !timeRegex.test(item.productStartTime)
  );
  if (invalidTimes.length > 0) {
    const error = new Error('Invalid time format. Must be HH:mm in 24-hour format');
    return next(error);
  }
  next();
});

CartSchema.methods.getItemTotal = function(productItemId: string): number {
  const item = this.items.find(item => item.productItemId === productItemId);
  return item ? item.price * item.quantity : 0;
};

CartSchema.methods.hasItem = function(productItemId: string): boolean {
  return this.items.some(item => item.productItemId === productItemId);
};

CartSchema.methods.getTimeToExpiration = function(): number {
  const expirationTime = this.createdAt.getTime() + (86400 * 1000); // 24 hours in milliseconds
  return Math.max(0, expirationTime - Date.now());
};