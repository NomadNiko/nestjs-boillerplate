import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProductItemSchemaClass,
  ProductItemSchemaDocument,
  ProductItemStatusEnum,
} from '../infrastructure/persistence/document/entities/product-item.schema';
import { ProductTemplateService } from '../../product-template/product-template.service';
import { ProductItemTransformService } from './product-item-transform.service';

@Injectable()
export class ProductItemManagementService {
  constructor(
    @InjectModel(ProductItemSchemaClass.name)
    private readonly itemModel: Model<ProductItemSchemaDocument>,
    private readonly templateService: ProductTemplateService,
    private readonly transformService: ProductItemTransformService,
  ) {}

  async createFromTemplate(templateId: string, createItemDto: any) {
    try {
      const template = await this.templateService.findById(templateId);
      if (!template) {
        throw new NotFoundException(`Template with ID ${templateId} not found`);
      }
  
      const longitude = Number(createItemDto.longitude || template.data.location?.coordinates[0]);
      const latitude = Number(createItemDto.latitude || template.data.location?.coordinates[1]);
      
      if (isNaN(longitude) || isNaN(latitude) || 
          longitude < -180 || longitude > 180 || 
          latitude < -90 || latitude > 90) {
        throw new BadRequestException('Invalid coordinates provided');
      }
  
      const itemData = {
        templateId,
        vendorId: template.data.vendorId,
        productDate: createItemDto.productDate,
        startTime: createItemDto.startTime,
        quantityAvailable: createItemDto.quantityAvailable,
        instructorName: createItemDto.instructorName,
        tourGuide: createItemDto.tourGuide,
        equipmentSize: createItemDto.equipmentSize,
        notes: createItemDto.notes,
        duration: createItemDto.duration || template.data.defaultDuration,
        price: createItemDto.price || template.data.basePrice,
        longitude,
        latitude,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude] // GeoJSON uses [longitude, latitude] order
        },
        templateName: template.data.templateName,
        description: template.data.description,
        productType: template.data.productType,
        requirements: [...template.data.requirements],
        waiver: template.data.waiver,
        imageURL: template.data.imageURL,
        additionalInfo: template.data.additionalInfo,
        itemStatus: ProductItemStatusEnum.PUBLISHED,
      };
  
      const createdItem = new this.itemModel(itemData);
      const item = await createdItem.save();
  
      return {
        data: this.transformService.transformItemResponse(item),
        message: 'Product item created successfully',
      };
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async update(id: string, updateItemDto: any) {
    try {
      let updateData = { ...updateItemDto };

      // If coordinates are being updated, update the location field as well
      if (updateItemDto.latitude !== undefined || updateItemDto.longitude !== undefined) {
        const existingItem = await this.itemModel.findById(id);
        if (!existingItem) {
          throw new NotFoundException(`Product item with ID ${id} not found`);
        }

        const longitude = Number(updateItemDto.longitude ?? existingItem.longitude);
        const latitude = Number(updateItemDto.latitude ?? existingItem.latitude);

        // Validate coordinates
        if (isNaN(longitude) || isNaN(latitude) || 
            longitude < -180 || longitude > 180 || 
            latitude < -90 || latitude > 90) {
          throw new BadRequestException('Invalid coordinates provided');
        }

        updateData = {
          ...updateData,
          location: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        };
      }

      const updatedItem = await this.itemModel
        .findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true },
        )
        .exec();

      if (!updatedItem) {
        throw new NotFoundException(`Product item with ID ${id} not found`);
      }

      return {
        data: this.transformService.transformItemResponse(updatedItem),
        message: 'Product item updated successfully',
      };
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: ProductItemStatusEnum) {
    const item = await this.itemModel.findById(id).exec();

    if (!item) {
      throw new NotFoundException(`Product item with ID ${id} not found`);
    }

    item.itemStatus = status;
    item.updatedAt = new Date();

    const updatedItem = await item.save();

    return {
      data: this.transformService.transformItemResponse(updatedItem),
      message: 'Product item status updated successfully',
    };
  }

  async remove(id: string) {
    const item = await this.itemModel.findById(id);

    if (!item) {
      throw new NotFoundException(`Product item with ID ${id} not found`);
    }

    await this.itemModel.findByIdAndDelete(id);

    return {
      message: 'Product item deleted successfully',
    };
  }
}