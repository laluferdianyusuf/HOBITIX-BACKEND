import { Module } from '@nestjs/common';
import { CheckInController } from './check-in.controller.js';
import { CheckInService } from './check-in.service.js';

@Module({
  controllers: [CheckInController],
  providers: [CheckInService]
})
export class CheckInModule {}
