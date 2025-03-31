export interface TransactionFilters {
    startDate?: Date;
    endDate?: Date;
    status?: string[];
    type?: string[];
    minAmount?: number;
    maxAmount?: number;
  }