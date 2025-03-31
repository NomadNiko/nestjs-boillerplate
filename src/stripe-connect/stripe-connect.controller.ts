import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StripeConnectService } from './stripe-connect.service';
import { StripeAccountSessionDto } from './dto/stripe-connect.dto';
import { Body, Controller, InternalServerErrorException, Param, Post, Request, UseGuards } from '@nestjs/common';
import { VendorService } from 'src/vendors/vendor.service';

@ApiTags('Stripe Connect')
@Controller('stripe-connect')
export class StripeConnectController {
  constructor(
    private readonly stripeConnectService: StripeConnectService,
    private readonly vendorService: VendorService
  ) {}

  @Post('account')
  @ApiOperation({ summary: 'Create or retrieve a Stripe Connect account' })
  @ApiResponse({
    status: 200,
    description: 'Returns the account ID',
  })
  async createOrGetAccount(@Body() body: { vendorId?: string }) {
    try {
      let existingStripeId: string | undefined;
      
      if (body.vendorId) {
        const vendorResponse = await this.vendorService.getStripeStatus(body.vendorId);
        existingStripeId = vendorResponse.data.stripeConnectId;
      }

      const account = await this.stripeConnectService.getOrCreateConnectAccount(existingStripeId);
      return { account: account.id };
    } catch (error) {
      console.error('Error with Stripe account:', error);
      throw error;
    }
  }

  @Post('account-session')
  @ApiOperation({ summary: 'Create a Stripe Connect account session' })
  @ApiResponse({
    status: 200,
    description: 'Returns the account session client secret',
  })
  async createAccountSession(@Body() body: StripeAccountSessionDto) {
    try {
      const accountSession = await this.stripeConnectService.createAccountSession(body.account);
      return {
        client_secret: accountSession.client_secret,
      };
    } catch (error) {
      console.error(
        "An error occurred when calling the Stripe API to create an account session",
        error
      );
      throw error;
    }
  }

  @Post('update-vendor/:vendorId')
  @ApiOperation({ summary: 'Update vendor with Stripe account details' })
  async updateVendorStripeStatus(
    @Param('vendorId') vendorId: string,
    @Body() body: any, // You might want to create a DTO for this
    @Request() req
  ) {
    try {
      const stripeAccountDetails = await this.stripeConnectService.getAccountDetails(body.id);
      return this.vendorService.updateStripeStatus(vendorId, stripeAccountDetails);
    } catch (error) {
      console.error('Error updating vendor Stripe status:', error);
      throw new InternalServerErrorException('Failed to update vendor Stripe status');
    }
  }
}