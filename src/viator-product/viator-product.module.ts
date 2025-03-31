import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ViatorApiModule } from '../viator-api/viator-api.module';
import { ViatorProductController } from './viator-product.controller';
import { ViatorProductService } from './viator-product.service';
import {
  ViatorProductSchemaClass,
  ViatorProductSchema,
} from './viator-product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ViatorProductSchemaClass.name,
        schema: ViatorProductSchema,
      },
    ]),
    ViatorApiModule,
  ],
  controllers: [ViatorProductController],
  providers: [ViatorProductService],
  exports: [ViatorProductService],
})
export class ViatorProductModule {}
