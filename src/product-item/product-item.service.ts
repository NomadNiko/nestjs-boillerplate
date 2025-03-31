import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProductItemSchemaClass,
  ProductItemSchemaDocument,
  ProductItemStatusEnum,
} from './infrastructure/persistence/document/entities/product-item.schema';
import { ProductTemplateService } from '../product-template/product-template.service';
import { ProductItemQueryService } from './services/product-item-query.service';
import { ProductItemAvailabilityService } from './services/product-item-availability.service';
import { ProductItemQuantityService } from './services/product-item-quantity.service';
import { ProductItemManagementService } from './services/product-item-management.service';
import { ProductItemTransformService } from './services/product-item-transform.service';

@Injectable()
export class ProductItemService {
  constructor(
    @InjectModel(ProductItemSchemaClass.name)
    private readonly itemModel: Model<ProductItemSchemaDocument>,
    private readonly templateService: ProductTemplateService,
    private readonly queryService: ProductItemQueryService,
    private readonly availabilityService: ProductItemAvailabilityService,
    private readonly quantityService: ProductItemQuantityService,
    private readonly managementService: ProductItemManagementService,
    private readonly transformService: ProductItemTransformService,
  ) {}

  // Query Methods
  findAllItems = this.queryService.findAllItems.bind(this.queryService);
  findByTemplate = this.queryService.findByTemplate.bind(this.queryService);
  findByVendor = this.queryService.findByVendor.bind(this.queryService);
  findById = this.queryService.findById.bind(this.queryService);
  findAvailableItems = this.queryService.findAvailableItems.bind(
    this.queryService,
  );
  findPublicByVendor = this.queryService.findPublicByVendor.bind(
    this.queryService,
  );
  findNearby = this.queryService.findNearby.bind(this.queryService);
  findNearbyToday = this.queryService.findNearbyToday.bind(this.queryService);

  // Availability Methods
  validateAvailability = this.availabilityService.validateAvailability.bind(
    this.availabilityService,
  );
  validateAndReserveQuantity =
    this.availabilityService.validateAndReserveQuantity.bind(
      this.availabilityService,
    );
  checkAvailabilityForDate =
    this.availabilityService.checkAvailabilityForDate.bind(
      this.availabilityService,
    );
  checkAvailabilityForDateRange =
    this.availabilityService.checkAvailabilityForDateRange.bind(
      this.availabilityService,
    );
  checkBulkAvailability = this.availabilityService.checkBulkAvailability.bind(
    this.availabilityService,
  );
  getAvailabilityCalendar =
    this.availabilityService.getAvailabilityCalendar.bind(
      this.availabilityService,
    );

  // Quantity Methods
  updateQuantityForPurchase =
    this.quantityService.updateQuantityForPurchase.bind(this.quantityService);
  updateQuantity = this.quantityService.updateQuantity.bind(
    this.quantityService,
  );

  // Management Methods
  createFromTemplate = this.managementService.createFromTemplate.bind(
    this.managementService,
  );
  update = this.managementService.update.bind(this.managementService);
  updateStatus = this.managementService.updateStatus.bind(
    this.managementService,
  );
  remove = this.managementService.remove.bind(this.managementService);
}
