import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  VendorSchemaClass,
  VendorSchemaDocument,
} from '../infrastructure/persistence/document/entities/vendor.schema';
import { CreateVendorDto } from '../dto/create-vendor.dto';
import { UpdateVendorDto } from '../dto/update-vendor.dto';
import { transformVendorResponse } from '../../utils/vendor.transform';
import { UserSchemaClass } from 'src/users/infrastructure/persistence/document/entities/user.schema';
import { MailService } from '../../mail/mail.service';
import { VendorEmailData } from '../../mail/interfaces/vendor-email-data.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VendorCrudService {
  constructor(
    @InjectModel(VendorSchemaClass.name)
    private readonly vendorModel: Model<VendorSchemaDocument>,
    @InjectModel(UserSchemaClass.name)
    private readonly userModel: Model<UserSchemaClass>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async findAll() {
    const vendors = await this.vendorModel.find().select('-__v').lean().exec();

    return {
      data: vendors.map((vendor) => transformVendorResponse(vendor)),
    };
  }

  async findAllApproved() {
    const vendors = await this.vendorModel
      .find({
        vendorStatus: 'APPROVED',
      })
      .select('-__v')
      .lean()
      .exec();

    return {
      data: vendors.map((vendor) => transformVendorResponse(vendor)),
    };
  }

  async findById(id: string) {
    const vendor = await this.vendorModel.findById(id).lean().exec();

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return {
      data: transformVendorResponse(vendor),
    };
  }

  async create(createVendorDto: CreateVendorDto, userId: string) {
    const session = await this.vendorModel.db.startSession();

    try {
      let result;
      await session.withTransaction(async () => {
        // Existing vendor creation code...
        const createdVendor = new this.vendorModel({
          ...createVendorDto,
          vendorStatus: 'SUBMITTED',
          ownerIds: [userId],
        });
        const savedVendor = await createdVendor.save({ session });
        const plainVendor = savedVendor.toObject();

        // Find and update user
        const user = await this.userModel.findById(userId).session(session);
        if (!user) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // Update role if needed
        if (user.role?._id !== '1' && user.role?._id !== '3') {
          await this.userModel.findByIdAndUpdate(
            userId,
            {
              'role._id': '4',
              updatedAt: new Date(),
              // Add the new vendor ID to the user's vendorProfileIds
              $addToSet: { vendorProfileIds: savedVendor._id },
            },
            {
              session,
              runValidators: true,
            },
          );
        } else {
          // Just update vendorProfileIds if role doesn't need to change
          await this.userModel.findByIdAndUpdate(
            userId,
            {
              $addToSet: { vendorProfileIds: savedVendor._id },
              updatedAt: new Date(),
            },
            {
              session,
              runValidators: true,
            },
          );
        }

        result = {
          data: transformVendorResponse(plainVendor),
          message: 'Vendor created successfully',
        };

        // After successful vendor creation, send email notification
        // We'll call this outside the transaction to prevent it from blocking vendor creation
        // if email sending fails
      });

      // If we got here, transaction was successful, now send email notification
      if (result && result.data) {
        const vendor = await this.vendorModel.findById(result.data._id);
        if (vendor) {
          // Send notification emails to all owners
          await this.notifyOwnersOfVendorCreation(vendor);
        }
      }

      return result;
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw new InternalServerErrorException('Failed to create vendor');
    } finally {
      await session.endSession();
    }
  }

  

  async update(id: string, updateData: any) {
    try {
      // Check if the update data contains operators like $inc
      const hasOperators = Object.keys(updateData).some((key) =>
        key.startsWith('$'),
      );

      // If using MongoDB operators directly, don't wrap in $set
      const updateOperation = hasOperators ? updateData : { $set: updateData };

      const updatedVendor = await this.vendorModel
        .findByIdAndUpdate(id, updateOperation, {
          new: true,
          runValidators: true,
        })
        .lean()
        .exec();

      if (!updatedVendor) {
        throw new NotFoundException(`Vendor with ID ${id} not found`);
      }

      return {
        data: transformVendorResponse(updatedVendor),
        message: 'Vendor updated successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error updating vendor:', error);
      throw new InternalServerErrorException('Failed to update vendor');
    }
  }

  async remove(id: string) {
    try {
      const vendor = await this.vendorModel.findById(id);

      if (!vendor) {
        throw new NotFoundException(`Vendor with ID ${id} not found`);
      }

      await this.vendorModel.findByIdAndDelete(id);

      return {
        message: 'Vendor deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting vendor:', error);
      throw new InternalServerErrorException('Failed to delete vendor');
    }
  }

  private async notifyOwnersOfVendorCreation(
    vendor: VendorSchemaClass,
  ): Promise<void> {
    try {
      for (const ownerId of vendor.ownerIds) {
        const user = await this.userModel.findById(ownerId);
        if (!user || !user.email) continue;

        const userName =
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

        // Prepare vendor status URL
        const frontendDomain = this.configService.get('app.frontendDomain', {
          infer: true,
        });
        const vendorStatusUrl = `${frontendDomain}/vendor-status`;

        // Check if vendor has templates or products (for email steps)
        const hasTemplates = false; // This would need to be implemented with actual template check
        const hasProducts = false; // This would need to be implemented with actual product check

        // Prepare email data
        const emailData: VendorEmailData = {
          vendorId: (vendor as any)._id.toString(), // Changed this line
          vendorName: vendor.businessName,
          vendorStatus: vendor.vendorStatus,
          userName,
          eventType: 'created',
          vendorStatusUrl,
          onboardingSteps: {
            profileComplete: true,
            hasTemplates,
            hasProducts,
            stripeComplete: vendor.stripeConnectId ? true : false,
            approved: vendor.vendorStatus === 'APPROVED',
          },
        };

        // Send email
        await this.mailService.sendVendorCreatedEmail({
          to: user.email,
          data: emailData,
        });

        console.log(
          `Vendor creation email sent to ${user.email} for vendor ${vendor.businessName}`,
        );
      }
    } catch (error) {
      console.error('Error sending vendor creation emails:', error);
      // Don't throw error to prevent disrupting vendor creation
    }
  }
}
