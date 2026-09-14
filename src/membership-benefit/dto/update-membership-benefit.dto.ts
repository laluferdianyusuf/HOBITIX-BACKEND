import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MembershipBenefitType } from '../../generated/prisma/enums.js';

export class UpdateMembershipBenefitDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MembershipBenefitType)
  benefitType?: MembershipBenefitType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
