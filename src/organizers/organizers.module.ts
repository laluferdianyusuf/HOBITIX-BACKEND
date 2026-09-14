import { Module } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { OrganizerOwnerGuard } from '../common/guards/organizer-owner.guard.js';
import { OrganizerController } from './organizers.controller.js';
import { OrganizerService } from './organizers.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [OrganizerController],

  providers: [OrganizerService, OrganizerOwnerGuard, AdminGuard],

  exports: [OrganizerService],
})
export class OrganizerModule {}
