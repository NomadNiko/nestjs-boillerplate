import { Injectable, Logger } from '@nestjs/common';
import { ViatorProductService } from '../viator-product/viator-product.service';
import { ViatorAvailabilityService } from '../viator-availability/viator-availability.service';
import { ProductDisplayRequestDto } from './dto/viator-product-display.dto';

@Injectable()
export class ViatorProductDisplayService {
  private readonly logger = new Logger(ViatorProductDisplayService.name);

  constructor(
    private readonly productService: ViatorProductService,
    private readonly availabilityService: ViatorAvailabilityService,
  ) {}

  async getProductDisplay(
    request: ProductDisplayRequestDto,
  ): Promise<Record<string, unknown>> {
    try {
      this.logger.log(`Getting product display for: ${request.productCode}`);

      // Get product details
      const product = await this.productService.getProductDetails(
        request.productCode,
      );

      if (!product) {
        throw new Error(`Product not found: ${request.productCode}`);
      }

      // Check availability if dates are provided
      let availability: Record<string, unknown> | undefined = undefined;
      if (request.startDate) {
        availability = await this.availabilityService.checkAvailability({
          productCode: request.productCode,
          startDate: request.startDate,
          endDate: request.endDate,
          currency: request.currency,
        });
      }

      // Use the product URL from the product data
      const bookingUrl = product.productUrl as string;

      return {
        product,
        availability: availability || {},
        bookingUrl,
      };
    } catch (error) {
      this.logger.error(`Error getting product display: ${error.message}`);
      return {
        product: {},
        availability: {},
        bookingUrl: '',
      };
    }
  }
}
