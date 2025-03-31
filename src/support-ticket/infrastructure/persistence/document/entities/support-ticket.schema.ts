import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SupportTicketDocument = HydratedDocument<SupportTicketSchemaClass>;

export enum TicketStatus {
  OPENED = 'OPENED',
  ASSIGNED = 'ASSIGNED',
  HOLD = 'HOLD',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}



@Schema()
export class TicketUpdate {
  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  updateText: string;
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret._id = ret._id.toString();
      delete ret.__v;
      return ret;
    },
    virtuals: true
  }
})
export class SupportTicketSchemaClass {
  @Prop({ 
    required: true, 
    unique: true,
    index: true 
  })
  ticketId: string;

  @Prop({
    type: String,
    enum: TicketStatus,
    default: TicketStatus.OPENED
  })
  status: TicketStatus;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ type: Date, default: Date.now })
  createDate: Date;

  @Prop()
  assignedTo?: string;

  @Prop({ required: true })
  ticketCategory: string;

  @Prop({ required: true })
  ticketTitle: string;

  @Prop({ required: true })
  ticketDescription: string;

  @Prop({ type: [{ type: Object, ref: 'TicketUpdate' }], default: [] })
  updates: TicketUpdate[];
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicketSchemaClass);

// Create a compound index for efficient ticket ID generation
SupportTicketSchema.index({ createDate: -1, ticketId: -1 });