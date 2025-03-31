import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  VendorSchemaClass,
  VendorSchemaDocument,
  VendorType,
} from '../infrastructure/persistence/document/entities/vendor.schema';
import { ProductType } from '../../products/infrastructure/persistence/document/entities/product.schema';
import { transformVendorResponse } from '../../utils/vendor.transform';

@Injectable()
export class VendorProductService {
  constructor(
    @InjectModel(VendorSchemaClass.name)
    private readonly vendorModel: Model<VendorSchemaDocument>,
  ) {}

  async findByType(type: VendorType) {
    try {
      const vendors = await this.vendorModel
        .find({
          vendorStatus: 'APPROVED',
          vendorTypes: type,
        })
        .select('-__v')
        .lean()
        .exec();

      return {
        data: vendors.map((vendor) => transformVendorResponse(vendor)),
      };
    } catch (error) {
      console.error('Error finding vendors by type:', error);
      throw new InternalServerErrorException('Failed to fetch vendors by type');
    }
  }

  async updateVendorTypes(vendorId: string, vendorTypes?: VendorType[]) {
    try {
      // If vendorTypes not provided, fetch from products
      if (!vendorTypes) {
        vendorTypes = await this.getProductTypes(vendorId);
      }

      const updatedVendor = await this.vendorModel
        .findByIdAndUpdate(
          vendorId,
          {
            vendorTypes: Array.from(new Set(vendorTypes)),
            updatedAt: new Date(),
          },
          { new: true },
        )
        .lean();

      if (!updatedVendor) {
        throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
      }

      return {
        data: transformVendorResponse(updatedVendor),
        message: 'Vendor types updated successfully'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error updating vendor types:', error);
      throw new InternalServerErrorException('Failed to update vendor types');
    }
  }

   async getProductTypes(vendorId: string): Promise<ProductType[]> {
    try {
      // Get ProductModel dynamically to avoid circular dependencies
      const ProductModel = this.vendorModel.db.model('ProductSchemaClass');

      const products = await ProductModel.find({
        vendorId: vendorId,
        productStatus: 'PUBLISHED',
      })
        .lean()
        .exec();

      // Extract unique product types
      return Array.from(new Set(products.map((product) => product.productType)));
    } catch (error) {
      console.error('Error getting product types:', error);
      throw new InternalServerErrorException('Failed to get product types');
    }
  }

  async syncVendorTypesWithProducts(vendorId: string) {
    try {
      const productTypes = await this.getProductTypes(vendorId);
      return this.updateVendorTypes(vendorId, productTypes);
    } catch (error) {
      console.error('Error syncing vendor types:', error);
      throw new InternalServerErrorException('Failed to sync vendor types with products');
    }
  }

  async getProductCounts(vendorId: string) {
    try {
      const ProductModel = this.vendorModel.db.model('ProductSchemaClass');

      const productCounts = await ProductModel.aggregate([
        { $match: { vendorId: vendorId } },
        {
          $group: {
            _id: '$productType',
            count: { $sum: 1 },
            publishedCount: {
              $sum: {
                $cond: [{ $eq: ['$productStatus', 'PUBLISHED'] }, 1, 0]
              }
            }
          }
        }
      ]);

      return {
        data: productCounts,
        message: 'Product counts retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting product counts:', error);
      throw new InternalServerErrorException('Failed to get product counts');
    }
  }

  async validateProductType(vendorId: string, productType: ProductType): Promise<boolean> {
    try {
      const vendor = await this.vendorModel
        .findById(vendorId)
        .select('vendorTypes')
        .lean();

      if (!vendor) {
        throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
      }

      return vendor.vendorTypes.includes(productType);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error validating product type:', error);
      throw new InternalServerErrorException('Failed to validate product type');
    }
  }

  async getVendorProductStats(vendorId: string) {
    try {
      const ProductModel = this.vendorModel.db.model('ProductSchemaClass');

      const stats = await ProductModel.aggregate([
        { $match: { vendorId: vendorId } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            averagePrice: { $avg: '$productPrice' },
            publishedProducts: {
              $sum: {
                $cond: [{ $eq: ['$productStatus', 'PUBLISHED'] }, 1, 0]
              }
            },
            productTypes: { $addToSet: '$productType' }
          }
        }
      ]);

      return {
        data: stats[0] || {
          totalProducts: 0,
          averagePrice: 0,
          publishedProducts: 0,
          productTypes: []
        },
        message: 'Product statistics retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting product statistics:', error);
      throw new InternalServerErrorException('Failed to get product statistics');
    }
  }
}