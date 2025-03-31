import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PayoutSchemaClass, PayoutStatus } from './infrastructure/persistence/document/entities/payout.schema';
import { CreatePayoutDto, UpdatePayoutDto } from './dto/payout.dto';

@Injectable()
export class PayoutService {
  constructor(
    @InjectModel(PayoutSchemaClass.name)
    private readonly payoutModel: Model<PayoutSchemaClass>
  ) {}

  async create(createPayoutDto: CreatePayoutDto) {
    try {
      const payout = new this.payoutModel(createPayoutDto);
      const savedPayout = await payout.save();
      return this.transformPayout(savedPayout);
    } catch (error) {
      console.error('Error creating payout:', error);
      throw new InternalServerErrorException('Failed to create payout');
    }
  }

  async update(id: string, updateData: UpdatePayoutDto) {
    try {
      const updatedPayout = await this.payoutModel
        .findByIdAndUpdate(
          id, 
          { $set: updateData }, 
          { new: true, runValidators: true }
        );

      if (!updatedPayout) {
        throw new NotFoundException('Payout not found');
      }

      return this.transformPayout(updatedPayout);
    } catch (error) {
      console.error('Error updating payout:', error);
      throw new InternalServerErrorException('Failed to update payout');
    }
  }

  async findByVendor(vendorId: string) {
    try {
      const payouts = await this.payoutModel
        .find({ vendorId })
        .sort({ createdAt: -1 });
  
      return {
        data: payouts.map(this.transformPayout)
      };
    } catch (error) {
      console.error('Error finding payouts:', error);
      throw new InternalServerErrorException('Failed to fetch payouts');
    }
  }

  private transformPayout(payout: any) {
    return {
      _id: payout._id.toString(),
      vendorId: payout.vendorId,
      amount: payout.amount,
      status: payout.status,
      stripeTransferDetails: payout.stripeTransferDetails,
      description: payout.description,
      error: payout.error,
      processedAt: payout.processedAt?.toISOString(),
      createdAt: payout.createdAt?.toISOString(),
      updatedAt: payout.updatedAt?.toISOString()
    };
  }
  async findById(id: string) {
    try {
      const payout = await this.payoutModel.findById(id).lean();
      
      if (!payout) {
        throw new NotFoundException('Payout not found');
      }

      return {
        data: this.transformPayout(payout),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error finding payout:', error);
      throw new InternalServerErrorException('Failed to fetch payout');
    }
  }
  async getPayoutStats(vendorId: string) {
    try {
      const stats = await this.payoutModel.aggregate([
        { $match: { vendorId } },
        {
          $group: {
            _id: null,
            totalPayouts: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            successfulPayouts: {
              $sum: { $cond: [{ $eq: ['$status', PayoutStatus.SUCCEEDED] }, 1, 0] },
            },
            failedPayouts: {
              $sum: { $cond: [{ $eq: ['$status', PayoutStatus.FAILED] }, 1, 0] },
            },
            lastPayout: { $max: '$createdAt' },
          },
        },
      ]);

      return {
        data: stats[0] || {
          totalPayouts: 0,
          totalAmount: 0,
          successfulPayouts: 0,
          failedPayouts: 0,
          lastPayout: null,
        },
      };
    } catch (error) {
      console.error('Error getting payout stats:', error);
      throw new InternalServerErrorException('Failed to get payout statistics');
    }
  }
}