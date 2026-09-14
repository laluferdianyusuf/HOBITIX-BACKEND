import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service.js';

@Controller('payments/webhook')
export class PaymentWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':provider')
  async handleWebhook(
    @Headers('x-provider-event-id')
    providerEventId: string,

    @Headers('x-provider-reference')
    providerReference: string,

    @Headers('x-provider-signature')
    signature: string,

    @Body() body: any,
  ) {
    /**
     * TODO:
     *
     * Verify signature berdasarkan
     * provider masing-masing.
     *
     * Jangan hanya percaya header.
     */
    if (!signature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const provider = body.provider;

    const result = await this.paymentsService.handleWebhook({
      provider,
      providerEventId,
      providerReference,
      providerStatus: body.status,
      amount: body.amount,
      rawPayload: body,
    });

    return {
      success: true,
      data: result,
    };
  }
}
