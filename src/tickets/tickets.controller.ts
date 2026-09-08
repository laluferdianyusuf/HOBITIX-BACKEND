import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TicketsService } from './tickets.service.js';
import { CreateCategoryDto, CreateTicketTypeDto } from './dto/tickets.dto.js';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.ticketsService.createCategory(dto);
  }

  @Get('categories')
  findAllCategories() {
    return this.ticketsService.findAllCategories();
  }

  @Post('types')
  createTicketType(@Body() dto: CreateTicketTypeDto) {
    return this.ticketsService.createTicketType(dto);
  }

  @Get('event/:eventId')
  findByEvent(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.ticketsService.findByEvent(eventId);
  }
}
