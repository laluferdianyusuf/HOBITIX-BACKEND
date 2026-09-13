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
import { CreateBankAccountDto } from './dto/create-bank-account.dto.js';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto.js';
import { OrganizerBankAccountService } from './organizer-bank-account.service.js';

@Controller('organizers/:organizerId/bank-accounts')
@UseGuards(JwtAuthGuard)
export class OrganizerBankAccountController {
  constructor(private readonly service: OrganizerBankAccountService) {}

  @Post()
  create(
    @Req() req: any,
    @Param('organizerId') organizerId: string,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.service.create(req.user.id, organizerId, dto);
  }

  @Get()
  findAll(@Req() req: any, @Param('organizerId') organizerId: string) {
    return this.service.findAll(req.user.id, organizerId);
  }

  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('organizerId') organizerId: string,
    @Param('id') bankAccountId: string,
  ) {
    return this.service.findOne(req.user.id, organizerId, bankAccountId);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('organizerId') organizerId: string,
    @Param('id') bankAccountId: string,
    @Body() dto: UpdateBankAccountDto,
  ) {
    return this.service.update(req.user.id, organizerId, bankAccountId, dto);
  }

  @Post(':id/primary')
  setPrimary(
    @Req() req: any,
    @Param('organizerId') organizerId: string,
    @Param('id') bankAccountId: string,
  ) {
    return this.service.setPrimary(req.user.id, organizerId, bankAccountId);
  }

  @Delete(':id')
  remove(
    @Req() req: any,
    @Param('organizerId') organizerId: string,
    @Param('id') bankAccountId: string,
  ) {
    return this.service.remove(req.user.id, organizerId, bankAccountId);
  }
}
