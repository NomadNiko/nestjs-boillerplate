// src/viator-destination/viator-destination.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ViatorApiModule } from '../viator-api/viator-api.module';
import { ViatorDestinationController } from './viator-destination.controller';
import { ViatorDestinationService } from './viator-destination.service';
import {
  ViatorDestinationSchemaClass,
  ViatorDestinationSchema,
} from './viator-destination.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ViatorDestinationSchemaClass.name,
        schema: ViatorDestinationSchema,
      },
    ]),
    ViatorApiModule,
  ],
  controllers: [ViatorDestinationController],
  providers: [ViatorDestinationService],
  exports: [ViatorDestinationService],
})
export class ViatorDestinationModule {}
