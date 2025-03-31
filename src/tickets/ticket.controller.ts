import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Request,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { TicketService } from './ticket.service';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { VendorService } from '../vendors/vendor.service';
import { TicketStatus } from './infrastructure/persistence/document/entities/ticket.schema';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly vendorService: VendorService,
  ) {}

  @Get(':id')
  async getTicket(@Param('id') id: string) {
    const ticket = await this.ticketService.findById(id);
    return { data: ticket };
  }

  @Get('user/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all tickets for a user' })
  @ApiResponse({
    status: 200,
    description: 'Returns all tickets for the specified user',
  })
  async getUserTickets(@Param('id') id: string, @Request() req) {
    if (req.user.id !== id && req.user.role?.id !== RoleEnum.admin) {
      throw new UnauthorizedException('Not authorized to view these tickets');
    }

    const tickets = await this.ticketService.findByUserId(id);
    return { data: tickets };
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiBearerAuth()
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTicketStatusDto,
    @Request() req,
  ) {
    const ticket = await this.ticketService.updateStatus(
      id,
      updateStatusDto.status,
      {
        reason: updateStatusDto.reason,
        updatedBy: req.user.id,
      },
    );
    return { data: ticket };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiBearerAuth()
  async updateTicket(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    const ticket = await this.ticketService.updateTicket(id, updateTicketDto);
    return { data: ticket };
  }

  @Post(':id/redeem')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async redeemTicket(@Param('id') id: string, @Request() req) {
    const ticket = await this.ticketService.findById(id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const isVendorUser = await this.vendorService.isUserAssociatedWithVendor(
      req.user.id,
      ticket.vendorId,
    );

    if (!isVendorUser) {
      throw new UnauthorizedException('Not authorized to redeem this ticket');
    }

    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException(
        `Ticket cannot be redeemed - current status: ${ticket.status}`,
      );
    }

    const updatedTicket = await this.ticketService.updateStatus(
      id,
      TicketStatus.REDEEMED,
      {
        updatedBy: req.user.id,
      },
    );

    return { data: updatedTicket };
  }

  @Get('vendor/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all tickets for a vendor' })
  @ApiResponse({
    status: 200,
    description: 'Returns all tickets for the specified vendor',
  })
  async getVendorTickets(@Param('id') id: string, @Request() req) {
    // First check if user is associated with this vendor
    const isVendorUser = await this.vendorService.isUserAssociatedWithVendor(
      req.user.id,
      id,
    );

    if (!isVendorUser && req.user.role?.id !== RoleEnum.admin) {
      throw new UnauthorizedException('Not authorized to view these tickets');
    }

    return this.ticketService.findByVendorId(id);
  }
}
