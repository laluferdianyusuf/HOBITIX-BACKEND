import { Module } from '@nestjs/common';
import { EventTicketsController } from './event-tickets.controller.js';
import { EventTicketsService } from './event-tickets.service.js';

@Module({
  controllers: [EventTicketsController],
  providers: [EventTicketsService],
  exports: [EventTicketsService],
})
export class TicketsModule {}
