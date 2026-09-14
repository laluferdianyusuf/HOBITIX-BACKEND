import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  OrganizerType,
  SettlementSchedule,
} from '../../generated/prisma/enums.js';

export class CreateOrganizerDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsEnum(OrganizerType)
  type: OrganizerType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  @IsEnum(SettlementSchedule)
  settlementSchedule?: SettlementSchedule;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  settlementDelayDays?: number;
}
