import { IsEmail, IsEnum } from 'class-validator';
import { OrganizerMemberRole } from '../../generated/prisma/enums.js';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(OrganizerMemberRole)
  role: OrganizerMemberRole;
}
