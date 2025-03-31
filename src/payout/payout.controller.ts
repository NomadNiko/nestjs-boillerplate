import {
    Controller,
    Get,
    Post,
    Param,
    UseGuards,
    UnauthorizedException,
    Request,
    Query,
    DefaultValuePipe,
    ParseIntPipe,
    NotFoundException,
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
  import { RolesGuard } from '../roles/roles.guard';
  import { Roles } from '../roles/roles.decorator';
  import { RoleEnum } from '../roles/roles.enum';
  import { PayoutService } from './payout.service';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
  } from '@nestjs/swagger';
  import { PayoutResponseDto } from './dto/payout.dto';
  import { VendorService } from '../vendors/vendor.service';
  
  @ApiTags('Payouts')
  @Controller('payouts')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  export class PayoutController {
    constructor(
      private readonly payoutService: PayoutService,
      private readonly vendorService: VendorService,
    ) {}
  
    @Get('vendor/:vendorId')
    @ApiOperation({ summary: "Get vendor's payout history" })
    @ApiResponse({
      status: 200,
      description: 'Returns paginated list of payouts',
      type: [PayoutResponseDto],
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getVendorPayouts(
      @Request() req,
      @Param('vendorId') vendorId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ) {
      const isAdmin = req.user.role?.id === RoleEnum.admin;
      const isVendorOwner = await this.vendorService.isUserAssociatedWithVendor(
        req.user.id,
        vendorId,
      );
  
      if (!isAdmin && !isVendorOwner) {
        throw new UnauthorizedException(
          'Not authorized to view payouts for this vendor',
        );
      }
  
      return this.payoutService.findByVendor(vendorId);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get payout by ID' })
    @ApiResponse({
      status: 200,
      description: 'Returns payout details',
      type: PayoutResponseDto,
    })
    async getPayoutById(
      @Request() req,
      @Param('id') id: string,
    ) {
      const payout = await this.payoutService.findById(id);
      
      if (!payout) {
        throw new NotFoundException('Payout not found');
      }
  
      const isAdmin = req.user.role?.id === RoleEnum.admin;
      const isVendorOwner = await this.vendorService.isUserAssociatedWithVendor(
        req.user.id,
        payout.data.vendorId,
      );
  
      if (!isAdmin && !isVendorOwner) {
        throw new UnauthorizedException(
          'Not authorized to view this payout',
        );
      }
  
      return payout;
    }
  

  
    @Get('stats/:vendorId')
    @ApiOperation({ summary: 'Get payout statistics for vendor' })
    @ApiResponse({
      status: 200,
      description: 'Returns payout statistics',
    })
    async getPayoutStats(
      @Request() req,
      @Param('vendorId') vendorId: string,
    ) {
      const isAdmin = req.user.role?.id === RoleEnum.admin;
      const isVendorOwner = await this.vendorService.isUserAssociatedWithVendor(
        req.user.id,
        vendorId,
      );
  
      if (!isAdmin && !isVendorOwner) {
        throw new UnauthorizedException(
          'Not authorized to view payout stats for this vendor',
        );
      }
  
      return this.payoutService.getPayoutStats(vendorId);
    }

    
  }