import { Controller, Get, Param, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { InvoiceResponseDto } from './dto/invoice.dto';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all invoices for a user' })
  @ApiResponse({ status: 200, type: [InvoiceResponseDto] })
  async getUserInvoices(@Param('userId') userId: string, @Request() req) {
    // Users can only view their own invoices unless they're an admin
    if (req.user.id === userId || req.user.role?.id === 1) {
      return this.invoiceService.findByCustomerId(userId);
    }
    return [];
  }

  @Get('vendor/:vendorId')
  @ApiOperation({ summary: 'Get all invoices for a vendor' })
  @ApiResponse({ status: 200, type: [InvoiceResponseDto] })
  async getVendorInvoices(@Param('vendorId') vendorId: string, @Request() req) {
    if (req.user.role?.id === 1 || await this.invoiceService.isUserAssociatedWithVendor(req.user.id, vendorId)) {
      return this.invoiceService.findByVendorId(vendorId);
    }
    return [];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  async getInvoice(@Param('id') id: string, @Request() req) {
    const invoice = await this.invoiceService.findById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Check access permissions
    const hasAccess = 
      req.user.role?.id === 1 || // Admin
      req.user.id === invoice.customerId;
    if (!hasAccess) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }
}