// src/viator-exchange-rate/viator-exchange-rate.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ViatorApiModule } from '../viator-api/viator-api.module';
import { ViatorExchangeRateController } from './viator-exchange-rate.controller';
import { ViatorExchangeRateService } from './viator-exchange-rate.service';
import {
  ViatorExchangeRateSchemaClass,
  ViatorExchangeRateSchema,
} from './viator-exchange-rate.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ViatorExchangeRateSchemaClass.name,
        schema: ViatorExchangeRateSchema,
      },
    ]),
    ViatorApiModule,
  ],
  controllers: [ViatorExchangeRateController],
  providers: [ViatorExchangeRateService],
  exports: [ViatorExchangeRateService],
})
export class ViatorExchangeRateModule {}
