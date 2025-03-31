import { 
  Controller, 
  Post, 
  Body, 
  Headers,
  Req,
  UseGuards,
  Get,
  Query,
  Request,
  RawBodyRequest,
  Param
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CartItemClass } from '../cart/entities/cart.schema';
import Stripe from 'stripe';
import { Request as ExpressRequest } from 'express';
@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
  private stripe: Stripe;
  constructor(
    private readonly stripeService: StripeService
  ) {}
  @Post('create-checkout-session')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async createCheckoutSession(
    @Body() body: {
      items: CartItemClass[];
      returnUrl: string;
    },
    @Request() req
  ) {
    return this.stripeService.createCheckoutSession({
      ...body,
      customerId: req.user.id
    });
  }
  @Get('session-status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getSessionStatus(
    @Query('session_id') sessionId: string
  ) {
    return this.stripeService.getSessionStatus(sessionId);
  }
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<ExpressRequest>
  ) {
    try {
      const event = request.body;
      return await this.stripeService.handleWebhookEvent(
        signature,
        event
      );
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  @Post('refund/ticket/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue a refund for a specific ticket' })
  @ApiResponse({ status: 200, description: 'Refund initiated successfully' })
  @ApiResponse({ status: 404, description: 'Ticket or transaction not found' })
  async refundTicket(
    @Param('id') ticketId: string
  ) {
    const refund = await this.stripeService.issueTicketRefund(ticketId);
    return {
      success: true,
      message: 'Ticket refund initiated successfully',
      refundId: refund.id
    };
  }
  
  @Post('refund/transaction/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue a full refund for a transaction' })
  @ApiResponse({ status: 200, description: 'Refund initiated successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async refundTransaction(
    @Param('id') transactionId: string
  ) {
    const refund = await this.stripeService.issueTransactionRefund(transactionId);
    return {
      success: true,
      message: 'Transaction refund initiated successfully',
      refundId: refund.id
    };
  }

}