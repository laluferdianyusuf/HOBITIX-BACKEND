import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { OrganizersService } from './organizers.service.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CreateOrganizerDto } from './dto/organizers.dto.js';

@Controller('organizers')
@UseGuards(JwtAuthGuard)
export class OrganizersController {
  constructor(private readonly service: OrganizersService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateOrganizerDto) {
    return this.service.create(user.userId, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: any) {
    return this.service.mine(user.userId);
  }
}
