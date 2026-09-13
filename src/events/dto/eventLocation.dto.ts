import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  TicketAccessType,
  TicketStatus,
} from '../../generated/prisma/enums.js';

export class CreateEventLocationDto {
  @IsString()
  @IsNotEmpty()
  venueName: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

export class CreateEventOnlineAccessDto {
  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsString()
  @IsNotEmpty()
  accessUrl: string;

  @IsString()
  @IsNotEmpty()
  accessPassword: string;

  @IsDateString()
  accessStartAt: string;

  @IsDateString()
  accessEndAt: string;
}

export class CreateTicketTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  minPerOrder?: number;

  @IsOptional()
  @IsNumber()
  maxPerOrder?: number;

  @IsDateString()
  saleStartAt: string;

  @IsDateString()
  saleEndAt: string;

  @IsEnum(TicketAccessType)
  accessType: TicketAccessType;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}
