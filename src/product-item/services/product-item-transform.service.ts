import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductItemTransformService {
  transformItemResponse(item: Record<string, any>) {
    return {
      _id: item._id.toString(),
      templateId: item.templateId,
      vendorId: item.vendorId,
      productDate: item.productDate?.toISOString(),
      startTime: item.startTime,
      duration: item.duration,
      price: item.price,
      quantityAvailable: item.quantityAvailable,
      location: {
        type: 'Point' as const,
        coordinates: [item.longitude, item.latitude] as [number, number],
      },
      itemStatus: item.itemStatus,
      templateName: item.templateName,
      description: item.description,
      productType: item.productType,
      requirements: item.requirements,
      waiver: item.waiver,
      imageURL: item.imageURL,
      additionalInfo: item.additionalInfo,
      instructorName: item.instructorName,
      tourGuide: item.tourGuide,
      equipmentSize: item.equipmentSize,
      notes: item.notes,
      createdAt: item.createdAt?.toISOString(),
      updatedAt: item.updatedAt?.toISOString(),
    };
  }
}