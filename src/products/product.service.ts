import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProductSchemaClass,
  ProductStatusEnum,
  ProductType,
  ProductSchemaDocument,
} from './infrastructure/persistence/document/entities/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { VendorService } from '../vendors/vendor.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(ProductSchemaClass.name)
    private readonly productModel: Model<ProductSchemaDocument>,
    private readonly vendorService: VendorService
  ) {}

  async findAllProducts() {
    const products = await this.productModel
      .find()
      .select('-__v')
      .lean()
      .exec();
    return {
      data: products.map((product) => this.transformProductResponse(product)),
    };
  }

  async findAllPublished() {
    const products = await this.productModel
      .find({
        productStatus: ProductStatusEnum.PUBLISHED,
      })
      .select('-__v')
      .lean()
      .exec();
    return {
      data: products.map((product) => this.transformProductResponse(product)),
    };
  }

  async findByPriceRange(minPrice: number, maxPrice: number) {
    const products = await this.productModel
      .find({
        productStatus: ProductStatusEnum.PUBLISHED,
        productPrice: {
          $gte: minPrice,
          $lte: maxPrice,
        },
      })
      .select('-__v')
      .lean()
      .exec();
    return {
      data: products.map((product) => this.transformProductResponse(product)),
    };
  }

  async findNearby(lat: number, lng: number, radius: number = 10) {
    if (!lat || !lng) {
      throw new BadRequestException('Latitude and longitude are required');
    }
    const radiusInMeters = radius * 1609.34; // Convert miles to meters
    const products = await this.productModel
      .find({
        productStatus: ProductStatusEnum.PUBLISHED,
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
      data: products.map((product) => this.transformProductResponse(product)),
    };
  }

  async findByType(type: ProductType) {
    if (!type) {
      throw new BadRequestException('Product type is required');
    }
    const products = await this.productModel
      .find({
        productStatus: ProductStatusEnum.PUBLISHED,
        productType: type,
      })
      .select('-__v')
      .lean()
      .exec();
    return {
      data: products.map((product) => this.transformProductResponse(product)),
    };
  }

  async findByOwner(userId: string) {
    const vendors = await this.vendorService.findVendorsOwnedByUser(userId);
    if (!vendors.data.length) {
      return { data: [] };
    }
  
    const vendorIds = vendors.data.map(vendor => vendor._id);
    
    const products = await this.productModel
      .find({
        vendorId: { $in: vendorIds }
      })
      .select('-__v')
      .lean()
      .exec();
  
    return {
      data: products.map(product => this.transformProductResponse(product))
    };
  }

  async findByVendor(vendorId: string) {
    if (!vendorId) {
      throw new BadRequestException('Vendor ID is required');
    }
    const products = await this.productModel
      .find({
        vendorId: vendorId,
      })
      .select('-__v')
      .lean()
      .exec();
    return {
      data: products.map((product) => this.transformProductResponse(product)),
    };
  }

  async findById(id: string) {
    const product = await this.productModel
      .findById(id)
      .select('-__v')
      .lean()
      .exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return {
      data: this.transformProductResponse(product),
    };
  }

  async searchProducts(searchTerm: string) {
    const products = await this.productModel
      .find({
        productStatus: ProductStatusEnum.PUBLISHED,
        $text: { $search: searchTerm },
      })
      .select('-__v')
      .lean()
      .exec();
    return {
      data: products.map((product) => this.transformProductResponse(product)),
    };
  }

  async create(createProductDto: CreateProductDto) {
    try {
      const createdProduct = new this.productModel({
        ...createProductDto,
        productStatus: ProductStatusEnum.DRAFT,
      });
      
      const product = await createdProduct.save();
      
      // Update vendor types after creating product
      if (product.vendorId) {
        await this.updateVendorTypes(product.vendorId);
      }
      
      return {
        data: this.transformProductResponse(product),
        message: 'Product created successfully',
      };
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      const updatedProduct = await this.productModel
        .findByIdAndUpdate(
          id,
          { $set: updateProductDto },
          { new: true, runValidators: true }
        )
        .exec();
      
      if (!updatedProduct) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      
      // Update vendor types after updating product
      if (updatedProduct.vendorId) {
        await this.updateVendorTypes(updatedProduct.vendorId);
      }
      
      return {
        data: this.transformProductResponse(updatedProduct),
        message: 'Product updated successfully',
      };
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: ProductStatusEnum) {
    const product = await this.productModel.findById(id).exec();
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    product.productStatus = status;
    product.updatedAt = new Date();
    
    await product.save();
    
    // Update vendor types after status change
    if (product.vendorId) {
      await this.updateVendorTypes(product.vendorId);
    }
    
    return {
      data: this.transformProductResponse(product),
      message: 'Product status updated successfully',
    };
  }

  async remove(id: string) {
    const product = await this.productModel.findById(id);
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    const vendorId = product.vendorId;
    await this.productModel.findByIdAndDelete(id);
    
    // Update vendor types after deleting product
    if (vendorId) {
      await this.updateVendorTypes(vendorId);
    }
    
    return {
      message: 'Product deleted successfully',
    };
  }

  // Custom method to update vendor types
  private async updateVendorTypes(vendorId: string) {
    try {
      // Find all published products for this vendor
      const publishedProducts = await this.productModel.find({
        vendorId: vendorId,
        productStatus: ProductStatusEnum.PUBLISHED
      });
  
      // If no published products, we'll use the most recent products
      const productsToCheck = publishedProducts.length > 0 
        ? publishedProducts 
        : await this.productModel.find({ vendorId: vendorId });
  
      // Extract unique product types
      const vendorTypes: ProductType[] = Array.from(
        new Set(productsToCheck.map(product => product.productType))
      );
  
      // Call vendor service to update types
      await this.vendorService.updateVendorTypes(vendorId, vendorTypes);
    } catch (error) {
      console.error(`Error updating vendor types for vendor ${vendorId}:`, error);
    }
  }

  private transformProductResponse(product: Record<string, any>) {
    return {
      _id: product._id.toString(),
      productName: product.productName,
      productDescription: product.productDescription,
      productPrice: product.productPrice,
      productType: product.productType,
      location: {
        type: 'Point' as const,
        coordinates: [product.longitude, product.latitude] as [number, number],
      },
      vendorId: product.vendorId,
      productImageURL: product.productImageURL,
      productDuration: product.productDuration,
      productDate: product.productDate,
      productStartTime: product.productStartTime,
      productAdditionalInfo: product.productAdditionalInfo,
      productRequirements: product.productRequirements,
      productWaiver: product.productWaiver,
      productStatus: product.productStatus,
      createdAt: product.createdAt?.toISOString(),
      updatedAt: product.updatedAt?.toISOString(),
    };
  }
}