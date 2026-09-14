import { Module } from '@nestjs/common';
import { TicketsModule } from '../tickets/tickets.module.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentWebhookController } from './payment-webhook.controller.js';
import { PaymentsService } from './payments.service.js';

@Module({
  imports: [TicketsModule],
  controllers: [PaymentsController, PaymentWebhookController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
