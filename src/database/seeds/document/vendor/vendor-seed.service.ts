import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VendorSchemaClass, VendorStatusEnum } from '../../../../vendors/infrastructure/persistence/document/entities/vendor.schema';

@Injectable()
export class VendorSeedService {
  constructor(
    @InjectModel(VendorSchemaClass.name)
    private readonly vendorModel: Model<VendorSchemaClass>,
  ) {}

  async run() {
    const count = await this.vendorModel.countDocuments();

    if (count === 0) {
      await this.vendorModel.create([
        {
          businessName: 'Moku Hawaii',
          description: 'Surfing Lessons - Provides surfboard, bodyboard & stand-up paddleboard rentals, plus lessons & gear.',
          vendorType: 'lessons',
          website: 'https://www.mokuhawaii.surf/',
          email: 'lesson@mokuhawaii.surf',
          phone: '808-230-9889',
          address: '2446 Koa Ave',
          city: 'Honolulu',
          state: 'HI',
          postalCode: '96815',
          latitude: 21.2758128,
          longitude: -157.8241926,
          logoUrl: 'https://bf421f42b27d62f55bfd.cdn6.editmysite.com/uploads/b/bf421f42b27d62f55bfd1dca712b7c5ae02660ec3e27cfd380a049008576b989/MOKU_1645564224.png',
          vendorStatus: VendorStatusEnum.APPROVED,
          adminNotes: 'Approved on initial seed'
        },
        // Add other vendors here...
      ]);
    }
  }
}