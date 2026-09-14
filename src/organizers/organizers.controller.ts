import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CreateOrganizerDto } from './dto/create-organizer.dto.js';
import { ReviewOrganizerDto } from './dto/review-organizer.dto.js';
import { UpdateOrganizerDto } from './dto/update-organizer.dto.js';
import { OrganizerService } from './organizers.service.js';

@Controller('organizers')
@UseGuards(JwtAuthGuard)
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrganizerDto) {
    return this.organizerService.create(req.user.id, dto);
  }

  @Get('me')
  findMyOrganizer(@Req() req: any) {
    return this.organizerService.findMyOrganizer(req.user.id);
  }

  @Get('admin/pending')
  @UseGuards(AdminGuard)
  findPending() {
    return this.organizerService.findPending();
  }

  @Patch(':id/review')
  @UseGuards(AdminGuard)
  review(@Param('id') organizerId: string, @Body() dto: ReviewOrganizerDto) {
    return this.organizerService.review(organizerId, dto);
  }

  @Get(':id')
  findOne(@Param('id') organizerId: string) {
    return this.organizerService.findOne(organizerId);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') organizerId: string,
    @Body() dto: UpdateOrganizerDto,
  ) {
    return this.organizerService.update(req.user.id, organizerId, dto);
  }

  @Post(':id/resubmit')
  resubmit(@Req() req: any, @Param('id') organizerId: string) {
    return this.organizerService.resubmit(req.user.id, organizerId);
  }
}
