import {
  IsBoolean,
  IsDate,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { EventStatus, EventType } from '../../generated/prisma/enums.js';
import { Type } from 'class-transformer';
import {
  CreateEventLocationDto,
  CreateEventOnlineAccessDto,
  CreateTicketTypeDto,
} from './eventLocation.dto.js';

export class CreateEventDto {
  @IsUUID()
  categoryId: string;

  @IsUUID()
  organizerId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(EventType)
  eventType: EventType;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsString()
  @IsNotEmpty()
  timezone: string;

  //   @IsOptional()
  //   @ValidateNested()
  //   @Type(() => CreateEventLocationDto)
  //   location?: CreateEventLocationDto;

  //   @IsOptional()
  //   @ValidateNested()
  //   @Type(() => CreateEventOnlineAccessDto)
  //   onlineAccess?: CreateEventOnlineAccessDto;

  //   @IsOptional()
  //   @ValidateNested({ each: true })
  //   @Type(() => CreateTicketTypeDto)
  //   ticketTypes?: CreateTicketTypeDto[];

  @IsEnum(EventStatus)
  status: EventStatus;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
