import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductTemplateController } from './product-template.controller';
import { ProductTemplateService } from './product-template.service';
import {
  ProductTemplateSchemaClass,
  ProductTemplateSchema,
} from './infrastructure/persistence/document/entities/product-template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ProductTemplateSchemaClass.name,
        schema: ProductTemplateSchema,
      },
    ]),
  ],
  controllers: [ProductTemplateController],
  providers: [ProductTemplateService],
  exports: [ProductTemplateService],
})
export class ProductTemplateModule {}