import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SupportTicketSchemaClass, TicketStatus, TicketUpdate } from './infrastructure/persistence/document/entities/support-ticket.schema';
import { CreateSupportTicketDto } from './dto/support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { AddTicketUpdateDto } from './dto/add-ticket-update.dto';
import { MailService } from '../mail/mail.service';
import { TicketEmailData } from '../mail/interfaces/ticket-email-data.interface';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class SupportTicketService {
  constructor(
    @InjectModel(SupportTicketSchemaClass.name)
    private readonly ticketModel: Model<SupportTicketSchemaClass>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  private transformTicket(ticket: any) {
    return {
      _id: ticket._id.toString(),
      ticketId: ticket.ticketId,
      status: ticket.status,
      createdBy: ticket.createdBy,
      createDate: ticket.createDate?.toISOString(),
      assignedTo: ticket.assignedTo,
      ticketCategory: ticket.ticketCategory,
      ticketTitle: ticket.ticketTitle,
      ticketDescription: ticket.ticketDescription,
      updates: ticket.updates?.map((update: any) => ({
        timestamp: update.timestamp?.toISOString(),
        userId: update.userId,
        updateText: update.updateText
      })),
      createdAt: ticket.createdAt?.toISOString(),
      updatedAt: ticket.updatedAt?.toISOString()
    };
  }

  private async generateTicketId(): Promise<string> {
    const latestTicket = await this.ticketModel
      .findOne({}, { ticketId: 1 })
      .sort({ ticketId: -1 })
      .lean();

    if (!latestTicket) {
      return 'SD00001';
    }

    const currentNumber = parseInt(latestTicket.ticketId.replace('SD', ''));
    const nextNumber = currentNumber + 1;
    return `SD${nextNumber.toString().padStart(5, '0')}`;
  }

  async create(createTicketDto: CreateSupportTicketDto): Promise<any> {
    try {
      const ticketId = await this.generateTicketId();
      
      const ticket = new this.ticketModel({
        ...createTicketDto,
        ticketId,
        createDate: new Date(),
        status: TicketStatus.OPENED,
        updates: []
      });
      const savedTicket = await ticket.save();
      const ticketObj = savedTicket.toObject();
      
      // Send email notification
      try {
        const userInfo = await this.usersService.getUserName(createTicketDto.createdBy);
        if (userInfo && userInfo.email) {
          const emailData = await this.prepareTicketEmailData(ticketObj, 'created');
          await this.mailService.sendSupportTicketEmail({
            to: userInfo.email,
            data: emailData
          });
        }
      } catch (error) {
        console.error('Failed to send ticket creation email:', error);
        // Don't let email failures prevent ticket creation
      }
      
      return this.transformTicket(ticketObj);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create support ticket');
    }
  }

  async findAllAdmin(options: {
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    status?: TicketStatus;
    searchTerm?: string;
    dateRange?: string;
  }): Promise<{ tickets: any[] }> {
    try {
      const query: any = {};

      // Add status filter if provided
      if (options.status) {
        query.status = options.status;
      }

      // Add search term filter if provided
      if (options.searchTerm) {
        query.$or = [
          { ticketTitle: { $regex: options.searchTerm, $options: 'i' } },
          { ticketDescription: { $regex: options.searchTerm, $options: 'i' } },
          { ticketId: { $regex: options.searchTerm, $options: 'i' } }
        ];
      }

      // Add date range filter if provided
      if (options.dateRange) {
        const now = new Date();
        const startDate = new Date();
        
        switch (options.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            query.createDate = { $gte: startDate, $lte: now };
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            query.createDate = { $gte: startDate, $lte: now };
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            query.createDate = { $gte: startDate, $lte: now };
            break;
        }
      }

      // Build sort configuration
      const sort: any = {};
      if (options.sortField) {
        // Map frontend sort fields to database fields
        const sortFieldMap: { [key: string]: string } = {
          createDate: 'createDate',
          lastUpdate: 'updatedAt',
          status: 'status'
        };

        const dbSortField = sortFieldMap[options.sortField] || 'createDate';
        sort[dbSortField] = options.sortDirection === 'asc' ? 1 : -1;
      } else {
        // Default sort by creation date descending
        sort.createDate = -1;
      }

      const tickets = await this.ticketModel
        .find(query)
        .sort(sort)
        .lean()
        .exec();

      return {
        tickets: tickets.map(ticket => this.transformTicket(ticket))
      };
    } catch (error) {
      console.error('Error in findAllAdmin:', error);
      throw new InternalServerErrorException('Failed to fetch tickets');
    }
  }

  // New helper method to prepare ticket email data
  private async prepareTicketEmailData(
    ticket: any, 
    eventType: 'created' | 'updated' | 'assigned' | 'resolved', 
    latestUpdate?: TicketUpdate | null
  ): Promise<TicketEmailData> {
    // Get user information for creator and assignee
    const creatorInfo = await this.usersService.getUserName(ticket.createdBy);
    
    // Safely handle creator name
    const createdByName = creatorInfo 
      ? `${creatorInfo.firstName || ''} ${creatorInfo.lastName || ''}`.trim() || creatorInfo.email
      : 'Unknown User';
  
    // Handle assignee information safely
    let assigneeInfo: { firstName?: string; lastName?: string; email: string } | null = null;
    let assignedToName: string | null = null;
    if (ticket.assignedTo) {
      assigneeInfo = await this.usersService.getUserName(ticket.assignedTo);
      assignedToName = assigneeInfo 
        ? `${assigneeInfo.firstName || ''} ${assigneeInfo.lastName || ''}`.trim() || assigneeInfo.email
        : null;
    }
  
    // Format latest update safely
    let formattedLatestUpdate: TicketEmailData['latestUpdate'] = null;
    if (latestUpdate) {
      try {
        const updateUserInfo = await this.usersService.getUserName(latestUpdate.userId);
        formattedLatestUpdate = {
          timestamp: latestUpdate.timestamp.toISOString(),
          userId: latestUpdate.userId,
          userName: updateUserInfo 
            ? `${updateUserInfo.firstName || ''} ${updateUserInfo.lastName || ''}`.trim() || updateUserInfo.email
            : 'Unknown User',
          updateText: latestUpdate.updateText
        };
      } catch (error) {
        console.error('Error formatting latest update:', error);
        formattedLatestUpdate = null;
      }
    }
  
    // Truncate description if too long
    const truncatedDescription = ticket.ticketDescription.length > 300 
      ? `${ticket.ticketDescription.substring(0, 297)}...` 
      : ticket.ticketDescription;
  
    // Create ticket URL
    const frontendUrl = this.configService.get('app.frontendDomain', { infer: true });
    const ticketUrl = `${frontendUrl}/service-desk/${ticket.ticketId}`;
  
    return {
      ticketId: ticket.ticketId,
      ticketTitle: ticket.ticketTitle,
      ticketCategory: ticket.ticketCategory,
      ticketDescription: truncatedDescription,
      status: ticket.status,
      createdBy: ticket.createdBy,
      createdByName,
      assignedTo: ticket.assignedTo || null,
      assignedToName,
      createDate: new Date(ticket.createDate).toLocaleString(),
      eventType,
      latestUpdate: formattedLatestUpdate,
      ticketUrl
    };
  }


  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: {
      status?: TicketStatus;
      category?: string;
      assignedTo?: string;
    } = {}
  ): Promise<{
    tickets: any[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const query: any = {};

      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.category) {
        query.ticketCategory = filters.category;
      }
      if (filters.assignedTo) {
        query.assignedTo = filters.assignedTo;
      }

      const total = await this.ticketModel.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      const tickets = await this.ticketModel
        .find(query)
        .sort({ createDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec();

      return {
        tickets: tickets.map(ticket => this.transformTicket(ticket)),
        total,
        totalPages,
        currentPage: page
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch tickets');
    }
  }

  async findAllByUser(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    tickets: any[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const query = { 
        $or: [
          { createdBy: userId },
          { assignedTo: userId }
        ]
      };
      
      const total = await this.ticketModel.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      const tickets = await this.ticketModel
        .find(query)
        .sort({ createDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec();

      return {
        tickets: tickets.map(ticket => this.transformTicket(ticket)),
        total,
        totalPages,
        currentPage: page
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch user tickets');
    }
  }

  async findById(id: string): Promise<any> {
    const ticket = await this.ticketModel.findById(id).lean();
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    return this.transformTicket(ticket);
  }

  async findByTicketId(ticketId: string): Promise<any> {
    const ticket = await this.ticketModel.findOne({ ticketId }).lean();
    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }
    return this.transformTicket(ticket);
  }

  async update(id: string, updateTicketDto: UpdateSupportTicketDto): Promise<any> {
    const ticket = await this.ticketModel.findByIdAndUpdate(
      id,
      { $set: updateTicketDto },
      { new: true, runValidators: true }
    ).lean();

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }

    return this.transformTicket(ticket);
  }

  async addUpdate(id: string, updateDto: AddTicketUpdateDto): Promise<any> {
    const ticket = await this.ticketModel.findById(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    
    const update: TicketUpdate = {
      timestamp: new Date(),
      userId: updateDto.userId,
      updateText: updateDto.updateText
    };
    
    ticket.updates.push(update);
    const updatedTicket = await ticket.save();
    const ticketObj = updatedTicket.toObject();
    
    // Send email notifications to creator and assignee (if they exist)
    try {
      // Get creator email
      const creatorInfo = await this.usersService.getUserName(ticket.createdBy);
      
      if (creatorInfo && creatorInfo.email) {
        const emailData = await this.prepareTicketEmailData(ticketObj, 'updated', update);
        await this.mailService.sendSupportTicketEmail({
          to: creatorInfo.email,
          data: emailData
        });
      }
      
      // If ticket is assigned and update is not from assignee, notify assignee too
      if (ticket.assignedTo && ticket.assignedTo !== updateDto.userId) {
        const assigneeInfo = await this.usersService.getUserName(ticket.assignedTo);
        if (assigneeInfo && assigneeInfo.email) {
          const emailData = await this.prepareTicketEmailData(ticketObj, 'updated', update);
          await this.mailService.sendSupportTicketEmail({
            to: assigneeInfo.email,
            data: emailData
          });
        }
      }
    } catch (error) {
      console.error('Failed to send ticket update email:', error);
      // Don't let email failures prevent update
    }
    
    return this.transformTicket(ticketObj);
  }

  async updateStatus(id: string, status: TicketStatus): Promise<any> {
    const ticket = await this.ticketModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();
    
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    
    // Only send email when status is changed to RESOLVED
    if (status === TicketStatus.RESOLVED) {
      try {
        // Get creator email
        const creatorInfo = await this.usersService.getUserName(ticket.createdBy);
        
        // Create a system update for the resolution
        const resolutionUpdate: TicketUpdate = {
          timestamp: new Date(),
          userId: ticket.assignedTo || ticket.createdBy, // Use assignee if available, otherwise creator
          updateText: 'Ticket has been marked as resolved.'
        };
        
        // Notify creator
        if (creatorInfo && creatorInfo.email) {
          const emailData = await this.prepareTicketEmailData(ticket, 'resolved', resolutionUpdate);
          await this.mailService.sendSupportTicketEmail({
            to: creatorInfo.email,
            data: emailData
          });
        }
      } catch (error) {
        console.error('Failed to send ticket resolution email:', error);
        // Don't let email failures prevent status update
      }
    }
    
    return this.transformTicket(ticket);
  }

  async assignTicket(id: string, assignedTo: string): Promise<any> {
    const ticket = await this.ticketModel.findByIdAndUpdate(
      id,
      { 
        assignedTo,
        status: TicketStatus.ASSIGNED 
      },
      { new: true }
    ).lean();
    
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    
    // Send email notifications to creator and new assignee
    try {
      // Get creator email
      const creatorInfo = await this.usersService.getUserName(ticket.createdBy);
      
      // Get assignee info
      const assigneeInfo = await this.usersService.getUserName(assignedTo);
      
      // Create a system update for the assignment
      const assignmentUpdate: TicketUpdate = {
        timestamp: new Date(),
        userId: assignedTo, // Using assignee ID for the update
        updateText: `Ticket assigned to ${assigneeInfo.firstName || ''} ${assigneeInfo.lastName || ''}`.trim() || assigneeInfo.email
      };
      
      // Notify creator
      if (creatorInfo && creatorInfo.email) {
        const emailData = await this.prepareTicketEmailData(ticket, 'assigned', assignmentUpdate);
        await this.mailService.sendSupportTicketEmail({
          to: creatorInfo.email,
          data: emailData
        });
      }
      
      // Notify assignee
      if (assigneeInfo && assigneeInfo.email) {
        const emailData = await this.prepareTicketEmailData(ticket, 'assigned', assignmentUpdate);
        await this.mailService.sendSupportTicketEmail({
          to: assigneeInfo.email,
          data: emailData
        });
      }
    } catch (error) {
      console.error('Failed to send ticket assignment email:', error);
      // Don't let email failures prevent assignment
    }
    
    return this.transformTicket(ticket);
  }
}