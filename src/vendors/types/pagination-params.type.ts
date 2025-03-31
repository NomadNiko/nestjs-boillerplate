import { SortOrder, VendorSortField } from "../dto/vendor-pagination.dto";

export interface VendorPaginationParams {
    page: number;
    pageSize: number;
    sortField: VendorSortField;
    sortOrder: SortOrder;
    search?: string;
    type?: string;
    status?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  }