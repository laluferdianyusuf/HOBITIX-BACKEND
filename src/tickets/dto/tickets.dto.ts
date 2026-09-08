import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsBoolean,
  IsDateString,
} from 'class-validator';

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

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  totalQuantity: number;

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
