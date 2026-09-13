import { Module } from '@nestjs/common';
import { OrganizerBankAccountController } from './organizer-bank-account.controller.js';
import { OrganizerBankAccountService } from './organizer-bank-account.service.js';

@Module({
  controllers: [OrganizerBankAccountController],

  providers: [OrganizerBankAccountService],

  exports: [OrganizerBankAccountService],
})
export class OrganizerBankAccountModule {}
