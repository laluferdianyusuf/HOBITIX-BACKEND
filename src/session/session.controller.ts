import { Controller } from '@nestjs/common';
import { SessionService } from './session.service.js';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}
}
