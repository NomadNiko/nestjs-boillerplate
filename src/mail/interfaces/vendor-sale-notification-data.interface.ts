export interface VendorSaleNotificationData {
    vendorName: string;
    customerName: string;
    transactionId: string;
    purchaseDate: string;
    vendorItemsTotal: number;
    vendorEarnings: number;
    platformFee: number;
    feePercentage: number;
    items: Array<{
      productName: string;
      quantity: number;
      price: number;
      date?: string;
      time?: string;
      ticketId: string;
    }>;
    vendorDashboardUrl: string;
    ticketManagementUrl: string;
  }