import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { DuitkuService } from './providers/duitku/duitku.service.js';
import { EventTicketsService } from '../tickets/event-tickets.service.js';
import { DuitkuCallbackDto } from './dto/duitku-callback.dto.js';
import { DuitkuSignature } from './providers/duitku/duitku.signature.js';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '../generated/prisma/client.js';

@Injectable()
export class PaymentWebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly duitku: DuitkuService,
    private readonly eventTickets: EventTicketsService,
  ) {}

  async handleDuitku(dto: DuitkuCallbackDto) {
    /**
     * 1. Verify merchant code
     */
    if (dto.merchantCode !== this.duitku.getMerchantCode()) {
      throw new UnauthorizedException('Invalid merchant code');
    }

    /**
     * 2. Verify signature
     */
    const valid = DuitkuSignature.verifyCallbackSignature(
      dto.merchantCode,
      dto.amount,
      dto.merchantOrderId,
      this.duitku.getApiKey(),
      dto.signature,
    );

    if (!valid) {
      throw new UnauthorizedException('Invalid signature');
    }

    /**
     * 3. Process inside transaction
     */
    return this.prisma.$transaction(
      async (tx) => {
        /**
         * merchantOrderId kita jadikan
         * referensi Order.
         */
        const order = await tx.order.findUnique({
          where: {
            orderNumber: dto.merchantOrderId,
          },
          include: {
            items: {
              include: {
                attendees: true,
                ticketType: true,
              },
            },
          },
        });

        if (!order) {
          throw new BadRequestException('Order tidak ditemukan');
        }

        /**
         * 4. Validate amount
         */
        const callbackAmount = new Prisma.Decimal(dto.amount);

        if (!order.totalAmount.equals(callbackAmount)) {
          throw new BadRequestException('Nominal payment tidak sesuai');
        }

        /**
         * 5. Idempotency
         *
         * reference dari Duitku disimpan
         * sebagai providerEventId.
         */
        const existing = await tx.paymentTransaction.findUnique({
          where: {
            providerEventId: dto.reference,
          },
        });

        if (existing) {
          return {
            success: true,
            duplicate: true,
          };
        }

        /**
         * 6. Cari payment
         */
        const payment = await tx.payment.findFirst({
          where: {
            orderId: order.id,
            provider: 'duitku',
          },
        });

        if (!payment) {
          throw new BadRequestException('Payment Duitku tidak ditemukan');
        }

        /**
         * 7. Save callback
         */
        await tx.paymentTransaction.create({
          data: {
            paymentId: payment.id,
            providerEventId: dto.reference,
            providerStatus: dto.resultCode,
            amount: callbackAmount,
            rawPayload: dto as any,
            processedAt: new Date(),
          },
        });

        /**
         * 8. SUCCESS
         *
         * Duitku callback resultCode 00
         * berarti transaksi sukses pada
         * dokumentasi callback.
         */
        if (dto.resultCode === '00') {
          /**
           * Jangan generate ticket lagi
           * kalau payment sudah PAID.
           */
          if (payment.status !== PaymentStatus.PAID) {
            await tx.payment.update({
              where: {
                id: payment.id,
              },
              data: {
                status: PaymentStatus.PAID,
                providerReference: dto.reference,
                paymentMethod: dto.paymentCode,
                paidAt: new Date(),
              },
            });

            await tx.order.update({
              where: {
                id: order.id,
              },
              data: {
                status: OrderStatus.PAID,
                paidAt: new Date(),
              },
            });

            /**
             * Generate EventTicket.
             */
            for (const item of order.items) {
              for (const attendee of item.attendees) {
                await this.eventTickets.issueTicket(tx, {
                  attendeeId: attendee.id,
                  ticketTypeId: item.ticketTypeId,
                  eventId: order.eventId,
                  accessType: item.ticketType.accessType,
                });
              }
            }
          }
        }

        return {
          success: true,
          duplicate: false,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 15000,
      },
    );
  }
}
