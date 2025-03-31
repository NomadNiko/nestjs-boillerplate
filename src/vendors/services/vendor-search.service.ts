import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  VendorSchemaClass,
  VendorSchemaDocument,
  VendorType,
} from '../infrastructure/persistence/document/entities/vendor.schema';
import { VendorPaginationParams } from '../types/pagination-params.type';
import { PaginatedVendorResponse, SortOrder, VendorSortField } from '../dto/vendor-pagination.dto';
import { calculateDistance } from '../../utils/location.utils';
import { transformVendorResponse } from '../../utils/vendor.transform';

@Injectable()
export class VendorSearchService {
  constructor(
    @InjectModel(VendorSchemaClass.name)
    private readonly vendorModel: Model<VendorSchemaDocument>,
  ) {}

  async findPaginated(
    params: VendorPaginationParams,
  ): Promise<PaginatedVendorResponse> {
    try {
      const query = this.buildPaginationQuery(params);
      const sortOptions = this.buildSortOptions(params);

      const totalDocs = await this.vendorModel.countDocuments(query);
      const totalPages = Math.ceil(totalDocs / params.pageSize);

      let vendors = await this.vendorModel
        .find(query)
        .sort(sortOptions)
        .skip((params.page - 1) * params.pageSize)
        .limit(params.pageSize)
        .lean()
        .exec();

      if (params.latitude && params.longitude) {
        vendors = this.sortByDistance(vendors, params);
      }

      return {
        data: vendors.map((vendor) => transformVendorResponse(vendor)),
        total: totalDocs,
        page: params.page,
        pageSize: params.pageSize,
        totalPages,
        hasNextPage: params.page < totalPages,
        hasPreviousPage: params.page > 1,
      };
    } catch (error) {
      console.error('Error in findPaginated:', error);
      throw new InternalServerErrorException('Failed to fetch paginated vendors');
    }
  }

  async findNearby(lat: number, lng: number, radius: number = 10) {
    const radiusInMeters = radius * 1609.34; // Convert miles to meters

    const vendors = await this.vendorModel
      .find({
        vendorStatus: 'APPROVED',
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
      data: vendors.map((vendor) => transformVendorResponse(vendor)),
    };
  }

  async findByType(type: VendorType) {
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
  }

  async findByPostalCode(
    postalCode: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedVendorResponse> {
    return this.findPaginated({
      page,
      pageSize,
      sortField: VendorSortField.NAME,
      sortOrder: SortOrder.ASC,
      postalCode,
    });
  }

  async findNearLocation(
    latitude: number,
    longitude: number,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedVendorResponse> {
    try {
      // Use findPaginated with location parameters
      return this.findPaginated({
        page,
        pageSize,
        sortField: VendorSortField.NAME,
        sortOrder: SortOrder.ASC,
        latitude,
        longitude
      });
    } catch (error) {
      console.error('Error finding vendors by location:', error);
      throw new InternalServerErrorException('Failed to fetch vendors by location');
    }
  }

  async searchByName(
    name: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedVendorResponse> {
    return this.findPaginated({
      page,
      pageSize,
      sortField: VendorSortField.NAME,
      sortOrder: SortOrder.ASC,
      search: name,
    });
  }

   buildPaginationQuery(params: VendorPaginationParams): any {
    const query: any = {};

    if (params.status) {
      query.vendorStatus = params.status;
    }

    if (params.type) {
      query.vendorTypes = params.type;
    }

    if (params.city) {
      query.city = new RegExp(params.city, 'i');
    }

    if (params.state) {
      query.state = new RegExp(params.state, 'i');
    }

    if (params.postalCode) {
      query.postalCode = new RegExp(params.postalCode, 'i');
    }

    if (params.search) {
      query.$or = [
        { businessName: new RegExp(params.search, 'i') },
        { description: new RegExp(params.search, 'i') },
      ];
    }

    return query;
  }

   buildSortOptions(params: VendorPaginationParams): any {
    if (params.latitude && params.longitude) {
      return {};
    }

    const sortOrder = params.sortOrder === SortOrder.DESC ? -1 : 1;
    return { [params.sortField]: sortOrder };
  }

   sortByDistance(
    vendors: any[],
    params: VendorPaginationParams,
  ): any[] {
    if (!params.latitude || !params.longitude) {
      return vendors;
    }

    return vendors.sort((a, b) => {
      const distA = calculateDistance(
        params.latitude!,
        params.longitude!,
        a.latitude,
        a.longitude,
      );
      const distB = calculateDistance(
        params.latitude!,
        params.longitude!,
        b.latitude,
        b.longitude,
      );
      return distA - distB;
    });
  }
}