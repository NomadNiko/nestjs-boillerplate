import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CartItemClass } from '../../cart/entities/cart.schema';
import { CartService } from '../../cart/cart.service';
import { TransactionService } from '../../transactions/transaction.service';
import {
  TransactionStatus,
  TransactionType,
} from '../../transactions/infrastructure/persistence/document/entities/transaction.schema';

// Interfaces moved to types file
interface CustomSession extends Omit<Stripe.Checkout.Session, 'client_secret'> {
  client_secret: string | null;
}

interface EmbeddedCheckoutParams extends Omit<Stripe.Checkout.SessionCreateParams, 'success_url' | 'cancel_url'> {
  ui_mode: 'embedded';
  return_url: string;
}

@Injectable()
export class StripeCheckoutService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private cartService: CartService,
    private transactionService: TransactionService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY', { infer: true }) ?? '',
      {
        apiVersion: '2025-02-24.acacia',
      },
    );
  }

  async createCheckoutSession({
    items,
    customerId,
    returnUrl,
  }: {
    items: CartItemClass[];
    customerId: string;
    returnUrl: string;
  }) {
    try {
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Invalid or empty items array');
      }

      await this.cartService.setCheckoutStatus(customerId, true);

      const totalAmount = items.reduce((sum, item) => {
        const itemPrice = Number(item.price) || 0;
        const itemQuantity = Number(item.quantity) || 0;
        return sum + Math.round(itemPrice * itemQuantity * 100);
      }, 0);

      if (totalAmount <= 0) {
        throw new Error('Invalid total amount');
      }
      
      const compactItemsMetadata = items.map(item => ({
        id: item.productItemId,
        q: item.quantity,
        d: new Date(item.productDate).toISOString().split('T')[0],
        t: item.productStartTime
      }));

      const sessionParams: EmbeddedCheckoutParams = {
        ui_mode: 'embedded',
        return_url: returnUrl,
        line_items: items.map((item) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.productName,
              metadata: {
                id: item.productItemId,
                date: new Date(item.productDate).toISOString().split('T')[0],
                time: item.productStartTime
              }
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        metadata: {
          customerId,
          items: JSON.stringify(compactItemsMetadata)
        },
        payment_intent_data: {
          metadata: {
            customerId
          },
        },
      };

      const session = await this.stripe.checkout.sessions.create(
        sessionParams as Stripe.Checkout.SessionCreateParams
      );

      await this.transactionService.create({
        stripeCheckoutSessionId: session.id,
        amount: totalAmount,
        currency: 'usd',
        customerId,
        productItemIds: items.map(item => item.productItemId),
        description: `Payment for ${items.length} item(s)`,
        metadata: {
          items: JSON.stringify(items),
          returnUrl,
        },
        status: TransactionStatus.PENDING,
        type: TransactionType.PAYMENT,
      });

      // Cast the session to our custom type that includes client_secret
      const sessionWithSecret = session as unknown as CustomSession;
      return {
        clientSecret: sessionWithSecret.client_secret || '',
      };
    } catch (error) {
      await this.cartService.setCheckoutStatus(customerId, false);
      
      console.error('Error creating checkout session:', error);
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : 'Failed to create checkout session',
      );
    }
  }

  async getSessionStatus(sessionId: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return {
        status: session.status,
        customer_email: session.customer_details?.email,
      };
    } catch (error) {
      console.error('Error retrieving session status:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve session status',
      );
    }
  }
}