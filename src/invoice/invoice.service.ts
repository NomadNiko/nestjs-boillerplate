import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionSchemaClass } from '../transactions/infrastructure/persistence/document/entities/transaction.schema';
import { UserSchemaClass } from '../users/infrastructure/persistence/document/entities/user.schema';
import { VendorSchemaClass } from '../vendors/infrastructure/persistence/document/entities/vendor.schema';
import { ProductItemSchemaClass } from '../product-item/infrastructure/persistence/document/entities/product-item.schema';
import { VendorService } from '../vendors/vendor.service';
import { InvoiceResponseDto } from './dto/invoice.dto';

interface CartItemMetadata {
  productItemId: string;
  vendorId: string;
  quantity: number;
  price: number;
  productDate: string;
  productStartTime: string;
  productDuration: number;
}

interface VendorInvoiceGroup {
  vendorId: string;
  vendorName: string;
  subtotal: number;
  items: any[];
}

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(TransactionSchemaClass.name)
    private readonly transactionModel: Model<TransactionSchemaClass>,
    @InjectModel(UserSchemaClass.name)
    private readonly userModel: Model<UserSchemaClass>,
    @InjectModel(VendorSchemaClass.name)
    private readonly vendorModel: Model<VendorSchemaClass>,
    @InjectModel(ProductItemSchemaClass.name)
    private readonly productItemModel: Model<ProductItemSchemaClass>,
    private readonly vendorService: VendorService,
  ) {}

  async findById(id: string): Promise<InvoiceResponseDto | null> {
    const transaction = await this.transactionModel.findById(id).lean();
    if (!transaction) {
      return null;
    }
    return this.transformToInvoice(transaction);
  }

  async findByCustomerId(customerId: string): Promise<InvoiceResponseDto[]> {
    const transactions = await this.transactionModel
      .find({
        customerId,
        type: 'payment',
        status: 'succeeded',
      })
      .sort({ createdAt: -1 })
      .lean();

    return Promise.all(transactions.map((t) => this.transformToInvoice(t)));
  }

  async findByVendorId(vendorId: string): Promise<InvoiceResponseDto[]> {
    const transactions = await this.transactionModel
      .find({
        'metadata.items': {
          $regex: `"vendorId":"${vendorId}"`,
        },
        type: 'payment',
        status: 'succeeded',
      })
      .sort({ createdAt: -1 })
      .lean();

    return Promise.all(transactions.map(async (t) => {
      const invoice = await this.transformToInvoice(t);
      // Filter items to only show this vendor's items
      const vendorGroup = invoice.vendorGroups.find(g => g.vendorId === vendorId);
      return {
        ...invoice,
        vendorGroups: vendorGroup ? [vendorGroup] : [],
        amount: vendorGroup?.subtotal || 0
      };
    }));
  }

  async isUserAssociatedWithVendor(
    userId: string,
    vendorId: string,
  ): Promise<boolean> {
    return this.vendorService.isUserAssociatedWithVendor(userId, vendorId);
  }

  private parseCartItemsMetadata(metadata: any): CartItemMetadata[] {
    try {
      if (!metadata?.items) {
        return [];
      }
      const items = JSON.parse(metadata.items);
      return items.map(item => ({
        productItemId: item.productItemId,
        vendorId: item.vendorId,
        quantity: item.quantity,
        price: item.price,
        productDate: item.productDate,
        productStartTime: item.productStartTime,
        productDuration: item.productDuration
      }));
    } catch (error) {
      console.error('Error parsing cart items metadata:', error);
      return [];
    }
  }

  private async transformToInvoice(transaction: any): Promise<InvoiceResponseDto> {
    // Get customer details
    const customer = await this.userModel.findById(transaction.customerId).lean();
    const customerName = customer 
      ? `${customer.firstName} ${customer.lastName}`.trim()
      : 'Unknown Customer';

    // Parse cart items from metadata
    const cartItems = this.parseCartItemsMetadata(transaction.metadata);

    // Get all unique vendor IDs from cart items
    const vendorIds = [...new Set(cartItems.map(item => item.vendorId))];

    // Get all vendors in one query
    const vendors = await this.vendorModel.find({
      _id: { $in: vendorIds }
    }).lean();
    const vendorMap = vendors.reduce((acc, vendor) => {
      acc[vendor._id.toString()] = vendor.businessName;
      return acc;
    }, {});

    // Get all products in one query
    const productItemIds = cartItems.map(item => item.productItemId);
    const products = await this.productItemModel.find({
      _id: { $in: productItemIds }
    }).lean();
    const productMap = products.reduce((acc, product) => {
      acc[product._id.toString()] = product.templateName;
      return acc;
    }, {});

    // Group items by vendor
    const vendorGroups: VendorInvoiceGroup[] = vendorIds.map(vendorId => {
      const vendorItems = cartItems
        .filter(item => item.vendorId === vendorId)
        .map(item => ({
          productItemId: item.productItemId,
          productName: productMap[item.productItemId] || 'Unknown Product',
          price: item.price,
          quantity: item.quantity,
          productDate: item.productDate,
          productStartTime: item.productStartTime,
          productDuration: item.productDuration
        }));

      const subtotal = vendorItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );

      return {
        vendorId,
        vendorName: vendorMap[vendorId] || 'Unknown Vendor',
        subtotal,
        items: vendorItems
      };
    });

    return {
      _id: transaction._id.toString(),
      stripeCheckoutSessionId: transaction.stripeCheckoutSessionId,
      amount: transaction.amount / 100,
      currency: transaction.currency,
      customerId: transaction.customerId,
      customerName,
      productItemIds,
      vendorGroups,
      status: transaction.status,
      type: transaction.type,
      invoiceDate: transaction.createdAt?.toISOString(),
      description: `Invoice #${transaction._id.toString().slice(-6)}`
    };
  }
}