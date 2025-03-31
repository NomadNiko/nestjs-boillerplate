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
import { ProductTemplateService } from './product-template.service';
import { ProductType, ProductTemplateStatusEnum } from './infrastructure/persistence/document/entities/product-template.schema';
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

@ApiTags('Product Templates')
@Controller('product-templates')
export class ProductTemplateController {
  constructor(private readonly templateService: ProductTemplateService) {}

  @Get()
  @ApiOperation({ summary: 'Get all published templates' })
  @ApiResponse({
    status: 200,
    description: 'Returns all published templates',
  })
  async findAllPublished() {
    return this.templateService.findPublishedTemplates();
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiOperation({ summary: 'Get all templates (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Returns all templates (including drafts and archived)',
  })
  async findAllTemplates() {
    return this.templateService.findAllTemplates();
  }

  @Get('by-vendor/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get templates by vendor' })
  async findByVendor(@Param('id') id: string) {
    return this.templateService.findByVendor(id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search templates' })
  @ApiQuery({ name: 'term', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Returns templates matching search term',
  })
  async searchTemplates(@Query('term') searchTerm: string) {
    return this.templateService.searchTemplates(searchTerm);
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Find templates by type' })
  @ApiQuery({
    name: 'type',
    enum: ['tours', 'lessons', 'rentals', 'tickets'],
    required: true,
  })
  async findByType(@Query('type') type: string) {
    const validTypes: ProductType[] = ['tours', 'lessons', 'rentals', 'tickets'];
    
    if (!validTypes.includes(type as ProductType)) {
      throw new BadRequestException(
        `Invalid product type. Must be one of: ${validTypes.join(', ')}`,
      );
    }
    
    return this.templateService.findByType(type as ProductType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns a single template',
  })
  async findById(@Param('id') id: string) {
    return this.templateService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a new template' })
  @ApiResponse({
    status: 201,
    description: 'The template has been successfully created.',
  })
  async create(@Body() createTemplateDto: any) {
    return this.templateService.create(createTemplateDto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update a template' })
  @ApiResponse({
    status: 200,
    description: 'The template has been successfully updated.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: any,
  ) {
    return this.templateService.update(id, updateTemplateDto);
  }

  @Put(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.vendor, RoleEnum.prevendor)
  @ApiOperation({ summary: 'Update template status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProductTemplateStatusEnum,
  ) {
    return this.templateService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete a template' })
  @ApiResponse({
    status: 200,
    description: 'The template has been successfully deleted.',
  })
  async remove(@Param('id') id: string) {
    return this.templateService.remove(id);
  }
}