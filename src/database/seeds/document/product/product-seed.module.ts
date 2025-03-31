import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductSeedService } from './product-seed.service';
import {
  ProductSchemaClass,
  ProductSchema,
} from '../../../../products/infrastructure/persistence/document/entities/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ProductSchemaClass.name,
        schema: ProductSchema,
      },
    ]),
  ],
  providers: [ProductSeedService],
  exports: [ProductSeedService],
})
export class ProductSeedModule {}