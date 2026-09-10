import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { JwtModule } from '@nestjs/jwt';
import { SessionService } from './session.service.js';
import { SessionController } from './session.controller.js';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
