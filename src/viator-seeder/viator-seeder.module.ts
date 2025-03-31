// src/viator-seeder/viator-seeder.module.ts
import { Module } from '@nestjs/common';
import { ViatorDestinationModule } from '../viator-destination/viator-destination.module';
import { ViatorTagModule } from '../viator-tag/viator-tag.module';
import { ViatorExchangeRateModule } from '../viator-exchange-rate/viator-exchange-rate.module';
import { ViatorSeederController } from './viator-seeder.controller';
import { ViatorSeederService } from './viator-seeder.service';

@Module({
  imports: [ViatorDestinationModule, ViatorTagModule, ViatorExchangeRateModule],
  controllers: [ViatorSeederController],
  providers: [ViatorSeederService],
  exports: [ViatorSeederService],
})
export class ViatorSeederModule {}
