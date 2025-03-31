import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { VendorCrudService } from './services/vendor-crud.service';
import { VendorSearchService } from './services/vendor-search.service';
import { VendorStripeService } from './services/vendor-stripe.service';
import { VendorOwnerService } from './services/vendor-owner.service';
import { VendorProductService } from './services/vendor-product.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorPaginationParams } from './types/pagination-params.type';
import { VendorType } from './infrastructure/persistence/document/entities/vendor.schema';

@Injectable()
export class VendorService {
  constructor(
    private readonly vendorCrudService: VendorCrudService,
    private readonly vendorSearchService: VendorSearchService,
    private readonly vendorStripeService: VendorStripeService,
    private readonly vendorOwnerService: VendorOwnerService,
    private readonly vendorProductService: VendorProductService,
  ) {}


  // CRUD Operations
  async findAllVendors() {
    return this.vendorCrudService.findAll();
  }

  async findAllApproved() {
    return this.vendorCrudService.findAllApproved();
  }

  async create(createVendorDto: CreateVendorDto, userId: string) {
    return this.vendorCrudService.create(createVendorDto, userId);
  }

  async update(id: string, updateVendorDto: UpdateVendorDto) {
    return this.vendorCrudService.update(id, updateVendorDto);
  }

  async remove(id: string) {
    return this.vendorCrudService.remove(id);
  }

  // Search Operations
  async findPaginated(params: VendorPaginationParams) {
    return this.vendorSearchService.findPaginated(params);
  }

  async findNearby(lat: number, lng: number, radius?: number) {
    return this.vendorSearchService.findNearby(lat, lng, radius);
  }

  async findByType(type: VendorType) {
    return this.vendorSearchService.findByType(type);
  }

  async findByPostalCode(postalCode: string, page?: number, pageSize?: number) {
    return this.vendorSearchService.findByPostalCode(postalCode, page, pageSize);
  }

  async searchByName(name: string, page?: number, pageSize?: number) {
    return this.vendorSearchService.searchByName(name, page, pageSize);
  }

  async findNearLocation(
    latitude: number, 
    longitude: number, 
    page: number = 1, 
    pageSize: number = 10
  ) {
    return this.vendorSearchService.findNearLocation(latitude, longitude, page, pageSize);
  }

  // Stripe Operations
  async updateStripeConnectId(vendorId: string, stripeConnectId: string) {
    return this.vendorStripeService.updateStripeConnectId(vendorId, stripeConnectId);
  }

  async updateStripeStatus(id: string, stripeData: any) {
    return this.vendorStripeService.updateStripeStatus(id, stripeData);
  }

  async getStripeStatus(id: string) {
    return this.vendorStripeService.getStripeStatus(id);
  }

  async triggerPayout(vendorId: string) {
    return this.vendorStripeService.triggerPayout(vendorId);
  }

  // Owner Operations
  async findVendorsOwnedByUser(userId: string) {
    return this.vendorOwnerService.findVendorsOwnedByUser(userId);
  }

  async findAllVendorsForUser(userId: string) {
    return this.vendorOwnerService.findAllVendorsForUser(userId);
  }

  async getVendorOwners(id: string) {
    return this.vendorOwnerService.getVendorOwners(id);
  }

  async approveVendor(vendorId: string, userId: string) {
    return this.vendorOwnerService.approveVendor(vendorId, userId);
  }

  async isUserAssociatedWithVendor(userId: string, vendorId: string) {
    return this.vendorOwnerService.isUserAssociatedWithVendor(userId, vendorId);
  }

  async removeUserFromVendors(userId: string) {
    return this.vendorOwnerService.removeUserFromVendors(userId);
  }

  // Product Operations
  async updateVendorTypes(vendorId: string, vendorTypes?: VendorType[]) {
    return this.vendorProductService.updateVendorTypes(vendorId, vendorTypes);
  }

  async syncVendorTypesWithProducts(vendorId: string) {
    return this.vendorProductService.syncVendorTypesWithProducts(vendorId);
  }

  async getProductCounts(vendorId: string) {
    return this.vendorProductService.getProductCounts(vendorId);
  }

  async validateProductType(vendorId: string, productType: VendorType) {
    return this.vendorProductService.validateProductType(vendorId, productType);
  }

  async getVendorProductStats(vendorId: string) {
    return this.vendorProductService.getVendorProductStats(vendorId);
  }

  findById = this.vendorCrudService.findById.bind(this.vendorCrudService); 
  
  async updateVendorBalance(vendorId: string, amountChange: number): Promise<void> {
    try {
      // Use the crud service to update the vendor
      await this.vendorCrudService.update(vendorId, {
        $inc: { internalAccountBalance: amountChange }
      });
      
      console.log(`Adjusted vendor ${vendorId} balance by ${amountChange}`);
    } catch (error) {
      console.error(`Error adjusting vendor balance: ${error.message}`);
      throw error;
    }
  }
}