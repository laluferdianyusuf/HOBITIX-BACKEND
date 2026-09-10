import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsBoolean,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { TicketAccessType } from '../../generated/prisma/enums.js';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateTicketTypeDto {
  @IsUUID()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TicketAccessType)
  @IsNotEmpty()
  accessType: TicketAccessType;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsNumber()
  @Min(1)
  totalQuantity: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minPerOrder?: number;

  @IsNumber()
  @Min(1)
  maxPerOrder: number;

  @IsDateString()
  salesStartAt: string;

  @IsDateString()
  salesEndAt: string;

  @IsBoolean()
  @IsOptional()
  isPresale?: boolean;
}
