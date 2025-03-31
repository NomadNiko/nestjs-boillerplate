import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionSchemaClass, TransactionDocument, TransactionStatus, TransactionType } from './infrastructure/persistence/document/entities/transaction.schema';
import { TransactionFilters } from './types/transaction-filters.type';
import { PaginationOptions } from './types/transaction-pagination.type';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(TransactionSchemaClass.name)
    private readonly transactionModel: Model<TransactionDocument>
  ) {}


  async create(transactionData: Partial<TransactionSchemaClass>) {
    try {
      const transaction = new this.transactionModel({
        ...transactionData,
        productItemIds: Array.isArray(transactionData.productItemIds) 
          ? transactionData.productItemIds 
          : [transactionData.productItemIds]
      });
      return transaction.save();
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new InternalServerErrorException('Failed to create transaction');
    }
  }

  async findById(id: string) {
    const transaction = await this.transactionModel
      .findById(id)
      .select('-__v')
      .lean();

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return {
      data: this.transformTransaction(transaction)
    };
  }

  async findByProductItemIds(productItemIds: string[]) {
    try {
      const transactions = await this.transactionModel
        .find({
          productItemIds: { $in: productItemIds },
          type: TransactionType.PAYMENT,
          status: TransactionStatus.SUCCEEDED
        })
        .sort({ createdAt: -1 })
        .lean();

      return {
        data: transactions.map(transaction => this.transformTransaction(transaction))
      };
    } catch (error) {
      console.error('Error finding transactions by product item ids:', error);
      throw new InternalServerErrorException('Failed to fetch transactions');
    }
  }

  async findByCheckoutSessionId(checkoutSessionId: string) {
    const transaction = await this.transactionModel.findOne({ 
      stripeCheckoutSessionId: checkoutSessionId 
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async updateTransactionStatus(
    checkoutSessionId: string, 
    status: TransactionStatus,
    additionalData: Partial<TransactionSchemaClass> = {}
  ) {
    const transaction = await this.transactionModel.findOneAndUpdate(
      { stripeCheckoutSessionId: checkoutSessionId },
      { 
        $set: {
          status,
          ...additionalData,
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  
  private transformTransaction(transaction: Record<string, any>) {
    return {
      _id: transaction._id.toString(),
      stripeCheckoutSessionId: transaction.stripeCheckoutSessionId,
      paymentIntentId: transaction.paymentIntentId, // Add this line
      amount: transaction.amount,
      currency: transaction.currency,
      customerId: transaction.customerId,
      productItemIds: transaction.productItemIds,
      status: transaction.status,
      type: transaction.type,
      description: transaction.description,
      metadata: transaction.metadata,
      paymentMethodDetails: transaction.paymentMethodDetails,
      receiptEmail: transaction.receiptEmail,
      refundId: transaction.refundId,
      refundAmount: transaction.refundAmount,
      refundReason: transaction.refundReason,
      disputeId: transaction.disputeId,
      disputeStatus: transaction.disputeStatus,
      disputeAmount: transaction.disputeAmount,
      error: transaction.error,
      transactionDate: transaction.createdAt?.toISOString(),
      createdAt: transaction.createdAt?.toISOString(),
      updatedAt: transaction.updatedAt?.toISOString()
    };
  }

  async findByPaymentIntentId(paymentIntentId: string) {
    try {
      const transaction = await this.transactionModel.findOne({ 
        paymentIntentId: paymentIntentId 
      });
      
      return transaction;
    } catch (error) {
      console.error(`Error finding transaction by payment intent ID ${paymentIntentId}:`, error);
      throw new InternalServerErrorException('Failed to find transaction by payment intent ID');
    }
  }
  
  async updateTransactionStatusByPaymentIntentId(
    paymentIntentId: string, 
    status: TransactionStatus,
    additionalData: Partial<TransactionSchemaClass> = {}
  ) {
    try {
      const transaction = await this.transactionModel.findOneAndUpdate(
        { paymentIntentId: paymentIntentId },
        { 
          $set: {
            status,
            ...additionalData,
            updatedAt: new Date()
          }
        },
        { new: true }
      );
      
      if (!transaction) {
        throw new NotFoundException(`Transaction with payment intent ID ${paymentIntentId} not found`);
      }
      
      console.log(`Updated transaction ${transaction._id} with new status ${status} and additional data`);
      return transaction;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error updating transaction by payment intent ID ${paymentIntentId}:`, error);
      throw new InternalServerErrorException('Failed to update transaction status by payment intent ID');
    }
  }

  async addPartialRefund({
    transactionId,
    ticketId,
    refundId,
    amount,
    reason
  }: {
    transactionId: string;
    ticketId: string;
    refundId: string;
    amount: number;
    reason?: string;
  }): Promise<any> {
    try {
      // Create the partial refund entry
      const partialRefund = {
        ticketId,
        refundId,
        amount,
        reason,
        refundedAt: new Date()
      };
      
      // Update the transaction to add this refund to the partialRefunds array
      const updatedTransaction = await this.transactionModel.findByIdAndUpdate(
        transactionId,
        { 
          $push: { partialRefunds: partialRefund },
          // If this is the first partial refund, update status to partially refunded
          $set: { 
            status: TransactionStatus.PARTIALLY_REFUNDED,
            updatedAt: new Date()
          }
        },
        { new: true }
      );
      
      if (!updatedTransaction) {
        throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
      }
      
      console.log(`Added partial refund of ${amount/100} for ticket ${ticketId} to transaction ${transactionId}`);
      return updatedTransaction;
    } catch (error) {
      console.error(`Error adding partial refund to transaction ${transactionId}:`, error);
      throw new InternalServerErrorException('Failed to record partial refund');
    }
  }

  async findByVendorId(vendorId: string) {
    try {
      const transactions = await this.transactionModel
        .find({
          'metadata.items': {
            $regex: `"vendorId":"${vendorId}"`,
          }
        })
        .sort({ createdAt: -1 });
  
      // Now we need to filter the items to only show the relevant ones for this vendor
      const filteredTransactions = transactions.map(transaction => {
        if (!transaction.metadata){
          console.log("ERROR: No metadata in Transaction Found. Contact Niko Now!");
          throw new InternalServerErrorException('No metadata in Transaction Found.');
        }
        const parsedItems = JSON.parse(transaction.metadata.items || '[]');

        const vendorItems = parsedItems.filter(item => item.vendorId === vendorId);
        
        return {
          ...this.transformTransaction(transaction),
          metadata: {
            ...transaction.metadata,
            items: JSON.stringify(vendorItems)
          }
        };
      });
  
      return {
        data: filteredTransactions,
      };
    } catch (error) {
      console.error('Error finding transactions for vendor:', error);
      throw new InternalServerErrorException('Failed to fetch vendor transactions');
    }
  }

  async findByCustomerId(customerId: string) {
    return this.transactionModel.find({ customerId }).sort({ createdAt: -1 });
  }

  async findWithPagination(
    filters: TransactionFilters,
    paginationOptions: PaginationOptions
  ) {
    const query: any = {};
  
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }
  
    if (filters.status?.length) {
      query.status = { $in: filters.status };
    }
  
    if (filters.type?.length) {
      query.type = { $in: filters.type };
    }
  
    if (filters.minAmount || filters.maxAmount) {
      query.amount = {};
      if (filters.minAmount) {
        query.amount.$gte = filters.minAmount;
      }
      if (filters.maxAmount) {
        query.amount.$lte = filters.maxAmount;
      }
    }
  
    const total = await this.transactionModel.countDocuments(query);
    const totalPages = Math.ceil(total / paginationOptions.limit);
  
    const sortOptions: any = {};
    if (paginationOptions.sortBy) {
      sortOptions[paginationOptions.sortBy] = paginationOptions.sortOrder === 'desc' ? -1 : 1;
    }
  
    const transactions = await this.transactionModel
      .find(query)
      .sort(sortOptions)
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit)
      .lean();
  
    return {
      data: transactions,
      total,
      page: paginationOptions.page,
      limit: paginationOptions.limit,
      totalPages,
      hasMore: paginationOptions.page < totalPages
    };
  }
  
  async getTransactionStats(vendorId?: string) {
    const match: any = {};
    if (vendorId) {
      match.vendorId = vendorId;
    }
  
    return this.transactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          successfulTransactions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'succeeded'] }, 1, 0]
            }
          },
          disputedAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'disputed'] }, '$amount', 0]
            }
          }
        }
      }
    ]);
  }

}
