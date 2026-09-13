import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { InviteMemberDto } from './dto/invite-member.dto.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';
import { OrganizerMemberService } from './organizer-member.service.js';

@Controller('organizers')
@UseGuards(JwtAuthGuard)
export class OrganizerMemberController {
  constructor(private readonly memberService: OrganizerMemberService) {}

  @Post(':organizerId/members/invite')
  invite(
    @Req() req: any,
    @Param('organizerId') organizerId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.memberService.invite(req.user.id, organizerId, dto);
  }

  @Get(':organizerId/members')
  findMembers(@Req() req: any, @Param('organizerId') organizerId: string) {
    return this.memberService.findMembers(req.user.id, organizerId);
  }

  @Get(':organizerId/members/all')
  findAllMembers(@Req() req: any, @Param('organizerId') organizerId: string) {
    return this.memberService.findAllMembers(req.user.id, organizerId);
  }

  @Get('me/invitations')
  findMyInvitations(@Req() req: any) {
    return this.memberService.findMyInvitations(req.user.id);
  }

  @Post('members/:memberId/accept')
  acceptInvitation(@Req() req: any, @Param('memberId') memberId: string) {
    return this.memberService.acceptInvitation(req.user.id, memberId);
  }

  @Post('members/:memberId/reject')
  rejectInvitation(@Req() req: any, @Param('memberId') memberId: string) {
    return this.memberService.rejectInvitation(req.user.id, memberId);
  }

  @Patch(':organizerId/members/:memberId/role')
  updateRole(
    @Req() req: any,
    @Param('organizerId') organizerId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.memberService.updateRole(
      req.user.id,
      organizerId,
      memberId,
      dto,
    );
  }

  @Delete(':organizerId/members/:memberId')
  removeMember(
    @Req() req: any,
    @Param('organizerId') organizerId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.memberService.removeMember(req.user.id, organizerId, memberId);
  }
}
