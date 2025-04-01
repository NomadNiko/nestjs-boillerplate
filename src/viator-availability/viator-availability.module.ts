// src/viator-availability/viator-availability.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ViatorApiModule } from '../viator-api/viator-api.module';
import { ViatorAvailabilityController } from './viator-availability.controller';
import { ViatorAvailabilityService } from './viator-availability.service';
import {
  ViatorAvailabilitySchemaClass,
  ViatorAvailabilitySchema,
} from './viator-availability.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ViatorAvailabilitySchemaClass.name,
        schema: ViatorAvailabilitySchema,
      },
    ]),
    ViatorApiModule,
  ],
  controllers: [ViatorAvailabilityController],
  providers: [ViatorAvailabilityService],
  exports: [ViatorAvailabilityService],
})
export class ViatorAvailabilityModule {}
