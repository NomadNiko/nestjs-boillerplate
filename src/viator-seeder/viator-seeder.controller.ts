// src/viator-seeder/viator-seeder.controller.ts
import { Controller, Post, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ViatorSeederService } from './viator-seeder.service';

@ApiTags('Viator Seeder')
@Controller('viator-seeder')
export class ViatorSeederController {
  private readonly logger = new Logger(ViatorSeederController.name);

  constructor(private readonly seederService: ViatorSeederService) {}

  @Post('seed-all')
  @ApiOperation({
    summary: 'Seed all Viator data (destinations, tags, exchange rates)',
  })
  @ApiResponse({ status: 200, description: 'All data seeded successfully' })
  async seedAll(): Promise<{ message: string; details: any }> {
    this.logger.log('Starting full Viator data seeding process');
    const result = await this.seederService.seedAll();
    return {
      message: 'All Viator data seeded successfully',
      details: result,
    };
  }
}
