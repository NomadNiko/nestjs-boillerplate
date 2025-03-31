import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  ProductItemSchemaClass, 
  ProductItemStatusEnum 
} from '../infrastructure/persistence/document/entities/product-item.schema';

@Injectable()
export class ProductItemCleanupService {
  constructor(
    @InjectModel(ProductItemSchemaClass.name)
    private readonly productItemModel: Model<ProductItemSchemaClass>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async handleProductItemCleanup() {
    try {
      // Get yesterday's date at the start of the day
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Find published product items with a product date before yesterday
      const expiredProductItems = await this.productItemModel.find({
        productDate: { $lt: todayStart },
        itemStatus: ProductItemStatusEnum.PUBLISHED
      });

      // Update each expired product item to ARCHIVED status
      for (const item of expiredProductItems) {
        item.itemStatus = ProductItemStatusEnum.ARCHIVED;
        item.updatedAt = new Date();
        await item.save();
      }

      console.log(`Product Item Cleanup: Archived ${expiredProductItems.length} expired product items`);
    } catch (error) {
      console.error('Error during product item cleanup:', error);
    }
  }
}