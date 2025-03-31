import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CartSchemaClass } from './entities/cart.schema';
import { ProductItemService } from '../product-item/product-item.service';

@Injectable()
export class CartCleanupService {
  constructor(
    @InjectModel(CartSchemaClass.name)
    private readonly cartModel: Model<CartSchemaClass>,
    private readonly productItemService: ProductItemService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCartCleanup() {
    try {
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
      
      // Only cleanup carts that aren't in checkout process
      const expiredCarts = await this.cartModel.find({
        updatedAt: { $lt: twentyMinutesAgo },
        isCheckingOut: false
      });

      for (const cart of expiredCarts) {
        // Return items to inventory
        for (const item of cart.items) {
          await this.productItemService.updateQuantity(
            item.productItemId,
            item.quantity // Add back the quantity
          );
        }
        
        await this.cartModel.findByIdAndDelete(cart._id);
      }

      // Handle stuck checkouts (carts that have been in checkout for too long)
      const stuckCheckoutTimeout = new Date(Date.now() - 60 * 60 * 1000); // 1 hour
      const stuckCheckouts = await this.cartModel.find({
        updatedAt: { $lt: stuckCheckoutTimeout },
        isCheckingOut: true
      });

      for (const cart of stuckCheckouts) {
        // Reset checkout status and update timestamp to give another cleanup cycle
        await this.cartModel.findByIdAndUpdate(cart._id, {
          isCheckingOut: false,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error during cart cleanup:', error);
    }
  }
}