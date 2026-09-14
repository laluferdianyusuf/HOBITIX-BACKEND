import { Module } from '@nestjs/common';
import { MembershipBenefitController } from './membership-benefit.controller.js';
import { MembershipBenefitService } from './membership-benefit.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [MembershipBenefitController],

  providers: [MembershipBenefitService],

  exports: [MembershipBenefitService],
})
export class MembershipBenefitModule {}
