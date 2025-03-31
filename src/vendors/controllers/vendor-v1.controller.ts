import {
    Controller,
    Get,
    Query,
    DefaultValuePipe,
    ParseIntPipe,
    ParseFloatPipe,
    Param,
    UseGuards,
    UnauthorizedException,
    Request
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
  import { VendorService } from '../vendor.service';
  import { PaginatedVendorResponse, SortOrder, VendorSortField } from '../dto/vendor-pagination.dto';
  import { AuthGuard } from '@nestjs/passport';
  import { RolesGuard } from '../../roles/roles.guard';
  import { Roles } from '../../roles/roles.decorator';
  import { RoleEnum } from '../../roles/roles.enum';
  
  @ApiTags('Vendors V1')
  @Controller('v1/vendors')
  export class VendorV1Controller {
    constructor(private readonly vendorService: VendorService) {}
  
    @Get()
    @ApiOperation({ summary: 'Get paginated vendors with filtering and sorting' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'pageSize', required: false, type: Number })
    @ApiQuery({ name: 'sortField', required: false, enum: VendorSortField })
    @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'type', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'city', required: false })
    @ApiQuery({ name: 'state', required: false })
    @ApiQuery({ name: 'postalCode', required: false })
    async getPaginatedVendors(
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
      @Query('sortField', new DefaultValuePipe(VendorSortField.NAME)) sortField: VendorSortField,
      @Query('sortOrder', new DefaultValuePipe(SortOrder.ASC)) sortOrder: SortOrder,
      @Query('search') search?: string,
      @Query('type') type?: string,
      @Query('status') status?: string,
      @Query('city') city?: string,
      @Query('state') state?: string,
      @Query('postalCode') postalCode?: string,
    ): Promise<PaginatedVendorResponse> {
      return this.vendorService.findPaginated({
        page,
        pageSize,
        sortField,
        sortOrder,
        search,
        type,
        status,
        city,
        state,
        postalCode
      });
    }
  
    @Get('location/:lat/:lng')
    @ApiOperation({ summary: 'Get vendors sorted by distance from coordinates' })
    @ApiParam({ name: 'lat', type: Number })
    @ApiParam({ name: 'lng', type: Number })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'pageSize', required: false, type: Number })
    async getVendorsByLocation(
      @Param('lat', ParseFloatPipe) latitude: number,
      @Param('lng', ParseFloatPipe) longitude: number,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    ): Promise<PaginatedVendorResponse> {
      return this.vendorService.findNearLocation(latitude, longitude, page, pageSize);
    }
  
    @Get('postcode/:postcode')
    @ApiOperation({ summary: 'Get vendors by postal code' })
    @ApiParam({ name: 'postcode', type: String })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'pageSize', required: false, type: Number })
    async getVendorsByPostcode(
      @Param('postcode') postcode: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    ): Promise<PaginatedVendorResponse> {
      return this.vendorService.findByPostalCode(postcode, page, pageSize);
    }
  
    @Get('name/:name')
    @ApiOperation({ summary: 'Search vendors by business name' })
    @ApiParam({ name: 'name', type: String })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'pageSize', required: false, type: Number })
    async searchVendorsByName(
      @Param('name') name: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    ): Promise<PaginatedVendorResponse> {
      return this.vendorService.searchByName(name, page, pageSize);
    }
  
    @Get('all/:sortField/:sortOrder/:pageSize/:page')
    @ApiOperation({ summary: 'Get all vendors with clean URL pagination' })
    @ApiParam({ name: 'sortField', enum: VendorSortField })
    @ApiParam({ name: 'sortOrder', enum: SortOrder })
    @ApiParam({ name: 'pageSize', type: Number })
    @ApiParam({ name: 'page', type: Number })
    async getAllVendorsCleanUrl(
      @Param('sortField') sortField: VendorSortField,
      @Param('sortOrder') sortOrder: SortOrder,
      @Param('pageSize', ParseIntPipe) pageSize: number,
      @Param('page', ParseIntPipe) page: number,
    ): Promise<PaginatedVendorResponse> {
      return this.vendorService.findPaginated({
        page,
        pageSize,
        sortField,
        sortOrder
      });
    }
  
    @Get('all/location/:postalCode/:pageSize/:page')
    @ApiOperation({ summary: 'Get vendors sorted by distance from postal code' })
    @ApiParam({ name: 'postalCode', type: String })
    @ApiParam({ name: 'pageSize', type: Number })
    @ApiParam({ name: 'page', type: Number })
    async getVendorsByLocationCleanUrl(
      @Param('postalCode') postalCode: string,
      @Param('pageSize', ParseIntPipe) pageSize: number,
      @Param('page', ParseIntPipe) page: number,
    ): Promise<PaginatedVendorResponse> {
      return this.vendorService.findPaginated({
        page,
        pageSize,
        sortField: VendorSortField.NAME,
        sortOrder: SortOrder.ASC,
        postalCode
      });
    }
  
    @Get('admin/user/:userId/vendors')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(RoleEnum.admin)
    async findAllVendorsForUser(@Param('userId') userId: string) {
      return this.vendorService.findAllVendorsForUser(userId);
    }
  
    @Get('user/:userId/owned')
    @UseGuards(AuthGuard('jwt'))
    async findVendorsOwnedByUser(
      @Param('userId') userId: string,
      @Request() req,
    ) {
      if (req.user.id !== userId) {
        throw new UnauthorizedException("Cannot access other users' vendor data");
      }
      return this.vendorService.findVendorsOwnedByUser(userId);
    }
  }