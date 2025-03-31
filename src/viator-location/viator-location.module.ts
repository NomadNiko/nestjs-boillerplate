// src/viator-location/viator-location.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ViatorApiModule } from '../viator-api/viator-api.module';
import { ViatorLocationController } from './viator-location.controller';
import { ViatorLocationService } from './viator-location.service';
import {
  ViatorLocationSchemaClass,
  ViatorLocationSchema,
} from './viator-location.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ViatorLocationSchemaClass.name,
        schema: ViatorLocationSchema,
      },
    ]),
    ViatorApiModule,
  ],
  controllers: [ViatorLocationController],
  providers: [ViatorLocationService],
  exports: [ViatorLocationService],
})
export class ViatorLocationModule {}
