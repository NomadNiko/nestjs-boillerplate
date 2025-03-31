import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { StripeCheckoutService } from './services/stripe-checkout.service';
import { StripeWebhookService } from './services/stripe-webhook.service';
import { StripeRefundService } from './services/stripe-refund.service';
import { TransactionModule } from '../transactions/transaction.module';
import { VendorModule } from '../vendors/vendor.module';
import { CartModule } from '../cart/cart.module';
import { ProductItemModule } from '../product-item/product-item.module';
import { TicketModule } from '../tickets/ticket.module';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { PayoutSchemaClass, PayoutSchema } from '../payout/infrastructure/persistence/document/entities/payout.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { 
        name: PayoutSchemaClass.name, 
        schema: PayoutSchema 
      }
    ]),
    TransactionModule,
    VendorModule,
    CartModule,
    ProductItemModule,
    TicketModule,
    UsersModule,
    MailModule
  ],
  controllers: [StripeController],
  providers: [
    StripeService,
    StripeCheckoutService,
    StripeWebhookService,
    StripeRefundService
  ],
  exports: [StripeService],
})
export class StripeModule {}