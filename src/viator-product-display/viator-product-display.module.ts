import { Module } from '@nestjs/common';
import { ViatorProductModule } from '../viator-product/viator-product.module';
import { ViatorAvailabilityModule } from '../viator-availability/viator-availability.module';
import { ViatorProductDisplayController } from './viator-product-display.controller';
import { ViatorProductDisplayService } from './viator-product-display.service';

@Module({
  imports: [ViatorProductModule, ViatorAvailabilityModule],
  controllers: [ViatorProductDisplayController],
  providers: [ViatorProductDisplayService],
  exports: [ViatorProductDisplayService],
})
export class ViatorProductDisplayModule {}
