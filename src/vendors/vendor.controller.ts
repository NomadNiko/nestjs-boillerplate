import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { VendorService } from './vendor.service';
import { VendorType } from './infrastructure/persistence/document/entities/vendor.schema';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { StripeBalanceResponseDto } from 'src/stripe-connect/dto/stripe-balance.dto';
import { VendorStripeService } from './services/vendor-stripe.service';


@ApiTags('Vendors')
@Controller('vendors')
export class VendorController {
  constructor(
    private readonly vendorStripeService: VendorStripeService,
    private readonly vendorService: VendorService
  ) {}

  @Get()
  async findAll() {
    return this.vendorService.findAllApproved();
  }

  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  async findAllVendors() {
    return this.vendorService.findAllVendors();
  }

  @Get(':id/owners')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiOperation({ summary: 'Get vendor owners' })
  @ApiResponse({
    status: 200,
    description: 'Returns the owners of a vendor',
  })
  async getVendorOwners(@Param('id') id: string) {
    return this.vendorService.getVendorOwners(id);
  }

  @Get('nearby')
  async findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
  ) {
    return this.vendorService.findNearby(
      Number(lat),
      Number(lng),
      radius ? Number(radius) : undefined,
    );
  }

  @Get('by-type')
  async findByType(@Query('type') type: string) {
    const validTypes: VendorType[] = ['tours', 'lessons', 'rentals', 'tickets'];
    if (!validTypes.includes(type as VendorType)) {
      throw new BadRequestException(
        `Invalid vendor type. Must be one of: ${validTypes.join(', ')}`,
      );
    }
    return this.vendorService.findByType(type as VendorType);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createVendorDto: CreateVendorDto, @Request() req) {
    return this.vendorService.create(createVendorDto, req.user.id);
  }

  @Post(':id/stripe-connect')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update vendor Stripe Connect ID' })
  async updateStripeConnectId(
    @Param('id') id: string,
    @Body() body: { stripeConnectId: string },
  ) {
    return this.vendorService.updateStripeConnectId(id, body.stripeConnectId);
  }

  @Post('admin/approve/:vendorId/:userId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  async approveVendor(
    @Param('vendorId') vendorId: string,
    @Param('userId') userId: string,
  ) {
    return this.vendorService.approveVendor(vendorId, userId);
  }

  @Post('payout/:id')
@UseGuards(AuthGuard('jwt'))
@ApiOperation({ summary: 'Trigger payout for vendor' })
@ApiResponse({
  status: 200,
  description: 'Payout initiated successfully',
})
async triggerPayout(
  @Param('id') id: string,
  @Request() req,
) {
  // Verify user has permission to trigger payout for this vendor
  const hasPermission = await this.vendorService.isUserAssociatedWithVendor(req.user.id, id);
  if (!hasPermission) {
    throw new UnauthorizedException('Not authorized to trigger payout for this vendor');
  }
  return this.vendorService.triggerPayout(id);
}

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
  ) {
    return this.vendorService.update(id, updateVendorDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string) {
    return this.vendorService.remove(id);
  }
  @Post(':id/stripe-balance')
  @ApiOperation({ summary: 'Retrieve and update Stripe account balance' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved and updated Stripe balance',
    type: StripeBalanceResponseDto
  })
  async updateStripeBalance(
    @Param('id') vendorId: string,
    @Request() req
  ): Promise<StripeBalanceResponseDto> {
    // Check if user is an admin
    const isAdmin = req.user.role.id === RoleEnum.admin;

    // Check if user is associated with the vendor
    const isVendorOwner = await this.vendorService.isUserAssociatedWithVendor(
      req.user.id, 
      vendorId
    );

    // Allow access only to admins or vendor owners
    if (!isAdmin && !isVendorOwner) {
      throw new UnauthorizedException('Not authorized to update vendor balance');
    }

    return this.vendorStripeService.retrieveAndUpdateStripeBalance(vendorId);
  }
}