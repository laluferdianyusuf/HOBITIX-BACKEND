import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettlementStatus } from '../generated/prisma/enums.js';

@Injectable()
export class SettlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async processSettlement(organizerId: string, bankAccountId: string) {
    return this.prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({
        where: {
          event: { organizerId },
          status: 'PAID',
          settlementItems: { none: {} },
        },
      });

      if (orders.length === 0) {
        throw new BadRequestException(
          'Tidak ada transaksi yang dapat dicairkan',
        );
      }

      let grossAmount = 0;
      let platformFee = 0;
      let gatewayFee = 0;

      const items = orders.map((ord) => {
        const gross = Number(ord.totalAmount);
        const pFee = gross * 0.05; // Fee platform 5%
        const gFee = 4000; // Fee payment gateway fixed
        const net = gross - pFee - gFee;

        grossAmount += gross;
        platformFee += pFee;
        gatewayFee += gFee;

        return {
          orderId: ord.id,
          grossAmount: gross,
          platformFee: pFee,
          gatewayFee: gFee,
          netAmount: net,
        };
      });

      const netAmount = grossAmount - platformFee - gatewayFee;
      const settlementNumber = `STL-${Date.now()}`;

      return tx.settlement.create({
        data: {
          organizerId,
          bankAccountId,
          settlementNumber,
          grossAmount,
          platformFee,
          gatewayFee,
          netAmount,
          status: SettlementStatus.PROCESSING,
          items: {
            create: items,
          },
        },
        include: { items: true },
      });
    });
  }
}
