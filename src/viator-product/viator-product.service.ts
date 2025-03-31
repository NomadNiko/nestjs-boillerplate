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

      // Build the request body for the Viator API
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
      // Make the request to the Viator API
      const response =
        await this.viatorApiService.makeRequest<ProductSearchResponseDto>(
          '/products/search',
          'POST',
          requestBody,
        );

      // Cache products for future use
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
      // Try to get from cache first
      const cachedProduct = await this.productModel
        .findOne({ productCode })
        .lean();
      if (cachedProduct && this.isCacheValid(cachedProduct.lastRefreshed)) {
        return cachedProduct;
      }

      // If not in cache or expired, fetch from API
      const response = await this.viatorApiService.makeRequest<
        Record<string, unknown>
      >(`/products/${productCode}`);

      if (response && response.productCode) {
        // Cache the new data
        await this.cacheProduct(response);
        return response;
      }

      // If API request failed but we have expired cache, use it
      if (cachedProduct) {
        return cachedProduct;
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

  private async cacheProduct(product: Record<string, unknown>): Promise<void> {
    try {
      if (!product.productCode) {
        return;
      }

      await this.productModel.updateOne(
        { productCode: product.productCode },
        {
          $set: {
            ...product,
            lastRefreshed: new Date(),
          },
        },
        { upsert: true },
      );
    } catch (error) {
      this.logger.error(`Error caching product: ${error.message}`);
    }
  }

  private isCacheValid(lastRefreshed: Date): boolean {
    // Cache is valid for 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return lastRefreshed > oneDayAgo;
  }
}
