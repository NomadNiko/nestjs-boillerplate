import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ViatorProductDisplayService } from './viator-product-display.service';
import {
  ProductDisplayRequestDto,
  ProductDisplayResponseDto,
} from './dto/viator-product-display.dto';

@ApiTags('Viator Product Display')
@Controller('viator-product-display')
export class ViatorProductDisplayController {
  private readonly logger = new Logger(ViatorProductDisplayController.name);

  constructor(
    private readonly productDisplayService: ViatorProductDisplayService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get complete product display data with availability',
  })
  @ApiQuery({ name: 'productCode', required: true, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'currency', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Returns product details with availability',
    type: ProductDisplayResponseDto,
  })
  async getProductDisplay(
    @Query('productCode') productCode: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('currency') currency?: string,
  ): Promise<{ data: Record<string, unknown> }> {
    const request: ProductDisplayRequestDto = {
      productCode,
      startDate,
      endDate,
      currency,
    };

    const productDisplay = await this.productDisplayService.getProductDisplay(
      request,
    );
    return { data: productDisplay };
  }
}
