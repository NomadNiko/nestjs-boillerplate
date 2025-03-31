// src/viator-destination/viator-destination.controller.ts
import { Controller, Get, Param, Post, Logger, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ViatorDestinationService } from './viator-destination.service';
import { ViatorDestinationDto } from './dto/viator-destination.dto';
import { DestinationSearchResultDto } from './dto/destination-search.dto';

@ApiTags('Viator Destinations')
@Controller('viator-destinations')
export class ViatorDestinationController {
  private readonly logger = new Logger(ViatorDestinationController.name);

  constructor(private readonly destinationService: ViatorDestinationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all destinations' })
  @ApiResponse({
    status: 200,
    description: 'Returns all destinations',
    type: [ViatorDestinationDto],
  })
  async findAll(): Promise<{ data: ViatorDestinationDto[] }> {
    const destinations = await this.destinationService.findAll();
    return { data: destinations };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get destination by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Destination ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the destination',
    type: ViatorDestinationDto,
  })
  async findOne(
    @Param('id') id: number,
  ): Promise<{ data: ViatorDestinationDto }> {
    const destination = await this.destinationService.findById(id);
    return { data: destination };
  }

  @Get('parent/:parentId')
  @ApiOperation({ summary: 'Get destinations by parent ID' })
  @ApiParam({
    name: 'parentId',
    type: Number,
    description: 'Parent Destination ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns destinations with the specified parent',
    type: [ViatorDestinationDto],
  })
  async findByParent(
    @Param('parentId') parentId: number,
  ): Promise<{ data: ViatorDestinationDto[] }> {
    const destinations = await this.destinationService.findByParentId(parentId);
    return { data: destinations };
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed destinations from Viator API' })
  @ApiResponse({ status: 200, description: 'Destinations seeded successfully' })
  async seed(): Promise<{ message: string }> {
    this.logger.log('Starting destination seeding process');
    await this.destinationService.fetchAllDestinations();
    return { message: 'Destinations seeded successfully' };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search destinations by name' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns destinations matching the search query',
    type: [DestinationSearchResultDto],
  })
  async searchDestinations(
    @Query('query') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{ data: DestinationSearchResultDto[] }> {
    const results = await this.destinationService.searchDestinations(query, limit);
    return { data: results };
  }
  
  @Get('popular')
  @ApiOperation({ summary: 'Get popular destinations' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns popular destinations',
    type: [DestinationSearchResultDto],
  })
  async getPopularDestinations(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{ data: DestinationSearchResultDto[] }> {
    const results = await this.destinationService.getPopularDestinations(limit);
    return { data: results };
  }

}
