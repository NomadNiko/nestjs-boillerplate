import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ViatorAvailabilityService } from './viator-availability.service';
import {
  AvailabilityCheckRequestDto,
  AvailabilityResponseDto,
} from './dto/viator-availability.dto';

@ApiTags('Viator Availability')
@Controller('viator-availability')
export class ViatorAvailabilityController {
  private readonly logger = new Logger(ViatorAvailabilityController.name);

  constructor(
    private readonly availabilityService: ViatorAvailabilityService,
  ) {}

  @Post('check')
  @ApiOperation({ summary: 'Check product availability for dates' })
  @ApiBody({ type: AvailabilityCheckRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Returns availability for the requested dates',
    type: AvailabilityResponseDto,
  })
  async checkAvailability(
    @Body() request: AvailabilityCheckRequestDto,
  ): Promise<{ data: Record<string, unknown> }> {
    const availability = await this.availabilityService.checkAvailability(
      request,
    );
    return { data: availability };
  }
}
