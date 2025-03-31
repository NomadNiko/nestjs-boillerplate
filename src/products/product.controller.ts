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
import { ProductService } from './product.service';
import { ProductType } from './infrastructure/persistence/document/entities/product.schema';
import {
  ApiQuery,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { ProductStatusEnum } from './infrastructure/persistence/document/entities/product.schema';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get all published products' })
  @ApiResponse({
    status: 200,
    description: 'Returns all published products',
  })
  async findAllPublished() {
    return this.productService.findAllPublished();
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiOperation({ summary: 'Get all products (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Returns all products (including drafts and archived)',
  })
  async findAllProducts() {
    return this.productService.findAllProducts();
  }

  @Get('by-owner/:id')
@UseGuards(AuthGuard('jwt'))
async findByOwner(@Param('id') id: string) {
  return this.productService.findByOwner(id);
}

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiQuery({ name: 'term', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Returns products matching search term',
  })
  async searchProducts(@Query('term') searchTerm: string) {
    return this.productService.searchProducts(searchTerm);
  }

  @Get('price-range')
  @ApiOperation({ summary: 'Find products by price range' })
  @ApiQuery({ name: 'min', required: true, type: Number })
  @ApiQuery({ name: 'max', required: true, type: Number })
  async findByPriceRange(
    @Query('min', ParseFloatPipe) minPrice: number,
    @Query('max', ParseFloatPipe) maxPrice: number,
  ) {
    if (minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) {
      throw new BadRequestException('Invalid price range');
    }
    return this.productService.findByPriceRange(minPrice, maxPrice);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby products' })
  @ApiQuery({ name: 'lat', type: Number, required: true })
  @ApiQuery({ name: 'lng', type: Number, required: true })
  @ApiQuery({ name: 'radius', type: Number, required: false })
  async findNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', new ParseFloatPipe({ optional: true })) radius?: number,
  ) {
    return this.productService.findNearby(lat, lng, radius);
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Find products by type' })
  @ApiQuery({
    name: 'type',
    enum: ['tours', 'lessons', 'rentals', 'tickets'],
    required: true,
  })
  async findByType(@Query('type') type: string) {
    const validTypes: ProductType[] = [
      'tours',
      'lessons',
      'rentals',
      'tickets',
    ];
    if (!validTypes.includes(type as ProductType)) {
      throw new BadRequestException(
        `Invalid product type. Must be one of: ${validTypes.join(', ')}`,
      );
    }
    return this.productService.findByType(type as ProductType);
  }

  @Get('by-vendor/:vendorId')
  @ApiOperation({ summary: 'Find products by vendor' })
  @ApiResponse({
    status: 200,
    description: 'Returns all products for a specific vendor',
  })
  async findByVendor(@Param('vendorId') vendorId: string) {
    return this.productService.findByVendor(vendorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns a single product',
  })
  async findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'The product has been successfully created.',
  })
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully updated.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Put(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiOperation({ summary: 'Update product status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProductStatusEnum,
  ) {
    return this.productService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully deleted.',
  })
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
