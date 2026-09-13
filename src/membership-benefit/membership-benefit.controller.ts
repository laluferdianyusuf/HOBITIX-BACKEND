import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CreateMembershipBenefitDto } from './dto/create-membership-benefit.dto.js';
import { UpdateMembershipBenefitDto } from './dto/update-membership-benefit.dto.js';
import { MembershipBenefitService } from './membership-benefit.service.js';

@Controller('membership-benefits')
@UseGuards(JwtAuthGuard)
export class MembershipBenefitController {
  constructor(private readonly service: MembershipBenefitService) {}

  // PUBLIC USER
  @Get()
  findActive() {
    return this.service.findActive();
  }

  // ADMIN
  @Get('admin/all')
  @UseGuards(AdminGuard)
  findAll() {
    return this.service.findAll();
  }

  // ADMIN
  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreateMembershipBenefitDto) {
    return this.service.create(dto);
  }

  // USER
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // ADMIN
  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateMembershipBenefitDto) {
    return this.service.update(id, dto);
  }
}
