import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { VendorController } from './vendor.controller';
import { VendorV1Controller } from './controllers/vendor-v1.controller';
import { VendorService } from './vendor.service';
import { VendorCrudService } from './services/vendor-crud.service';
import { VendorSearchService } from './services/vendor-search.service';
import { VendorStripeService } from './services/vendor-stripe.service';
import { VendorOwnerService } from './services/vendor-owner.service';
import { VendorProductService } from './services/vendor-product.service';
import {
  VendorSchemaClass,
  VendorSchema,
} from './infrastructure/persistence/document/entities/vendor.schema';
import {
  UserSchemaClass,
  UserSchema,
} from '../users/infrastructure/persistence/document/entities/user.schema';
import {
  PayoutSchemaClass,
  PayoutSchema,
} from '../payout/infrastructure/persistence/document/entities/payout.schema';
import { StripeConnectModule } from '../stripe-connect/stripe-connect.module';
import { MailModule } from '../mail/mail.module'; // Add this import

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: VendorSchemaClass.name,
        schema: VendorSchema,
      },
      {
        name: UserSchemaClass.name,
        schema: UserSchema,
      },
      {
        name: PayoutSchemaClass.name,
        schema: PayoutSchema,
      },
    ]),
    ConfigModule,
    StripeConnectModule,
    MailModule, // Add this to imports
  ],
  controllers: [VendorController, VendorV1Controller],
  providers: [
    VendorService,
    VendorCrudService,
    VendorSearchService,
    VendorStripeService,
    VendorOwnerService,
    VendorProductService,
  ],
  exports: [
    VendorService,
    VendorCrudService,
    VendorSearchService,
    VendorStripeService,
    VendorOwnerService,
    VendorProductService,
  ],
})
export class VendorModule {}
