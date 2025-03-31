import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { TransactionSchemaClass, TransactionSchema } from './infrastructure/persistence/document/entities/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TransactionSchemaClass.name, schema: TransactionSchema }
    ])
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService]
})
export class TransactionModule {}