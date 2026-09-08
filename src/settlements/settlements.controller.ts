import { Controller, Post, Body } from '@nestjs/common';
import { SettlementsService } from './settlements.service.js';

@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post('process')
  processSettlement(
    @Body('organizerId') organizerId: string,
    @Body('bankAccountId') bankAccountId: string,
  ) {
    return this.settlementsService.processSettlement(
      organizerId,
      bankAccountId,
    );
  }
}
