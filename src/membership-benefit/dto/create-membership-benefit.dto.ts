import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MembershipBenefitType } from '../../generated/prisma/enums.js';

export class CreateMembershipBenefitDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(MembershipBenefitType)
  benefitType: MembershipBenefitType;
}
