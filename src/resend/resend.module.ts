import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './resend.service.js';

@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
