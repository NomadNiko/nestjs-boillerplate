import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProductTemplateSchemaClass,
  ProductTemplateSchemaDocument,
  ProductTemplateStatusEnum,
  ProductType
} from './infrastructure/persistence/document/entities/product-template.schema';

@Injectable()
export class ProductTemplateService {
  constructor(
    @InjectModel(ProductTemplateSchemaClass.name)
    private readonly templateModel: Model<ProductTemplateSchemaDocument>
  ) {}

  async findAllTemplates() {
    const templates = await this.templateModel
      .find()
      .select('-__v')
      .lean()
      .exec();

    return {
      data: templates.map(template => this.transformTemplateResponse(template)),
    };
  }

  async findPublishedTemplates() {
    const templates = await this.templateModel
      .find({
        templateStatus: ProductTemplateStatusEnum.PUBLISHED,
      })
      .select('-__v')
      .lean()
      .exec();

    return {
      data: templates.map(template => this.transformTemplateResponse(template)),
    };
  }

  async findByVendor(vendorId: string) {
    const templates = await this.templateModel
      .find({
        vendorId: vendorId,
      })
      .select('-__v')
      .lean()
      .exec();

    return {
      data: templates.map(template => this.transformTemplateResponse(template)),
    };
  }

  async findById(id: string) {
    const template = await this.templateModel
      .findById(id)
      .select('-__v')
      .lean()
      .exec();

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return {
      data: this.transformTemplateResponse(template),
    };
  }

  async findByType(type: ProductType) {
    const templates = await this.templateModel
      .find({
        productType: type,
        templateStatus: ProductTemplateStatusEnum.PUBLISHED,
      })
      .select('-__v')
      .lean()
      .exec();

    return {
      data: templates.map(template => this.transformTemplateResponse(template)),
    };
  }

  async create(createTemplateDto: any) {
    try {
      const createdTemplate = new this.templateModel({
        ...createTemplateDto,
        templateStatus: ProductTemplateStatusEnum.DRAFT,
      });
      
      const template = await createdTemplate.save();
      
      return {
        data: this.transformTemplateResponse(template),
        message: 'Template created successfully',
      };
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async update(id: string, updateTemplateDto: any) {
    try {
      const updatedTemplate = await this.templateModel
        .findByIdAndUpdate(
          id,
          { $set: updateTemplateDto },
          { new: true, runValidators: true }
        )
        .exec();
      
      if (!updatedTemplate) {
        throw new NotFoundException(`Template with ID ${id} not found`);
      }
      
      return {
        data: this.transformTemplateResponse(updatedTemplate),
        message: 'Template updated successfully',
      };
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: ProductTemplateStatusEnum) {
    const template = await this.templateModel.findById(id).exec();
    
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    
    template.templateStatus = status;
    template.updatedAt = new Date();
    
    await template.save();
    
    return {
      data: this.transformTemplateResponse(template),
      message: 'Template status updated successfully',
    };
  }

  async remove(id: string) {
    const template = await this.templateModel.findById(id);
    
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    
    await this.templateModel.findByIdAndDelete(id);
    
    return {
      message: 'Template deleted successfully',
    };
  }

  async searchTemplates(searchTerm: string) {
    const templates = await this.templateModel
      .find({
        templateStatus: ProductTemplateStatusEnum.PUBLISHED,
        $text: { $search: searchTerm },
      })
      .select('-__v')
      .lean()
      .exec();
      
    return {
      data: templates.map(template => this.transformTemplateResponse(template)),
    };
  }

  private transformTemplateResponse(template: Record<string, any>) {
    return {
      _id: template._id.toString(),
      templateName: template.templateName,
      description: template.description,
      basePrice: template.basePrice,
      productType: template.productType,
      vendorId: template.vendorId,
      requirements: template.requirements,
      waiver: template.waiver,
      templateStatus: template.templateStatus,
      imageURL: template.imageURL,
      additionalInfo: template.additionalInfo,
      location: template.defaultLongitude && template.defaultLatitude ? {
        type: 'Point' as const,
        coordinates: [template.defaultLongitude, template.defaultLatitude] as [number, number],
      } : undefined,
      defaultDuration: template.defaultDuration,
      createdAt: template.createdAt?.toISOString(),
      updatedAt: template.updatedAt?.toISOString(),
    };
  }
}