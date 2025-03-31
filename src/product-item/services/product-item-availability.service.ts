import {
    Injectable,
    InternalServerErrorException,
  } from '@nestjs/common';
  import { InjectModel } from '@nestjs/mongoose';
  import { Model } from 'mongoose';
  import {
    ProductItemSchemaClass,
    ProductItemSchemaDocument,
    ProductItemStatusEnum,
  } from '../infrastructure/persistence/document/entities/product-item.schema';
  
  @Injectable()
  export class ProductItemAvailabilityService {
    constructor(
      @InjectModel(ProductItemSchemaClass.name)
      private readonly itemModel: Model<ProductItemSchemaDocument>,
    ) {}
  
    async validateAvailability(
      productItemId: string,
      requestedQuantity: number,
    ): Promise<boolean> {
      const session = await this.itemModel.startSession();
      session.startTransaction();
  
      try {
        const item = await this.itemModel
          .findOne({
            _id: productItemId,
            itemStatus: ProductItemStatusEnum.PUBLISHED,
            quantityAvailable: { $gte: requestedQuantity },
          })
          .session(session);
  
        await session.commitTransaction();
        return !!item;
      } catch (error) {
        await session.abortTransaction();
        console.error('Error validating product item availability:', error);
        throw new InternalServerErrorException('Failed to validate availability');
      } finally {
        await session.endSession();
      }
    }
  
    async validateAndReserveQuantity(
      items: Array<{ productItemId: string; quantity: number }>,
    ): Promise<boolean> {
      const session = await this.itemModel.startSession();
      session.startTransaction();
  
      try {
        for (const item of items) {
          const productItem = await this.itemModel
            .findOne({
              _id: item.productItemId,
              itemStatus: ProductItemStatusEnum.PUBLISHED,
              quantityAvailable: { $gte: item.quantity },
            })
            .session(session);
  
          if (!productItem) {
            await session.abortTransaction();
            return false;
          }
        }
  
        await session.commitTransaction();
        return true;
      } catch (error) {
        await session.abortTransaction();
        console.error('Error validating quantities:', error);
        throw new InternalServerErrorException('Failed to validate quantities');
      } finally {
        await session.endSession();
      }
    }
  
    async checkAvailabilityForDate(
      productItemId: string,
      date: Date,
    ): Promise<boolean> {
      try {
        const item = await this.itemModel.findOne({
          _id: productItemId,
          productDate: date,
          itemStatus: ProductItemStatusEnum.PUBLISHED,
          quantityAvailable: { $gt: 0 },
        });
  
        return !!item;
      } catch (error) {
        console.error('Error checking product item availability:', error);
        throw new InternalServerErrorException('Failed to check availability');
      }
    }
  
    async checkAvailabilityForDateRange(
      templateId: string,
      startDate: Date,
      endDate: Date,
    ): Promise<
      { date: string; available: boolean; quantityAvailable: number }[]
    > {
      try {
        const items = await this.itemModel
          .find({
            templateId,
            productDate: {
              $gte: startDate,
              $lte: endDate,
            },
            itemStatus: ProductItemStatusEnum.PUBLISHED,
          })
          .select('productDate quantityAvailable')
          .lean();
  
        const dateMap = new Map();
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          dateMap.set(currentDate.toISOString().split('T')[0], {
            available: false,
            quantityAvailable: 0,
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
  
        items.forEach((item) => {
          const dateKey = new Date(item.productDate).toISOString().split('T')[0];
          dateMap.set(dateKey, {
            available: item.quantityAvailable > 0,
            quantityAvailable: item.quantityAvailable,
          });
        });
  
        return Array.from(dateMap.entries()).map(([date, data]) => ({
          date,
          available: data.available,
          quantityAvailable: data.quantityAvailable,
        }));
      } catch (error) {
        console.error('Error checking date range availability:', error);
        throw new InternalServerErrorException(
          'Failed to check date range availability',
        );
      }
    }
  
    async checkBulkAvailability(
      items: Array<{ productItemId: string; quantity: number; date?: Date }>,
    ): Promise<{
      available: boolean;
      unavailableItems: Array<{ productItemId: string; reason: string }>;
    }> {
      try {
        const unavailableItems: Array<{ productItemId: string; reason: string }> =
          [];
  
        for (const item of items) {
          const productItem = await this.itemModel.findOne({
            _id: item.productItemId,
            itemStatus: ProductItemStatusEnum.PUBLISHED,
            ...(item.date && { productDate: item.date }),
            quantityAvailable: { $gte: item.quantity },
          });
  
          if (!productItem) {
            const existingItem = await this.itemModel.findById(
              item.productItemId,
            );
            let reason = 'Item not found';
  
            if (existingItem) {
              if (existingItem.itemStatus !== ProductItemStatusEnum.PUBLISHED) {
                reason = 'Item not available for booking';
              } else if (existingItem.quantityAvailable < item.quantity) {
                reason = `Insufficient quantity (requested: ${item.quantity}, available: ${existingItem.quantityAvailable})`;
              }
            }
  
            unavailableItems.push({
              productItemId: item.productItemId,
              reason,
            });
          }
        }
  
        return {
          available: unavailableItems.length === 0,
          unavailableItems,
        };
      } catch (error) {
        console.error('Error checking bulk availability:', error);
        throw new InternalServerErrorException(
          'Failed to check bulk availability',
        );
      }
    }
  
    async getAvailabilityCalendar(
      templateId: string,
      month: number,
      year: number,
    ): Promise<
      {
        date: string;
        timeSlots: Array<{
          startTime: string;
          available: boolean;
          quantityAvailable: number;
        }>;
      }[]
    > {
      try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
  
        const items = await this.itemModel
          .find({
            templateId,
            productDate: {
              $gte: startDate,
              $lte: endDate,
            },
            itemStatus: ProductItemStatusEnum.PUBLISHED,
          })
          .select('productDate startTime quantityAvailable')
          .lean();
  
        const calendarMap = new Map();
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          calendarMap.set(currentDate.toISOString().split('T')[0], {
            timeSlots: [],
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
  
        items.forEach((item) => {
          const dateKey = new Date(item.productDate).toISOString().split('T')[0];
          const dateData = calendarMap.get(dateKey);
  
          if (dateData) {
            dateData.timeSlots.push({
              startTime: item.startTime,
              available: item.quantityAvailable > 0,
              quantityAvailable: item.quantityAvailable,
            });
          }
        });
  
        return Array.from(calendarMap.entries()).map(([date, data]) => ({
          date,
          timeSlots: data.timeSlots.sort((a, b) =>
            a.startTime.localeCompare(b.startTime),
          ),
        }));
      } catch (error) {
        console.error('Error generating availability calendar:', error);
        throw new InternalServerErrorException(
          'Failed to generate availability calendar',
        );
      }
    }
  }