import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
  } from '@nestjs/common';
  import { InjectModel } from '@nestjs/mongoose';
  import { Model } from 'mongoose';
  import {
    ProductItemSchemaClass,
    ProductItemSchemaDocument,
    ProductItemStatusEnum,
  } from '../infrastructure/persistence/document/entities/product-item.schema';
  import { ProductItemTransformService } from './product-item-transform.service';
  
  @Injectable()
  export class ProductItemQuantityService {
    constructor(
      @InjectModel(ProductItemSchemaClass.name)
      private readonly itemModel: Model<ProductItemSchemaDocument>,
      private readonly transformService: ProductItemTransformService,
    ) {}
  
    async updateQuantityForPurchase(
      productItemId: string,
      quantityToDeduct: number,
    ): Promise<void> {
      const session = await this.itemModel.startSession();
      session.startTransaction();
  
      try {
        const item = await this.itemModel
          .findById(productItemId)
          .session(session);
  
        if (!item) {
          throw new NotFoundException('Product item not found');
        }
  
        if (item.itemStatus !== ProductItemStatusEnum.PUBLISHED) {
          throw new BadRequestException(
            'Product item is not available for purchase',
          );
        }
  
        if (item.quantityAvailable < quantityToDeduct) {
          throw new BadRequestException('Insufficient quantity available');
        }
  
        const updatedItem = await this.itemModel.findByIdAndUpdate(
          productItemId,
          {
            $inc: { quantityAvailable: -quantityToDeduct },
            $set: { updatedAt: new Date() },
          },
          { new: true, session },
        );
  
        if (!updatedItem) {
          throw new NotFoundException('Failed to update product item quantity');
        }
  
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }
    }
  
    async updateQuantity(id: string, quantityChange: number) {
      const session = await this.itemModel.startSession();
      session.startTransaction();
  
      try {
        const item = await this.itemModel.findById(id).session(session);
  
        if (!item) {
          throw new NotFoundException(`Product item with ID ${id} not found`);
        }
  
        const newQuantity = item.quantityAvailable + quantityChange;
  
        if (newQuantity < 0) {
          throw new BadRequestException('Insufficient quantity available');
        }
  
        item.quantityAvailable = newQuantity;
        await item.save({ session });
        await session.commitTransaction();
  
        return {
          data: this.transformService.transformItemResponse(item),
          message: 'Product item quantity updated successfully',
        };
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }
    }
  }