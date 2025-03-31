import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  TicketSchemaClass, 
  TicketDocument, 
  TicketStatus 
} from './infrastructure/persistence/document/entities/ticket.schema';
import { VendorSchemaClass } from '../vendors/infrastructure/persistence/document/entities/vendor.schema';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ProductItemService } from 'src/product-item/product-item.service';

@Injectable()
export class TicketService {
  constructor(
    @InjectModel(TicketSchemaClass.name)
    private readonly ticketModel: Model<TicketDocument>,
    private readonly productItemService: ProductItemService,
    @InjectModel(VendorSchemaClass.name)
    private readonly vendorModel: Model<VendorSchemaClass>,
  ) {}

  private transformTicket(ticket: TicketDocument) {
    const ticketObj = ticket.toObject();
    return {
      _id: ticketObj._id.toString(),
      userId: ticketObj.userId,
      transactionId: ticketObj.transactionId,
      vendorId: ticketObj.vendorId,
      productItemId: ticketObj.productItemId,
      productName: ticketObj.productName,
      productDescription: ticketObj.productDescription,
      productPrice: ticketObj.productPrice,
      productType: ticketObj.productType,
      productDuration: ticketObj.productDuration,
      productDate: ticketObj.productDate?.toISOString(),
      productStartTime: ticketObj.productStartTime,
      productLocation: ticketObj.productLocation ? {
        type: ticketObj.productLocation.type,
        coordinates: ticketObj.productLocation.coordinates
      } : undefined,
      productImageURL: ticketObj.productImageURL,
      productAdditionalInfo: ticketObj.productAdditionalInfo,
      productRequirements: ticketObj.productRequirements,
      productWaiver: ticketObj.productWaiver,
      quantity: ticketObj.quantity,
      used: ticketObj.used,
      usedAt: ticketObj.usedAt?.toISOString(),
      status: ticketObj.status,
      statusUpdateReason: ticketObj.statusUpdateReason,
      statusUpdatedAt: ticketObj.statusUpdatedAt?.toISOString(),
      statusUpdatedBy: ticketObj.statusUpdatedBy,
      vendorOwed: ticketObj.vendorOwed,
      vendorPaid: ticketObj.vendorPaid,
      createdAt: ticketObj.createdAt?.toISOString(),
      updatedAt: ticketObj.updatedAt?.toISOString()
    };
  }

  async updateTicketsForRefundedTransaction(transactionId: string): Promise<void> {
    try {
      const tickets = await this.ticketModel.find({ transactionId });
      
      if (!tickets.length) {
        console.log(`No tickets found for refunded transaction: ${transactionId}`);
        return;
      }
      
      const session = await this.ticketModel.db.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Update all tickets to CANCELLED status
          const updatePromises = tickets.map(ticket =>
            this.ticketModel.findByIdAndUpdate(
              ticket._id,
              {
                status: TicketStatus.CANCELLED,
                statusUpdateReason: 'Transaction refunded',
                statusUpdatedAt: new Date(),
                statusUpdatedBy: 'system',
              },
              { new: true, session }
            )
          );
          
          await Promise.all(updatePromises);
          
          // Process vendor balance adjustments
          for (const ticket of tickets) {
            if (ticket.vendorId) {
              try {
                // If ticket was REDEEMED, subtract the vendor's portion which is stored in vendorOwed
                // For unredeemed tickets, we don't need to adjust the balance as they weren't paid yet
                if (ticket.status === TicketStatus.REDEEMED) {
                  // Adjust vendor's balance, allowing it to go negative if necessary
                  await this.vendorModel.findByIdAndUpdate(
                    ticket.vendorId,
                    { $inc: { internalAccountBalance: -ticket.vendorOwed } },
                    { session }
                  );
                  
                  console.log(`Adjusted vendor ${ticket.vendorId} balance by -${ticket.vendorOwed} for redeemed ticket ${ticket._id}`);
                }
              } catch (err) {
                // Log the error but continue processing other tickets
                console.error(`Failed to update vendor balance for refund: ${err.message}`);
              }
            }
          }
        });
        
        console.log(`Successfully updated ${tickets.length} tickets for refunded transaction: ${transactionId}`);
      } catch (error) {
        console.error('Transaction error during refund processing:', error);
        throw new InternalServerErrorException('Failed to process refund transaction');
      } finally {
        await session.endSession();
      }
    } catch (error) {
      console.error('Error updating tickets for refunded transaction:', error);
      throw new InternalServerErrorException('Failed to update tickets after refund');
    }
  }
  
  async createTicket(ticketData: Partial<TicketSchemaClass>): Promise<any> {
    const session = await this.ticketModel.db.startSession();
    try {
      await session.withTransaction(async () => {
        const vendor = await this.vendorModel.findById(ticketData.vendorId).session(session);
        if (!vendor) {
          throw new NotFoundException('Vendor not found');
        }

        if (!ticketData.productPrice) {
          throw new BadRequestException('Product price is required');
        }

        const vendorOwed = ticketData.productPrice * (1 - (vendor.vendorApplicationFee || 0.13));
        const ticket = new this.ticketModel({
          ...ticketData,
          vendorOwed,
          vendorPaid: false,
          status: TicketStatus.ACTIVE
        });

        const savedTicket = await ticket.save({ session });
        return this.transformTicket(savedTicket);
      });
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findByVendorId(vendorId: string) {
    try {
      const tickets = await this.ticketModel
        .find({ vendorId })
        .sort({ createdAt: -1 });
        
      return {
        data: tickets.map(ticket => this.transformTicket(ticket)),
      };
    } catch (error) {
      console.error('Error finding tickets for vendor:', error);
      throw new InternalServerErrorException('Failed to fetch vendor tickets');
    }
  }

  async findByUserId(userId: string) {
    const tickets = await this.ticketModel
      .find({ userId })
      .sort({ createdAt: -1 });
    return tickets.map(ticket => this.transformTicket(ticket));
  }

  async findById(id: string) {
    const ticket = await this.ticketModel.findById(id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return this.transformTicket(ticket);
  }

  async updateStatus(
    id: string, 
    status: TicketStatus,
    {
      reason,
      updatedBy
    }: {
      reason?: string;
      updatedBy: string;
    }
  ) {
    const session = await this.ticketModel.db.startSession();
    try {
      return await session.withTransaction(async () => {
        const ticket = await this.ticketModel.findById(id).session(session);
        if (!ticket) {
          throw new NotFoundException('Ticket not found');
        }

        const oldStatus = ticket.status;
        ticket.status = status;
        ticket.statusUpdateReason = reason;
        ticket.statusUpdatedAt = new Date();
        ticket.statusUpdatedBy = updatedBy;

        // Handle redemption specific logic
        if (status === TicketStatus.REDEEMED && oldStatus !== TicketStatus.REDEEMED) {
          const vendor = await this.vendorModel.findById(ticket.vendorId).session(session);
          if (!vendor) {
            throw new NotFoundException('Vendor not found');
          }

          // Calculate vendor's share based on application fee
          const applicationFee = vendor.vendorApplicationFee || 0.13; // Default to 13% if not set
          const vendorShare = ticket.productPrice * (1 - applicationFee);

          // Update vendor's internal balance
          await this.vendorModel.findByIdAndUpdate(
            ticket.vendorId,
            { $inc: { internalAccountBalance: vendorShare } },
            { session }
          );
        }

        const updatedTicket = await ticket.save({ session });
        return this.transformTicket(updatedTicket);
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error instanceof Error ?
        new InternalServerErrorException(error.message) :
        new InternalServerErrorException('Failed to update ticket status');
    } finally {
      await session.endSession();
    }
  }


  async updateTicket(
    id: string,
    updateTicketDto: UpdateTicketDto
  ) {
    const ticket = await this.ticketModel.findById(id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Don't allow updating vendorOwed or vendorPaid through this method
    delete updateTicketDto['vendorOwed'];
    delete updateTicketDto['vendorPaid'];

    Object.assign(ticket, updateTicketDto);
    const updatedTicket = await ticket.save();
    return this.transformTicket(updatedTicket);
  }

  async findByTransactionId(transactionId: string) {
    const tickets = await this.ticketModel.find({ transactionId });
    return tickets.map(ticket => this.transformTicket(ticket));
  }

  async markTicketAsUsed(ticketId: string) {
    const session = await this.ticketModel.db.startSession();
    try {
      return await session.withTransaction(async () => {
        const ticket = await this.ticketModel.findById(ticketId).session(session);
        
        if (!ticket) {
          throw new NotFoundException('Ticket not found');
        }

        if (ticket.used) {
          throw new BadRequestException('Ticket has already been used');
        }

        ticket.used = true;
        ticket.usedAt = new Date();
        
        const updatedTicket = await ticket.save({ session });
        return this.transformTicket(updatedTicket);
      });
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findPendingPaymentTickets(vendorId: string) {
    const tickets = await this.ticketModel.find({
      vendorId,
      status: TicketStatus.REDEEMED,
      vendorPaid: false
    }).sort({ updatedAt: 1 });
    
    return tickets.map(ticket => this.transformTicket(ticket));
  }

  async markTicketAsPaid(ticketId: string) {
    const ticket = await this.ticketModel.findById(ticketId);
    
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.vendorPaid) {
      throw new BadRequestException('Ticket has already been paid');
    }

    ticket.vendorPaid = true;
    const updatedTicket = await ticket.save();
    
    return this.transformTicket(updatedTicket);
  }
}