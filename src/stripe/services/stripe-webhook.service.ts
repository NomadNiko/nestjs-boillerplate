import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { TransactionService } from '../../transactions/transaction.service';
import { VendorService } from '../../vendors/vendor.service';
import { CartService } from '../../cart/cart.service';
import { ProductItemService } from '../../product-item/product-item.service';
import { TicketService } from '../../tickets/ticket.service';
import {
  CheckoutData,
  TransactionStatus,
} from '../../transactions/infrastructure/persistence/document/entities/transaction.schema';
import {
  PayoutSchemaClass,
  PayoutStatus,
} from '../../payout/infrastructure/persistence/document/entities/payout.schema';
import { TicketStatus } from '../../tickets/infrastructure/persistence/document/entities/ticket.schema';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class StripeWebhookService {
  private stripe: Stripe;
  constructor(
    @InjectModel(PayoutSchemaClass.name)
    private payoutModel: Model<PayoutSchemaClass>,
    private configService: ConfigService,
    private transactionService: TransactionService,
    private vendorService: VendorService,
    private cartService: CartService,
    private productItemService: ProductItemService,
    private ticketService: TicketService,
    private userService: UsersService,
    private mailService: MailService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY', { infer: true }) ??
        '',
      {
        apiVersion: '2025-02-24.acacia',
      },
    );
  }
  async handleWebhookEvent(signature: string, payload: any) {
    try {
      const event = typeof payload === 'string' ? JSON.parse(payload) : payload;
      console.log('Processing webhook event type:', event.type);
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(
            event.data.object as Stripe.PaymentIntent,
          );
          break;
        case 'checkout.session.expired':
          await this.handleCheckoutSessionExpired(
            event.data.object as Stripe.Checkout.Session,
          );
          break;
        case 'transfer.created':
          await this.handleTransferCreated(
            event.data.object as Stripe.Transfer,
          );
          break;
        case 'charge.succeeded':
          await this.handleChargeSucceeded(event.data.object as Stripe.Charge);
          break;
        case 'charge.refunded':
          // Extract payment_intent directly from the webhook data
          const refundObject = event.data.object;
          if (refundObject && refundObject.payment_intent) {
            await this.handleRefund(refundObject.payment_intent, refundObject);
            console.log(
              `Processing refund for payment intent: ${refundObject.payment_intent}`,
            );
          } else {
            console.error(
              'Missing payment_intent in charge.refunded webhook:',
              JSON.stringify(refundObject),
            );
          }
          break;
        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object as Stripe.Dispute);
          break;
      }
      return { received: true };
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw new InternalServerErrorException('Webhook handling failed');
    }
  }
  async handleTransferCreated(transfer: Stripe.Transfer) {
    try {
      const payout = await this.payoutModel.findOne({
        'stripeTransferDetails.transferId': transfer.id,
      });
      if (!payout) {
        console.error(`No payout record found for transfer ID: ${transfer.id}`);
        return;
      }
      const updatedPayout = await this.payoutModel.findByIdAndUpdate(
        payout._id,
        {
          status: PayoutStatus.SUCCEEDED,
          'stripeTransferDetails.destinationPayment':
            transfer.destination_payment,
          processedAt: new Date(transfer.created * 1000),
          updatedAt: new Date(),
        },
        { new: true },
      );
      console.log(
        `Payout ${payout._id} updated to SUCCEEDED status for transfer ${transfer.id}`,
      );
      return updatedPayout;
    } catch (error) {
      console.error('Error handling transfer.created webhook:', error);
      throw new InternalServerErrorException(
        'Failed to process transfer webhook',
      );
    }
  }
  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    try {
      // Extract payment_intent directly from the session object
      const paymentIntentId = session.payment_intent as string;
      if (!paymentIntentId) {
        console.error(
          'Missing payment intent ID in checkout session:',
          JSON.stringify(session),
        );
        throw new Error('Missing payment intent ID in checkout session');
      }
      console.log(
        `Storing payment intent ID ${paymentIntentId} for checkout session ${session.id}`,
      );
      // Store the payment intent ID during checkout completion
      await this.transactionService.updateTransactionStatus(
        session.id,
        TransactionStatus.SUCCEEDED,
        {
          receiptEmail: session.customer_email || undefined,
          paymentIntentId: paymentIntentId,
        },
      );
      if (!session.metadata?.customerId || !session.metadata?.items) {
        throw new Error('Missing required metadata in checkout session');
      }
      const customerId = session.metadata.customerId;
      const items = JSON.parse(session.metadata.items) as Array<{
        id: string;
        q: number;
        d: string;
        t: string;
      }>;
      for (const item of items) {
        const productItem = await this.productItemService.findById(item.id);
        if (!productItem?.data) {
          console.error(`Product item ${item.id} not found`);
          continue;
        }
        try {
          for (let i = 0; i < item.q; i++) {
            await this.ticketService.createTicket({
              userId: customerId,
              transactionId: session.id,
              vendorId: productItem.data.vendorId,
              productItemId: item.id,
              productName: productItem.data.templateName,
              productDescription: productItem.data.description,
              productPrice: productItem.data.price,
              productType: productItem.data.productType,
              productDate: new Date(item.d),
              productStartTime: item.t,
              productDuration: productItem.data.duration,
              productLocation: productItem.data.location,
              productImageURL: productItem.data.imageURL,
              productAdditionalInfo: productItem.data.additionalInfo,
              productRequirements: productItem.data.requirements,
              productWaiver: productItem.data.waiver,
              quantity: 1,
            });
          }
        } catch (error) {
          console.error(`Error processing item ${item.id}:`, error);
        }
      }
      await this.cartService.deleteCart(customerId);
    } catch (error) {
      console.error('Error processing successful checkout:', error);
      throw error;
    }
  }
  private async handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
    try {
      if (!session.metadata?.customerId) {
        throw new Error('Missing customer ID in session metadata');
      }
      await this.cartService.setCheckoutStatus(
        session.metadata.customerId,
        false,
      );
    } catch (error) {
      console.error('Error handling expired checkout session:', error);
      throw error;
    }
  }
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    if (paymentIntent.metadata?.customerId) {
      await this.cartService.setCheckoutStatus(
        paymentIntent.metadata.customerId,
        false,
      );
    }
    await this.transactionService.updateTransactionStatus(
      paymentIntent.id,
      TransactionStatus.FAILED,
      {
        error: paymentIntent.last_payment_error?.message,
      },
    );
  }
  private handleRefund(paymentIntentId: string, refundData: any) {
    try {
      // Just log the successful refund
      console.log(
        `Received successful refund confirmation for payment intent: ${paymentIntentId}`,
      );
      console.log(`Refund amount: ${refundData.amount_refunded / 100}`);
      // No status changes or ticket cancellations - everything was handled proactively
    } catch (error) {
      console.error(
        `Error logging refund for payment intent ${paymentIntentId}:`,
        error,
      );
    }
  }
  private async handleDisputeCreated(dispute: Stripe.Dispute) {
    await this.transactionService.updateTransactionStatus(
      dispute.payment_intent as string,
      TransactionStatus.DISPUTED,
      {
        disputeId: dispute.id,
        disputeStatus: dispute.status,
        disputeAmount: dispute.amount,
      },
    );
  }
  private async handleChargeSucceeded(charge: Stripe.Charge) {
    // Wait 10 seconds to give Stripe time to finish checkout and send the next Webhook
    await new Promise((resolve) => setTimeout(resolve, 10000));
    try {
      if (!charge.payment_intent) {
        console.warn(
          'Charge succeeded webhook received without payment_intent ID',
        );
        return;
      }
      const paymentIntentId =
        typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent.id;
      console.log(
        `Processing charge.succeeded for payment intent: ${paymentIntentId}`,
      );
      const transaction = await this.transactionService.findByPaymentIntentId(
        paymentIntentId,
      );
      if (!transaction) {
        console.warn(
          `No transaction found for payment intent: ${paymentIntentId}`,
        );
        return;
      }
      // Extract checkout data from charge with proper null handling
      const checkoutData: CheckoutData = {
        chargeId: charge.id,
        amount: charge.amount,
        amount_captured: charge.amount_captured,
        amount_refunded: charge.amount_refunded,
        billing_details: {
          address: charge.billing_details?.address || null,
          email: charge.billing_details?.email,
          name: charge.billing_details?.name,
          phone: charge.billing_details?.phone,
        },
        captured: charge.captured,
        created: charge.created,
        currency: charge.currency,
        paid: charge.paid,
        payment_intent: paymentIntentId,
        payment_method:
          typeof charge.payment_method === 'string'
            ? charge.payment_method
            : 'unknown',
        receipt_email: charge.receipt_email,
        receipt_url: charge.receipt_url,
      };
      // Update transaction with checkout data
      await this.transactionService.updateTransactionStatusByPaymentIntentId(
        paymentIntentId,
        TransactionStatus.SUCCEEDED,
        {
          checkoutData,
          receiptEmail: charge.receipt_email || undefined,
        },
      );
      console.log(
        `Successfully updated transaction with checkout data for payment intent: ${paymentIntentId}`,
      );
      // Get the user's information from our system
      if (transaction.customerId) {
        const user = await this.userService.findById(transaction.customerId);
        if (!user) {
          console.warn(
            `User not found for customer ID: ${transaction.customerId}`,
          );
          return;
        }
        // Get the tickets associated with this transaction
        const tickets = await this.ticketService.findByTransactionId(
          transaction.stripeCheckoutSessionId as string,
        );
        if (!tickets || tickets.length === 0) {
          console.warn(
            `No tickets found for transaction: ${transaction.stripeCheckoutSessionId}`,
          );
          return;
        }
        // Send receipt email to customer
        try {
          // Prepare product items for customer email
          const productItems = tickets.map((ticket) => ({
            productName: ticket.productName,
            quantity: ticket.quantity,
            price: ticket.productPrice,
            date: ticket.productDate
              ? new Date(ticket.productDate).toLocaleDateString()
              : undefined,
            time: ticket.productStartTime,
          }));
          await this.mailService.sendTransactionReceipt({
            to: user.email as string,
            data: {
              userName:
                `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                'Valued Customer',
              transactionId: transaction._id.toString(),
              amount: transaction.amount,
              purchaseDate: new Date().toLocaleDateString(),
              productItems,
              stripeReceiptUrl: checkoutData.receipt_url as string,
            },
          });
          console.log(
            `Receipt email sent to ${user.email} for transaction ${transaction._id}`,
          );
        } catch (emailError) {
          // Log error but don't fail the overall process
          console.error('Error sending receipt email to customer:', emailError);
        }
        // Send notification emails to vendors
        try {
          // Group tickets by vendor
          const ticketsByVendor = new Map<string, any[]>();
          const customerName =
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            'Customer';
          for (const ticket of tickets) {
            if (!ticketsByVendor.has(ticket.vendorId)) {
              ticketsByVendor.set(ticket.vendorId, []);
            }
            ticketsByVendor.get(ticket.vendorId)?.push(ticket);
          }
          // Get frontend URL for links
          const frontendUrl = this.configService.get('app.frontendDomain', {
            infer: true,
          });
          // Send emails to each vendor
          for (const [vendorId, vendorTickets] of ticketsByVendor.entries()) {
            // Get vendor info to calculate fees and get vendor name
            const vendor = await this.vendorService.findById(vendorId);
            if (!vendor || !vendor.data) {
              console.warn(`Vendor data not found for vendor ID: ${vendorId}`);
              continue;
            }
            
            // Fix: Check for ownerIds array and handle it properly
            const ownerIds = vendor.data.ownerIds || [];
            if (!ownerIds.length) {
              console.warn(`No owner IDs found for vendor ID: ${vendorId}`);
              continue;
            }
            
            // Calculate vendor-specific totals
            const vendorItemsTotal = vendorTickets.reduce(
              (sum, ticket) => sum + ticket.productPrice,
              0,
            );
            // Calculate platform fee using vendor's application fee rate
            const feePercentage =
              (vendor.data.vendorApplicationFee || 0.13) * 100; // Convert to percentage
            const platformFee =
              vendorItemsTotal * (vendor.data.vendorApplicationFee || 0.13);
            const vendorEarnings = vendorItemsTotal - platformFee;
            
            // Format items for email
            const items = vendorTickets.map((ticket) => ({
              productName: ticket.productName,
              quantity: ticket.quantity,
              price: ticket.productPrice,
              date: ticket.productDate
                ? new Date(ticket.productDate).toLocaleDateString()
                : undefined,
              time: ticket.productStartTime,
              ticketId: ticket._id,
            }));
            
            // Fix: Send email to each owner in the ownerIds array
            let emailSent = false;
            for (const ownerId of ownerIds) {
              // Get vendor owner info to get email address
              const vendorOwner = await this.userService.findById(ownerId);
              if (!vendorOwner || !vendorOwner.email) {
                console.warn(`Vendor owner (ID: ${ownerId}) email not found for vendor ID: ${vendorId}`);
                continue;
              }
              
              // Send email to this owner
              await this.mailService.sendVendorSaleNotification({
                to: vendorOwner.email,
                data: {
                  vendorName: vendor.data.businessName,
                  customerName,
                  transactionId: transaction._id.toString(),
                  purchaseDate: new Date().toLocaleDateString(),
                  vendorItemsTotal,
                  vendorEarnings,
                  platformFee,
                  feePercentage,
                  items,
                  vendorDashboardUrl: `${frontendUrl}/vendor-account/`,
                  ticketManagementUrl: `${frontendUrl}/ticket-validation`,
                },
              });
              
              console.log(
                `Sale notification email sent to vendor owner ${vendorOwner.email} for vendor ${vendor.data.businessName}`,
              );
              emailSent = true;
            }
            
            if (!emailSent) {
              console.error(`No valid owner emails found for vendor ID: ${vendorId}`);
            }
          }
        } catch (vendorEmailError) {
          // Log error but don't fail the overall process
          console.error(
            'Error sending sale notification emails to vendors:',
            vendorEmailError,
          );
        }
      }
    } catch (error) {
      console.error('Error handling charge.succeeded webhook:', error);
      throw error;
    }
  }
}
