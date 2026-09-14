import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';
import { CreateAttendeeDto } from '../../attendee/dto/create-attendee.dto.js';

export class CreateOrderItemDto {
  @IsUUID()
  ticketTypeId: string;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateAttendeeDto)
  attendees: CreateAttendeeDto[];
}
