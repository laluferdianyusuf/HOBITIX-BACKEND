import { Module } from '@nestjs/common';
import { OrganizerMemberController } from './organizer-member.controller.js';
import { OrganizerMemberService } from './organizer-member.service.js';

@Module({
  controllers: [OrganizerMemberController],

  providers: [OrganizerMemberService],

  exports: [OrganizerMemberService],
})
export class OrganizerMemberModule {}
