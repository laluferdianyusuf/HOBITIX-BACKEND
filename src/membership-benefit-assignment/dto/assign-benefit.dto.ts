import { IsUUID } from 'class-validator';

export class AssignBenefitDto {
  @IsUUID()
  benefitId: string;
}
