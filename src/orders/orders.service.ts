import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/orders.dto.js';
import {
  EventTicketStatus,
  OrderStatus,
  PaymentStatus,
} from '../generated/prisma/enums.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData = [];

      for (const item of dto.items) {
        const ticketType = await tx.ticketType.findUnique({
          where: { id: item.ticketTypeId },
          include: { inventory: true },
        });

        if (!ticketType)
          throw new NotFoundException(
            `Tiket tidak ditemukan: ${item.ticketTypeId}`,
          );

        if (ticketType.inventory) {
          const available =
            ticketType.inventory.totalQuantity -
            (ticketType.inventory.reservedQuantity +
              ticketType.inventory.soldQuantity);
          if (available < item.quantity) {
            throw new BadRequestException(
              `Stok tiket "${ticketType.name}" tidak mencukupi`,
            );
          }

          await tx.ticketInventory.update({
            where: { ticketTypeId: ticketType.id },
            data: { reservedQuantity: { increment: item.quantity } },
          });
        }

        const itemSubtotal = Number(ticketType.price) * item.quantity;
        subtotal += itemSubtotal;

        orderItemsData.push({
          ticketTypeId: ticketType.id,
          ticketName: ticketType.name,
          unitPrice: ticketType.price,
          quantity: item.quantity,
          subtotal: itemSubtotal,
        });
      }

      const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const expiredAt = new Date(Date.now() + 15 * 60 * 1000);

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: dto.userId,
          eventId: dto.eventId,
          subtotal,
          totalAmount: subtotal,
          status: OrderStatus.PENDING_PAYMENT,
          expiredAt,
          items: {
            create: orderItemsData,
          },
          payments: {
            create: {
              provider: 'MIDTRANS',
              amount: subtotal,
              status: PaymentStatus.PENDING,
              expiredAt,
            },
          },
        },
        include: { items: true, payments: true },
      });

      return order;
    });
  }

  async handlePaymentSuccess(orderId: string, providerReference: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { attendees: true } } },
      });

      if (!order) throw new NotFoundException('Order tidak ditemukan');

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID, paidAt: new Date() },
      });

      await tx.payment.updateMany({
        where: { orderId },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          providerReference,
        },
      });

      for (const item of order.items) {
        await tx.ticketInventory.update({
          where: { ticketTypeId: item.ticketTypeId },
          data: {
            reservedQuantity: { decrement: item.quantity },
            soldQuantity: { increment: item.quantity },
          },
        });

        for (let i = 0; i < item.quantity; i++) {
          const attendee = await tx.attendee.create({
            data: {
              orderItemId: item.id,
              fullName: 'Attendee',
              email: 'attendee@example.com',
            },
          });

          await tx.eventTicket.create({
            data: {
              attendeeId: attendee.id,
              ticketTypeId: item.ticketTypeId,
              eventId: order.eventId,
              ticketCode: `TCK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
              qrToken: `QR-${Math.random().toString(36).substring(2, 15)}`,
              accessType: 'OFFLINE',
              status: EventTicketStatus.VALID,
            },
          });
        }
      }

      return {
        success: true,
        message: 'Pembayaran berhasil dan e-ticket telah diterbitkan',
      };
    });
  }
}
