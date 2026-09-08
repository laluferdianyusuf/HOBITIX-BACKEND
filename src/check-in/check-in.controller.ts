import { Controller, Post, Body } from '@nestjs/common';
import { CheckInService } from './check-in.service.js';
import { ScanTicketDto } from './dto/check-in.dto.js';

@Controller('check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Post('scan')
  scanTicket(@Body() dto: ScanTicketDto) {
    return this.checkInService.validateAndCheckIn(dto);
  }
}
