import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { MembershipService } from './membership.service.js';

@Controller('memberships')
@UseGuards(JwtAuthGuard)
export class MembershipController {
  constructor(private readonly service: MembershipService) {}

  @Post()
  create(@Req() req: any) {
    return this.service.create(req.user.id);
  }

  @Get('me')
  findMyMembership(@Req() req: any) {
    return this.service.findMyMembership(req.user.id);
  }
}
