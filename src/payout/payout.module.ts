import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayoutController } from './payout.controller';
import { PayoutService } from './payout.service';
import { PayoutSchemaClass, PayoutSchema } from './infrastructure/persistence/document/entities/payout.schema';
import { VendorModule } from '../vendors/vendor.module';
import { StripeConnectModule } from '../stripe-connect/stripe-connect.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PayoutSchemaClass.name, schema: PayoutSchema }
    ]),
    VendorModule,
    StripeConnectModule
  ],
  controllers: [PayoutController],
  providers: [PayoutService],
  exports: [PayoutService]
})
export class PayoutModule {}