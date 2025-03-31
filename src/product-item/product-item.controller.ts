import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  ParseFloatPipe,
} from '@nestjs/common';
import { ProductItemService } from './product-item.service';
import { ProductItemStatusEnum } from './infrastructure/persistence/document/entities/product-item.schema';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';

@ApiTags('Product Items')
@Controller('product-items')
export class ProductItemController {
  constructor(private readonly itemService: ProductItemService) {}

  @Get('by-template/:templateId')
  @ApiOperation({ summary: 'Get all items for a template' })
  @ApiResponse({
    status: 200,
    description: 'Returns all items for the specified template',
  })
  async findByTemplate(@Param('templateId') templateId: string) {
    return await this.itemService.findByTemplate(templateId);
  }

  @Get('by-vendor/:vendorId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get items by vendor' })
  async findByVendor(@Param('vendorId') vendorId: string) {
    return await this.itemService.findByVendor(vendorId);
  }

  @Get('available/:templateId')
  @ApiOperation({
    summary: 'Get available items for a template on a specific date',
  })
  @ApiQuery({ name: 'date', required: true, type: String })
  async findAvailableItems(
    @Param('templateId') templateId: string,
    @Query('date') dateString: string,
  ) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    return await this.itemService.findAvailableItems(templateId, date);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby items' })
  @ApiQuery({ name: 'lat', type: Number, required: true })
  @ApiQuery({ name: 'lng', type: Number, required: true })
  @ApiQuery({ name: 'radius', type: Number, required: false })
  async findNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', new ParseFloatPipe({ optional: true })) radius?: number,
  ) {
    return await this.itemService.findNearby(lat, lng, radius);
  }

  @Get('nearby-today')
  @ApiOperation({ summary: 'Find nearby items for today or specified date range' })
  @ApiQuery({ name: 'lat', type: Number, required: true })
  @ApiQuery({ name: 'lng', type: Number, required: true })
  @ApiQuery({ name: 'radius', type: Number, required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  async findNearbyToday(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', new ParseFloatPipe({ optional: true })) radius?: number,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string
  ) {
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;
    
    return await this.itemService.findNearbyToday(lat, lng, radius, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns a single product item',
  })
  async findById(@Param('id') id: string) {
    return await this.itemService.findById(id);
  }

  @Post('generate/:templateId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Generate new items from a template' })
  @ApiResponse({
    status: 201,
    description: 'The product items have been successfully generated.',
  })
  async createFromTemplate(
    @Param('templateId') templateId: string,
    @Body() createItemDto: any,
  ) {
    return await this.itemService.createFromTemplate(templateId, createItemDto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update a product item' })
  @ApiResponse({
    status: 200,
    description: 'The product item has been successfully updated.',
  })
  async update(@Param('id') id: string, @Body() updateItemDto: any) {
    return await this.itemService.update(id, updateItemDto);
  }

  @Get('by-vendor/:vendorId/public')
  @ApiOperation({ summary: 'Get published items by vendor - Public access' })
  async findPublicByVendor(@Param('vendorId') vendorId: string) {
    return await this.itemService.findPublicByVendor(vendorId);
  }

  @Put(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.vendor, RoleEnum.prevendor)
  @ApiOperation({ summary: 'Update item status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProductItemStatusEnum,
  ) {
    return await this.itemService.updateStatus(id, status);
  }

  @Put(':id/quantity')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.vendor, RoleEnum.prevendor)
  @ApiOperation({ summary: 'Update item quantity' })
  async updateQuantity(
    @Param('id') id: string,
    @Body('quantityChange') quantityChange: number,
  ) {
    return await this.itemService.updateQuantity(id, quantityChange);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete a product item' })
  @ApiResponse({
    status: 200,
    description: 'The product item has been successfully deleted.',
  })
  async remove(@Param('id') id: string) {
    return await this.itemService.remove(id);
  }
}