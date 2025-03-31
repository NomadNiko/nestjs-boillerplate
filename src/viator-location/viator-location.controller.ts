// src/viator-location/viator-location.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ViatorLocationService } from './viator-location.service';
import { ViatorLocationDto } from './dto/viator-location.dto';

@ApiTags('Viator Locations')
@Controller('viator-locations')
export class ViatorLocationController {
  private readonly logger = new Logger(ViatorLocationController.name);

  constructor(private readonly locationService: ViatorLocationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all locations' })
  @ApiResponse({
    status: 200,
    description: 'Returns all locations',
    type: [ViatorLocationDto],
  })
  async findAll(): Promise<{ data: ViatorLocationDto[] }> {
    const locations = await this.locationService.findAll();
    return { data: locations };
  }

  @Get(':reference')
  @ApiOperation({ summary: 'Get location by reference' })
  @ApiParam({ name: 'reference', description: 'Location reference code' })
  @ApiResponse({
    status: 200,
    description: 'Returns the location',
    type: ViatorLocationDto,
  })
  async findOne(
    @Param('reference') reference: string,
  ): Promise<{ data: ViatorLocationDto }> {
    const location = await this.locationService.findOrFetchByReference(
      reference,
    );
    return { data: location };
  }

  @Get('nearby/:lat/:lng/:radius')
  @ApiOperation({ summary: 'Find locations near a geographic point' })
  @ApiParam({ name: 'lat', description: 'Latitude' })
  @ApiParam({ name: 'lng', description: 'Longitude' })
  @ApiParam({ name: 'radius', description: 'Radius in kilometers' })
  @ApiResponse({
    status: 200,
    description: 'Returns nearby locations',
    type: [ViatorLocationDto],
  })
  async findNearby(
    @Param('lat') lat: number,
    @Param('lng') lng: number,
    @Param('radius') radius: number,
  ): Promise<{ data: ViatorLocationDto[] }> {
    const locations = await this.locationService.findNearby(
      Number(lat),
      Number(lng),
      Number(radius),
    );
    return { data: locations };
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Fetch locations by references' })
  @ApiBody({
    description: 'Array of location references',
    type: [String],
  })
  @ApiResponse({ status: 200, description: 'Locations fetched successfully' })
  async fetchLocationsByReferences(
    @Body() references: string[],
  ): Promise<{ message: string }> {
    this.logger.log(`Fetching ${references.length} locations`);
    await this.locationService.fetchLocationsByReferences(references);
    return { message: 'Locations fetched successfully' };
  }
}
