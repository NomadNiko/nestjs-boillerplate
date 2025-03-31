// src/viator-tag/viator-tag.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ViatorApiModule } from '../viator-api/viator-api.module';
import { ViatorTagController } from './viator-tag.controller';
import { ViatorTagService } from './viator-tag.service';
import {
  ViatorTagSchemaClass,
  ViatorTagSchema,
} from './viator-tag.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ViatorTagSchemaClass.name,
        schema: ViatorTagSchema,
      },
    ]),
    ViatorApiModule,
  ],
  controllers: [ViatorTagController],
  providers: [ViatorTagService],
  exports: [ViatorTagService],
})
export class ViatorTagModule {}
