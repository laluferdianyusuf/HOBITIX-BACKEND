import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { EventTicketsService } from './event-tickets.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class EventTicketsController {
  constructor(private readonly eventTicketsService: EventTicketsService) {}

  @Get('my')
  findMyTickets(@Req() req: any) {
    return this.eventTicketsService.findMyTickets(req.user.id);
  }

  @Get('my/:id')
  findMyTicket(@Req() req: any, @Param('id') id: string) {
    return this.eventTicketsService.findMyTicket(req.user.id, id);
  }
}
