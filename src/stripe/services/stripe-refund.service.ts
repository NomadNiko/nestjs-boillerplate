import { 
    Injectable, 
    NotFoundException, 
    BadRequestException, 
    InternalServerErrorException 
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import Stripe from 'stripe';
  import { TransactionService } from '../../transactions/transaction.service';
  import { VendorService } from '../../vendors/vendor.service';
  import { TicketService } from '../../tickets/ticket.service';
  import { TicketStatus } from '../../tickets/infrastructure/persistence/document/entities/ticket.schema';
  import { TransactionStatus } from '../../transactions/infrastructure/persistence/document/entities/transaction.schema';
  
  @Injectable()
  export class StripeRefundService {
    private stripe: Stripe;
  
    constructor(
      private configService: ConfigService,
      private transactionService: TransactionService,
      private vendorService: VendorService,
      private ticketService: TicketService,
    ) {
      this.stripe = new Stripe(
        this.configService.get<string>('STRIPE_SECRET_KEY', { infer: true }) ?? '',
        {
          apiVersion: '2025-02-24.acacia',
        },
      );
    }
  
    async issueTicketRefund(ticketId: string, reason?: string): Promise<any> {
      try {
        // 1. Find the ticket
        const ticket = await this.ticketService.findById(ticketId);
        if (!ticket) {
          throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
        }
        
        // 2. Check if ticket was redeemed and reclaim money from vendor if needed
        if (ticket.status === TicketStatus.REDEEMED && !ticket.vendorPaid) {
          await this.reclaimVendorFunds(ticket.vendorId, ticket.vendorOwed);
        }
        
        // 3. Mark ticket as cancelled
        await this.ticketService.updateStatus(
          ticketId,
          TicketStatus.CANCELLED,
          {
            reason: reason || 'Refunded',
            updatedBy: 'system'
          }
        );
        
        // 4. Find the transaction
        let transaction;
        try {
          transaction = await this.transactionService.findByCheckoutSessionId(ticket.transactionId);
        } catch (error) {
          const transactionResponse = await this.transactionService.findById(ticket.transactionId);
          transaction = transactionResponse.data;
        }
        
        if (!transaction) {
          throw new NotFoundException(`Transaction for ticket ${ticketId} not found`);
        }
        
        if (!transaction.paymentIntentId) {
          throw new BadRequestException(`No payment intent ID found for transaction ${ticket.transactionId}`);
        }
        
        // 5. Calculate refund amount
        const refundAmount = Math.round(ticket.productPrice * 100);
        
        // 6. Send refund to Stripe
        const refund = await this.stripe.refunds.create({
          payment_intent: transaction.paymentIntentId,
          amount: refundAmount,
          metadata: {
            ticketId: ticketId,
            transactionId: transaction._id.toString()
          }
        });
        
        // 7. Record partial refund in transaction
        await this.transactionService.addPartialRefund({
          transactionId: transaction._id,
          ticketId: ticketId,
          refundId: refund.id,
          amount: refundAmount,
          reason: reason || 'Customer requested refund'
        });
        
        console.log(`Refund issued for ticket ${ticketId}, amount: ${refundAmount / 100}`);
        return refund;
      } catch (error) {
        console.error(`Error issuing refund for ticket ${ticketId}:`, error);
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
          throw error;
        }
        throw new InternalServerErrorException('Failed to process ticket refund');
      }
    }
    
    async issueTransactionRefund(transactionId: string): Promise<any> {
      try {
        // 1. Get transaction
        const transactionResponse = await this.transactionService.findById(transactionId);
        const transaction = transactionResponse.data;
        
        if (!transaction) {
          throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
        }
        
        if (!transaction.paymentIntentId) {
          throw new BadRequestException(`No payment intent ID found for transaction ${transactionId}`);
        }
        
        // 2. Find all tickets for this transaction
        const tickets = await this.ticketService.findByTransactionId(transaction.stripeCheckoutSessionId);
        const activeOrRedeemedTickets = tickets.filter(ticket => 
          ticket.status === TicketStatus.ACTIVE || ticket.status === TicketStatus.REDEEMED
        );
        
        // 3. Process each ticket
        for (const ticket of activeOrRedeemedTickets) {
          // Reclaim money from vendor if ticket was redeemed and not paid
          if (ticket.status === TicketStatus.REDEEMED && !ticket.vendorPaid) {
            await this.reclaimVendorFunds(ticket.vendorId, ticket.vendorOwed);
          }
          
          // Mark ticket as cancelled
          await this.ticketService.updateStatus(
            ticket._id,
            TicketStatus.CANCELLED,
            {
              reason: 'Full transaction refund',
              updatedBy: 'system'
            }
          );
        }
        
        // 4. Calculate remaining amount for refund
        // Get transaction with partial refunds
        const refundDataResponse = await this.transactionService.findById(transactionId);
        let totalPartialRefunds = 0;
        
        // Try to get partial refunds if they exist
        if (refundDataResponse.data && 
            typeof refundDataResponse.data === 'object' && 
            'partialRefunds' in refundDataResponse.data &&
            Array.isArray(refundDataResponse.data.partialRefunds)) {
          
          totalPartialRefunds = refundDataResponse.data.partialRefunds.reduce(
            (sum, refund) => sum + (refund.amount || 0), 0
          );
        }
        
        const remainingAmount = Math.round(transaction.amount * 100) - totalPartialRefunds;
        
        if (remainingAmount <= 0) {
          throw new BadRequestException('Transaction is already fully refunded');
        }
        
        // 5. Mark transaction as refunded
        await this.transactionService.updateTransactionStatus(
          transactionId,
          TransactionStatus.REFUNDED
        );
        
        // 6. Issue the refund with Stripe
        const refund = await this.stripe.refunds.create({
          payment_intent: transaction.paymentIntentId,
          amount: remainingAmount,
          metadata: {
            transactionId: transactionId,
            isFullRefund: 'true'
          }
        });
        
        console.log(`Full refund initiated for transaction ${transactionId}, amount: ${remainingAmount/100}`);
        return refund;
        
      } catch (error) {
        console.error(`Error issuing refund for transaction ${transactionId}:`, error);
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
          throw error;
        }
        throw new InternalServerErrorException('Failed to process transaction refund');
      }
    }
  
    private async reclaimVendorFunds(vendorId: string, amount: number): Promise<void> {
      try {
        // Update vendor balance using the vendor service
        await this.vendorService.updateVendorBalance(vendorId, -amount/100);
        
        console.log(`Reclaimed ${amount} from vendor ${vendorId}`);
      } catch (error) {
        console.error(`Failed to reclaim funds from vendor ${vendorId}:`, error);
        throw new InternalServerErrorException('Failed to reclaim funds from vendor');
      }
    }
  }