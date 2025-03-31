import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorSeedService } from './vendor-seed.service';
import {
  VendorSchemaClass,
  VendorSchema,
} from '../../../../vendors/infrastructure/persistence/document/entities/vendor.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: VendorSchemaClass.name,
        schema: VendorSchema,
      },
    ]),
  ],
  providers: [VendorSeedService],
  exports: [VendorSeedService],
})
export class VendorSeedModule {}