import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupportTicketDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ticketCategory: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ticketTitle: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ticketDescription: string;
}