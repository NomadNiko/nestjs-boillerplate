// src/viator-product/viator-product.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ViatorApiService } from '../viator-api/viator-api.service';
import {
  ProductSearchRequestDto,
  ProductSearchResponseDto,
} from './dto/viator-product.dto';
import {
  ViatorProductSchemaClass,
  ViatorProductSchemaDocument,
} from './viator-product.schema';

@Injectable()
export class ViatorProductService {
  private readonly logger = new Logger(ViatorProductService.name);

  constructor(
    private readonly viatorApiService: ViatorApiService,
    @InjectModel(ViatorProductSchemaClass.name)
    private readonly productModel: Model<ViatorProductSchemaDocument>,
  ) {}

  async searchProducts(
    searchRequest: ProductSearchRequestDto,
  ): Promise<ProductSearchResponseDto> {
    try {
      this.logger.log(
        `Searching products for destination: ${searchRequest.destination}`,
      );

      const requestBody = {
        filtering: {
          destination: searchRequest.destination,
          tags: searchRequest.tags || [],
          flags: searchRequest.flags || [],
          lowestPrice: searchRequest.lowestPrice,
          highestPrice: searchRequest.highestPrice,
          startDate: searchRequest.startDate,
          endDate: searchRequest.endDate,
        },
        sorting: {
          sort: searchRequest.sortBy || 'DEFAULT',
          order: searchRequest.sortOrder,
        },
        pagination: {
          start:
            ((searchRequest.page || 1) - 1) * (searchRequest.pageSize || 20) +
            1,
          count: searchRequest.pageSize || 20,
        },
        currency: searchRequest.currency || 'USD',
      };

      const response =
        await this.viatorApiService.makeRequest<ProductSearchResponseDto>(
          '/products/search',
          'POST',
          requestBody,
        );

      if (response?.products?.length > 0) {
        await this.cacheProducts(response.products);
      }

      return response || { products: [], totalCount: 0 };
    } catch (error) {
      this.logger.error(`Error searching products: ${error.message}`);
      return { products: [], totalCount: 0 };
    }
  }

  async getProductDetails(
    productCode: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      const cachedProduct = await this.productModel
        .findOne({ productCode })
        .lean();

      if (cachedProduct && this.isCacheValid(cachedProduct.lastRefreshed)) {
        return {
          ...cachedProduct,
          _id: cachedProduct._id?.toString(),
        };
      }

      const response = await this.viatorApiService.makeRequest<
        Record<string, unknown>
      >(`/products/${productCode}`);

      if (response && response.productCode) {
        const savedProduct = await this.cacheProduct(response);
        return savedProduct
          ? {
              ...response,
              _id: savedProduct._id?.toString(),
            }
          : response;
      }

      if (cachedProduct) {
        return {
          ...cachedProduct,
          _id: cachedProduct._id?.toString(),
        };
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error getting product details for ${productCode}: ${error.message}`,
      );
      return null;
    }
  }

  private async cacheProducts(
    products: Record<string, unknown>[],
  ): Promise<void> {
    try {
      for (const product of products) {
        await this.cacheProduct(product);
      }
    } catch (error) {
      this.logger.error(`Error caching products: ${error.message}`);
    }
  }

  private async cacheProduct(
    product: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    try {
      if (!product.productCode) {
        return null;
      }

      const result = await this.productModel
        .findOneAndUpdate(
          { productCode: product.productCode },
          {
            $set: {
              ...product,
              lastRefreshed: new Date(),
            },
          },
          { upsert: true, new: true },
        )
        .lean();

      return result;
    } catch (error) {
      this.logger.error(`Error caching product: ${error.message}`);
      return null;
    }
  }

  private isCacheValid(lastRefreshed: Date): boolean {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return lastRefreshed > oneDayAgo;
  }
}
