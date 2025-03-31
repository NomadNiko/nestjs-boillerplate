import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  BadRequestException,
  UnauthorizedException,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { SupportTicketService } from './support-ticket.service';
import { CreateSupportTicketDto } from './dto/support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { AddTicketUpdateDto } from './dto/add-ticket-update.dto';
import { TicketStatus } from './infrastructure/persistence/document/entities/support-ticket.schema';

@ApiTags('Support Tickets')
@Controller('support-tickets')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SupportTicketController {
  constructor(private readonly supportTicketService: SupportTicketService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new support ticket' })
  @ApiResponse({
    status: 201,
    description: 'The support ticket has been successfully created.',
  })
  async create(
    @Body() createTicketDto: CreateSupportTicketDto,
    @Request() req,
  ) {
    createTicketDto.createdBy = req.user.id;
    return this.supportTicketService.create(createTicketDto);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiOperation({ summary: 'Get all tickets (Admin only)' })
  @ApiQuery({ name: 'sortField', required: false })
  @ApiQuery({ name: 'sortDirection', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'searchTerm', required: false })
  async findAllAdmin(
    @Query('sortField') sortField?: string,
    @Query('sortDirection') sortDirection?: 'asc' | 'desc',
    @Query('status') status?: TicketStatus,
    @Query('searchTerm') searchTerm?: string,
  ) {
    return this.supportTicketService.findAllAdmin({
      sortField,
      sortDirection,
      status,
      searchTerm,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get support tickets' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'assignedTo', required: false })
  async findAll(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: TicketStatus,
    @Query('category') category?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    const isAdmin = req.user.role?.id === RoleEnum.admin;

    if (!isAdmin) {
      return this.supportTicketService.findAllByUser(req.user.id, page, limit);
    }

    return this.supportTicketService.findAll(page, limit, {
      status,
      category,
      assignedTo,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a support ticket by ID' })
  @ApiParam({ name: 'id', description: 'Support ticket ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    const ticket = await this.supportTicketService.findById(id);
    
    const isAdmin = req.user.role?.id === RoleEnum.admin;
    const isOwner = ticket.createdBy === req.user.id;
    const isAssigned = ticket.assignedTo === req.user.id;

    if (!isAdmin && !isOwner && !isAssigned) {
      throw new UnauthorizedException('You do not have access to this ticket');
    }

    return ticket;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a support ticket' })
  @ApiParam({ name: 'id', description: 'Support ticket ID' })
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateSupportTicketDto,
  ) {
    return this.supportTicketService.update(id, updateTicketDto);
  }

  @Post(':id/updates')
  @ApiOperation({ summary: 'Add an update to a support ticket' })
  @ApiParam({ name: 'id', description: 'Support ticket ID' })
  async addUpdate(
    @Param('id') id: string,
    @Body() updateDto: AddTicketUpdateDto,
    @Request() req,
  ) {
    const ticket = await this.supportTicketService.findById(id);
    
    const isAdmin = req.user.role?.id === RoleEnum.admin;
    const isOwner = ticket.createdBy === req.user.id;
    const isAssigned = ticket.assignedTo === req.user.id;

    if (!isAdmin && !isOwner && !isAssigned) {
      throw new UnauthorizedException('You cannot add updates to this ticket');
    }

    updateDto.userId = req.user.id;
    return this.supportTicketService.addUpdate(id, updateDto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update ticket status' })
  @ApiParam({ name: 'id', description: 'Support ticket ID' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TicketStatus,
  ) {
    if (!Object.values(TicketStatus).includes(status)) {
      throw new BadRequestException('Invalid status');
    }
    return this.supportTicketService.updateStatus(id, status);
  }

  @Put(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiOperation({ summary: 'Assign ticket to support staff' })
  @ApiParam({ name: 'id', description: 'Support ticket ID' })
  async assignTicket(
    @Param('id') id: string,
    @Body('assignedTo') assignedTo: string,
  ) {
    return this.supportTicketService.assignTicket(id, assignedTo);
  }
  
  @Get('search/by-ticket-id/:ticketId')
  @ApiOperation({ summary: 'Find ticket by ticket ID (SD00001 format)' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID in SD00001 format' })
  async findByTicketId(@Param('ticketId') ticketId: string, @Request() req) {
    const ticket = await this.supportTicketService.findByTicketId(ticketId);
    
    const isAdmin = req.user.role?.id === RoleEnum.admin;
    const isOwner = ticket.createdBy === req.user.id;
    const isAssigned = ticket.assignedTo === req.user.id;

    if (!isAdmin && !isOwner && !isAssigned) {
      throw new UnauthorizedException('You do not have access to this ticket');
    }

    return ticket;
  }
}