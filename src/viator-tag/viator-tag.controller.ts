import { Controller, Get, Param, Post, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ViatorTagService } from './viator-tag.service';
import { ViatorTagDto } from './dto/viator-tag.dto';

@ApiTags('Viator Tags')
@Controller('viator-tags')
export class ViatorTagController {
  private readonly logger = new Logger(ViatorTagController.name);

  constructor(private readonly tagService: ViatorTagService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({
    status: 200,
    description: 'Returns all tags',
    type: [ViatorTagDto],
  })
  async findAll(): Promise<{ data: ViatorTagDto[] }> {
    const tags = await this.tagService.findAll();
    return { data: tags };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tag by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Tag ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the tag',
    type: ViatorTagDto,
  })
  async findOne(@Param('id') id: number): Promise<{ data: ViatorTagDto }> {
    const tag = await this.tagService.findById(id);
    return { data: tag };
  }

  @Get('parent/:parentId')
  @ApiOperation({ summary: 'Get tags by parent ID' })
  @ApiParam({ name: 'parentId', type: Number, description: 'Parent Tag ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns tags with the specified parent',
    type: [ViatorTagDto],
  })
  async findByParent(
    @Param('parentId') parentId: number,
  ): Promise<{ data: ViatorTagDto[] }> {
    const tags = await this.tagService.findByParentId(parentId);
    return { data: tags };
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed tags from Viator API' })
  @ApiResponse({ status: 200, description: 'Tags seeded successfully' })
  async seed(): Promise<{ message: string }> {
    this.logger.log('Starting tag seeding process');
    await this.tagService.fetchAllTags();
    return { message: 'Tags seeded successfully' };
  }
}
