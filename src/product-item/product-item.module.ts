import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductItemController } from './product-item.controller';
import { ProductItemService } from './product-item.service';
import { VendorModule } from '../vendors/vendor.module';
import {
  ProductItemSchemaClass,
  ProductItemSchema,
} from './infrastructure/persistence/document/entities/product-item.schema';
import { ProductTemplateModule } from '../product-template/product-template.module';
import { ProductItemQueryService } from './services/product-item-query.service';
import { ProductItemAvailabilityService } from './services/product-item-availability.service';
import { ProductItemQuantityService } from './services/product-item-quantity.service';
import { ProductItemManagementService } from './services/product-item-management.service';
import { ProductItemTransformService } from './services/product-item-transform.service';
import { ProductItemCleanupService } from './services/product-item-cleanup.service';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ProductItemSchemaClass.name,
        schema: ProductItemSchema,
      },
    ]),
    ScheduleModule.forRoot(),
    VendorModule,
    ProductTemplateModule,
  ],
  controllers: [ProductItemController],
  providers: [
    ProductItemService,
    ProductItemCleanupService,
    ProductItemQueryService,
    ProductItemAvailabilityService,
    ProductItemQuantityService,
    ProductItemManagementService,
    ProductItemTransformService,
  ],
  exports: [ProductItemService],
})
export class ProductItemModule {}