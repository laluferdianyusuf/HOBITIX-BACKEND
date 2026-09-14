import { Module } from '@nestjs/common';
import { OrganizerMemberController } from './organizer-member.controller.js';
import { OrganizerMemberService } from './organizer-member.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [OrganizerMemberController],

  providers: [OrganizerMemberService],

  exports: [OrganizerMemberService],
})
export class OrganizerMemberModule {}
