import { Controller, Get, Post, Patch, Query, Body, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { TransactionSchemaClass, TransactionStatus, TransactionType } from './infrastructure/persistence/document/entities/transaction.schema';
import { RoleEnum } from 'src/roles/roles.enum';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  async createTransaction(@Body() transactionData: Partial<TransactionSchemaClass>) {
    return this.transactionService.create(transactionData);
  }

  @Get('checkout/:sessionId')
  @ApiOperation({ summary: 'Get transaction by checkout session ID' })
  @ApiResponse({ status: 200, description: 'Returns the transaction' })
  async getByCheckoutSession(@Param('sessionId') sessionId: string) {
    return this.transactionService.findByCheckoutSessionId(sessionId);
  }

  @Patch('checkout/:sessionId/status')
  @ApiOperation({ summary: 'Update transaction status' })
  @ApiResponse({ status: 200, description: 'Transaction status updated' })
  async updateStatus(
    @Param('sessionId') sessionId: string,
    @Body() updateData: {
      status: TransactionStatus;
      additionalData?: Partial<TransactionSchemaClass>;
    }
  ) {
    return this.transactionService.updateTransactionStatus(
      sessionId,
      updateData.status,
      updateData.additionalData
    );
  }

  @Get('vendor/:vendorId')
  @ApiOperation({ summary: 'Get transactions by vendor ID' })
  @ApiResponse({ status: 200, description: 'Returns vendor transactions' })
  async getVendorTransactions(@Param('vendorId') vendorId: string) {
    return this.transactionService.findByVendorId(vendorId);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get transactions by customer ID' })
  @ApiResponse({ status: 200, description: 'Returns customer transactions' })
  async getCustomerTransactions(
    @Param('customerId') customerId: string,
    @Request() req
  ) {
    // Security check: users can only see their own transactions
    if (req.user.id !== customerId && req.user.role?.id !== RoleEnum.admin) {
      throw new UnauthorizedException('Not authorized to view these transactions');
    }
    return this.transactionService.findByCustomerId(customerId);
  }

  @Get()
  @ApiOperation({ summary: 'Get transactions with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated transactions' })
  async getTransactions(
    @Query() filters: {
      startDate?: Date;
      endDate?: Date;
      status?: TransactionStatus[];
      type?: TransactionType[];
      minAmount?: number;
      maxAmount?: number;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      ...transactionFilters
    } = filters;

    return this.transactionService.findWithPagination(
      transactionFilters,
      {
        page: Number(page),
        limit: Number(limit),
        sortBy,
        sortOrder
      }
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get transaction statistics' })
  @ApiResponse({ status: 200, description: 'Returns transaction stats' })
  async getStats(@Query('vendorId') vendorId?: string) {
    const stats = await this.transactionService.getTransactionStats(vendorId);
    return stats[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      successfulTransactions: 0,
      disputedAmount: 0
    };
  }
}