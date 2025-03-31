import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProductItemSchemaClass,
  ProductItemSchemaDocument,
  ProductItemStatusEnum,
} from '../infrastructure/persistence/document/entities/product-item.schema';
import { ProductItemTransformService } from './product-item-transform.service';

@Injectable()
export class ProductItemQueryService {
  constructor(
    @InjectModel(ProductItemSchemaClass.name)
    private readonly itemModel: Model<ProductItemSchemaDocument>,
    private readonly transformService: ProductItemTransformService,
  ) {}

  async findAllItems() {
    const items = await this.itemModel.find().select('-__v').lean().exec();
    return {
      data: items.map((item) => this.transformService.transformItemResponse(item)),
    };
  }

  async findByTemplate(templateId: string) {
    const items = await this.itemModel
      .find({
        templateId: templateId,
        itemStatus: ProductItemStatusEnum.PUBLISHED,
      })
      .select('-__v')
      .lean()
      .exec();
    return {
      data: items.map((item) => this.transformService.transformItemResponse(item)),
    };
  }

  async findByVendor(vendorId: string) {
    const items = await this.itemModel
      .find({
        vendorId: vendorId,
      })
      .select('-__v')
      .lean()
      .exec();
    return {
      data: items.map((item) => this.transformService.transformItemResponse(item)),
    };
  }

  async findById(id: string) {
    const item = await this.itemModel.findById(id).select('-__v').lean().exec();
    if (!item) {
      throw new NotFoundException(`Product item with ID ${id} not found`);
    }
    return {
      data: this.transformService.transformItemResponse(item),
    };
  }

  async findAvailableItems(templateId: string, date: Date) {
    const items = await this.itemModel
      .find({
        templateId: templateId,
        productDate: date,
        itemStatus: ProductItemStatusEnum.PUBLISHED,
        quantityAvailable: { $gt: 0 },
      })
      .select('-__v')
      .lean()
      .exec();
    return {
      data: items.map((item) => this.transformService.transformItemResponse(item)),
    };
  }

  async findPublicByVendor(vendorId: string) {
    const items = await this.itemModel
      .find({
        vendorId: vendorId,
        itemStatus: ProductItemStatusEnum.PUBLISHED,
      })
      .select('-__v')
      .lean()
      .exec();

    return {
      data: items.map((item) => this.transformService.transformItemResponse(item)),
    };
  }

  async findNearby(lat: number, lng: number, radius: number = 10) {
    const radiusInMeters = radius * 1609.34; // Convert miles to meters

    const items = await this.itemModel
      .find({
        itemStatus: ProductItemStatusEnum.PUBLISHED,
        quantityAvailable: { $gt: 0 },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: radiusInMeters,
          },
        },
      })
      .select('-__v')
      .lean()
      .exec();

    return {
      data: items.map((item) => this.transformService.transformItemResponse(item)),
    };
  }

  async findNearbyToday(
    lat: number, 
    lng: number, 
    radius: number = 10, 
    startDate?: Date, 
    endDate?: Date
  ) {
    const radiusInMeters = radius * 1609.34;
  
    const today = startDate || new Date();
    today.setHours(0, 0, 0, 0);
    const twoDaysFromNow = endDate || new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);
  
    const items = await this.itemModel
      .find({
        itemStatus: ProductItemStatusEnum.PUBLISHED,
        quantityAvailable: { $gt: 0 },
        productDate: {
          $gte: today,
          $lt: twoDaysFromNow
        },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: radiusInMeters,
          },
        },
      })
      .select('-__v')
      .lean()
      .exec();

    return {
      data: items.map((item) => this.transformService.transformItemResponse(item)),
    };
  }
}