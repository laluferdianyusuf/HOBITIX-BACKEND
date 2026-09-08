import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { EventType } from '../../generated/prisma/enums.js';

export class CreateEventDto {
  @IsUUID()
  organizerId: string;

  @IsUUID()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  description: string;

  @IsEnum(EventType)
  eventType: EventType;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsString()
  timezone: string;

  @IsOptional()
  location?: {
    venueName: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
  };
}
