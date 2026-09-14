import { IsEnum } from 'class-validator';
import { OrganizerMemberRole } from '../../generated/prisma/enums.js';

export class UpdateMemberRoleDto {
  @IsEnum(OrganizerMemberRole)
  role: OrganizerMemberRole;
}
