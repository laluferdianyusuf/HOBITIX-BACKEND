import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EventTicketsService } from '../tickets/event-tickets.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { OrderStatus, PaymentStatus } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventTicketsService: EventTicketsService,
  ) {}

  /**
   * Membuat payment untuk order.
   *
   * Amount SELALU diambil dari database.
   */
  async createPayment(userId: string, dto: CreatePaymentDto) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: dto.orderId,
        userId,
      },
      include: {
        payments: {
          where: {
            status: PaymentStatus.PENDING,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order tidak dapat dibayar');
    }

    if (order.expiredAt && order.expiredAt <= new Date()) {
      throw new BadRequestException('Order sudah expired');
    }

    /**
     * Jangan membuat payment duplicate
     * jika masih ada pending payment.
     */
    const existingPayment = order.payments[0];

    if (existingPayment) {
      return existingPayment;
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: dto.provider,
        amount: order.totalAmount,
        currency: order.currency,
        status: PaymentStatus.PENDING,
        expiresAt: order.expiredAt,
      },
    });

    return payment;
  }

  async findMyPayment(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        order: {
          userId,
        },
      },
      include: {
        order: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment tidak ditemukan');
    }

    return payment;
  }

  async handleWebhook(params: {
    provider: string;
    providerEventId: string;
    providerReference: string;
    providerStatus: string;
    amount: Prisma.Decimal;
    rawPayload: Prisma.InputJsonValue;
  }) {
    return this.prisma.$transaction(
      async (tx) => {
        const existingTransaction = await tx.paymentTransaction.findUnique({
          where: {
            providerEventId: params.providerEventId,
          },
        });

        if (existingTransaction) {
          return {
            success: true,
            duplicate: true,
          };
        }

        const payment = await tx.payment.findFirst({
          where: {
            provider: params.provider,
            providerReference: params.providerReference,
          },
        });

        if (!payment) {
          throw new NotFoundException('Payment tidak ditemukan');
        }

        /**
         * Validasi nominal.
         */
        if (!payment.amount.equals(params.amount)) {
          throw new BadRequestException('Nominal payment tidak sesuai');
        }

        /**
         * Simpan event dari provider.
         */
        await tx.paymentTransaction.create({
          data: {
            paymentId: payment.id,
            providerEventId: params.providerEventId,
            providerStatus: params.providerStatus,
            amount: params.amount,
            rawPayload: params.rawPayload,
            processedAt: new Date(),
          },
        });

        /**
         * Jangan memproses PAID dua kali.
         */
        if (payment.status === PaymentStatus.PAID) {
          return {
            success: true,
            alreadyPaid: true,
          };
        }

        /**
         * Hanya status sukses yang
         * boleh membuat order PAID.
         *
         * Status mapping provider
         * sebaiknya dilakukan sebelum
         * method ini dipanggil.
         */
        if (params.providerStatus === 'PAID') {
          await tx.payment.update({
            where: {
              id: payment.id,
            },
            data: {
              status: PaymentStatus.PAID,
              paidAt: new Date(),
            },
          });

          await tx.order.update({
            where: {
              id: payment.orderId,
            },
            data: {
              status: OrderStatus.PAID,
              paidAt: new Date(),
            },
          });

          /**
           * Ambil seluruh order item + attendee.
           */
          const order = await tx.order.findUnique({
            where: {
              id: payment.orderId,
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
            throw new NotFoundException('Order tidak ditemukan');
          }

          /**
           * Issue EventTicket untuk setiap attendee.
           */
          for (const item of order.items) {
            for (const attendee of item.attendees) {
              await this.eventTicketsService.issueTicket(tx, {
                attendeeId: attendee.id,
                ticketTypeId: item.ticketTypeId,
                eventId: order.eventId,
                accessType: item.ticketType.accessType,
              });
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
