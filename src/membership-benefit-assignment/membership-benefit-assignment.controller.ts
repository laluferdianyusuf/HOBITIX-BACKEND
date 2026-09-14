import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { AssignBenefitDto } from './dto/assign-benefit.dto.js';
import { MembershipBenefitAssignmentService } from './membership-benefit-assignment.service.js';

@Controller('membership-accounts')
@UseGuards(JwtAuthGuard)
export class MembershipBenefitAssignmentController {
  constructor(private readonly service: MembershipBenefitAssignmentService) {}

  @Get(':membershipId/benefits')
  findByMembership(@Param('membershipId') membershipId: string) {
    return this.service.findByMembership(membershipId);
  }

  @Post(':membershipId/benefits')
  @UseGuards(AdminGuard)
  assign(
    @Param('membershipId') membershipId: string,
    @Body() dto: AssignBenefitDto,
  ) {
    return this.service.assign(membershipId, dto.benefitId);
  }

  @Delete(':membershipId/benefits/:benefitId')
  @UseGuards(AdminGuard)
  remove(
    @Param('membershipId') membershipId: string,
    @Param('benefitId') benefitId: string,
  ) {
    return this.service.remove(membershipId, benefitId);
  }
}
