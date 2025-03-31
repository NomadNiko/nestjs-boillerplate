import { ProductItemStatusEnum } from '../infrastructure/persistence/document/entities/product-item.schema';

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number];
}

export interface ProductItemBase {
  templateId: string;
  vendorId: string;
  productDate: Date;
  startTime: string;
  duration: number;
  price: number;
  quantityAvailable: number;
  location: GeoLocation;
  templateName: string;
  description: string;
  productType: string;
  requirements: string[];
  waiver: string;
  itemStatus: ProductItemStatusEnum;
  imageURL?: string;
  additionalInfo?: string;
  instructorName?: string;
  tourGuide?: string;
  equipmentSize?: string;
  notes?: string;
}

export interface ProductItemResponse extends Omit<ProductItemBase, 'productDate'> {
  _id: string;
  productDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductItemDto extends Omit<ProductItemBase, 'itemStatus'> {
  longitude: number;
  latitude: number;
}

export interface UpdateProductItemDto extends Partial<CreateProductItemDto> {
  itemStatus?: ProductItemStatusEnum;
}

export interface AvailabilityCalendarTimeSlot {
  startTime: string;
  available: boolean;
  quantityAvailable: number;
}

export interface AvailabilityCalendarDay {
  date: string;
  timeSlots: AvailabilityCalendarTimeSlot[];
}

export interface BulkAvailabilityRequest {
  productItemId: string;
  quantity: number;
  date?: Date;
}

export interface BulkAvailabilityResponse {
  available: boolean;
  unavailableItems: Array<{
    productItemId: string;
    reason: string;
  }>;
}

export interface DateRangeAvailability {
  date: string;
  available: boolean;
  quantityAvailable: number;
}

export interface ServiceResponse<T> {
  data: T;
  message?: string;
}

export interface QueryResponse<T> {
  data: T[];
}