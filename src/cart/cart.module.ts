import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartCleanupService } from './cart-cleanup.service';
import { CartSchemaClass, CartSchema } from './entities/cart.schema';
import { ProductItemModule } from '../product-item/product-item.module';
import { ProductTemplateModule } from '../product-template/product-template.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CartSchemaClass.name,
        schema: CartSchema,
      },
    ]),
    ScheduleModule.forRoot(),
    ProductItemModule,
    ProductTemplateModule,
  ],
  controllers: [CartController],
  providers: [CartService, CartCleanupService],
  exports: [CartService],
})
export class CartModule {}