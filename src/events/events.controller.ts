import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EventsService } from './events.service.js';
import { CreateEventDto } from './dto/createEvent.dto.js';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('create')
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(dto);
  }

  @Get('getAll')
  findAll() {
    return this.eventsService.findAllPublished();
  }

  @Get('slug/:slug')
  findOne(@Param('slug') slug: string) {
    return this.eventsService.findOneBySlug(slug);
  }

  @Patch(':id/publish')
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.publish(id);
  }
}
