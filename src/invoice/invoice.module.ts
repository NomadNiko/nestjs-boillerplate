import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { TransactionSchemaClass, TransactionSchema } from '../transactions/infrastructure/persistence/document/entities/transaction.schema';
import { VendorModule } from '../vendors/vendor.module';
import { UserSchemaClass, UserSchema } from '../users/infrastructure/persistence/document/entities/user.schema';
import { VendorSchemaClass, VendorSchema } from '../vendors/infrastructure/persistence/document/entities/vendor.schema';
import { ProductItemSchemaClass, ProductItemSchema } from '../product-item/infrastructure/persistence/document/entities/product-item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TransactionSchemaClass.name, schema: TransactionSchema },
      { name: UserSchemaClass.name, schema: UserSchema },
      { name: VendorSchemaClass.name, schema: VendorSchema },
      { name: ProductItemSchemaClass.name, schema: ProductItemSchema }
    ]),
    VendorModule
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService]
})
export class InvoiceModule {}