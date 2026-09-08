import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CheckInController } from './check-in.controller.js';
import { CheckInService } from './check-in.service.js';
@Module({
  imports: [PrismaModule],
  controllers: [CheckInController],
  providers: [CheckInService],
  exports: [CheckInService],
})
export class CheckInModule {}
