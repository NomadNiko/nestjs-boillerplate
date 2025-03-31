import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductSchemaClass, ProductStatusEnum } from '../../../../products/infrastructure/persistence/document/entities/product.schema';

@Injectable()
export class ProductSeedService {
  constructor(
    @InjectModel(ProductSchemaClass.name)
    private readonly productModel: Model<ProductSchemaClass>,
  ) {}

  async run() {
    const count = await this.productModel.countDocuments();
    if (count === 0) {
      await this.productModel.create([
        {
          productName: 'Waikiki Surf Lesson',
          productDescription: 'Learn to surf in the gentle waves of Waikiki with experienced instructors',
          productPrice: 99.99,
          productType: 'lessons',
          vendorId: '65c0e95eee124a74bee35b7f', // ID of Moku Hawaii from vendor seeds
          latitude: 21.2758128,
          longitude: -157.8241926,
          productImageURL: 'https://example.com/surf-lesson.jpg',
          productDuration: 2, // 2 hours
          productRequirements: ['Must be able to swim', 'Minimum age 8'],
          productAdditionalInfo: 'Includes surfboard rental and rash guard',
          productWaiver: 'Standard liability waiver required',
          productStatus: ProductStatusEnum.PUBLISHED
        },
      ]);
    }
  }
}