import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { VendorModule } from '../vendors/vendor.module';
import { ProductItemModule } from '../product-item/product-item.module';
import { TicketSchemaClass, TicketSchema } from './infrastructure/persistence/document/entities/ticket.schema';
import { VendorSchema, VendorSchemaClass } from '../vendors/infrastructure/persistence/document/entities/vendor.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TicketSchemaClass.name,
        schema: TicketSchema,
      },
      { 
        name: VendorSchemaClass.name, 
        schema: VendorSchema 
      },
    ]),
    VendorModule,
    ProductItemModule,
  ],
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService],
})
export class TicketModule {}