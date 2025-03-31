import { PartialType } from '@nestjs/swagger';
import { CreateSupportTicketDto } from './support-ticket.dto';

export class UpdateSupportTicketDto extends PartialType(CreateSupportTicketDto) {}
