import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Param,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ViatorProductService } from './viator-product.service';
import {
  ProductSearchRequestDto,
  ProductSearchResponseDto,
} from './dto/viator-product.dto';

@ApiTags('Viator Products')
@Controller('viator-products')
export class ViatorProductController {
  private readonly logger = new Logger(ViatorProductController.name);

  constructor(private readonly productService: ViatorProductService) {}

  @Post('search')
  @ApiOperation({ summary: 'Search for products with filtering' })
  @ApiBody({ type: ProductSearchRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Returns filtered products',
    type: ProductSearchResponseDto,
  })
  async searchProducts(
    @Body() searchRequest: ProductSearchRequestDto,
    @Req() req: Request, // Import Request from express
  ): Promise<ProductSearchResponseDto> {
    // Log raw request body
    console.log('Raw request body:', req.body);

    // Log parsed search request
    console.log(
      'Parsed search request:',
      JSON.stringify(searchRequest, null, 2),
    );

    // Add explicit type checking
    if (!searchRequest) {
      throw new Error('Search request is undefined or null');
    }

    if (typeof searchRequest.destination !== 'string') {
      console.error('Destination is not a string:', searchRequest.destination);
      throw new Error('Destination must be a string');
    }

    return this.productService.searchProducts(searchRequest);
  }

  @Get(':productCode')
  @ApiOperation({ summary: 'Get product details by product code' })
  @ApiParam({ name: 'productCode', description: 'Product code' })
  @ApiResponse({
    status: 200,
    description: 'Returns the product details',
  })
  async getProductDetails(
    @Param('productCode') productCode: string,
  ): Promise<{ data: Record<string, unknown> }> {
    const product = await this.productService.getProductDetails(productCode);
    return { data: product || {} };
  }
}
