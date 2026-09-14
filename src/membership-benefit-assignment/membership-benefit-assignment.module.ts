import { Module } from '@nestjs/common';
import { MembershipBenefitAssignmentController } from './membership-benefit-assignment.controller.js';
import { MembershipBenefitAssignmentService } from './membership-benefit-assignment.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [MembershipBenefitAssignmentController],

  providers: [MembershipBenefitAssignmentService],

  exports: [MembershipBenefitAssignmentService],
})
export class MembershipBenefitAssignmentModule {}
