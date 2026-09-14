import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrderStatus, Prisma } from '../generated/prisma/client.js';

@Injectable()
export class OrdersService {
  private readonly ORDER_EXPIRY_MINUTES = 15;

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    if (!dto.items.length) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const ticketTypeIds = dto.items.map((item) => item.ticketTypeId);

    const uniqueTicketTypeIds = new Set(ticketTypeIds);

    if (uniqueTicketTypeIds.size !== ticketTypeIds.length) {
      throw new BadRequestException('Duplicate ticket type is not allowed');
    }

    for (const item of dto.items) {
      if (item.attendees.length !== item.quantity) {
        throw new BadRequestException(
          `Ticket ${item.ticketTypeId} requires ${item.quantity} attendee(s)`,
        );
      }
    }

    return this.prisma.$transaction(
      async (tx) => {
        const event = await tx.event.findUnique({
          where: {
            id: dto.eventId,
          },
        });

        if (!event) {
          throw new NotFoundException('Event not found');
        }

        if (event.status !== 'PUBLISHED') {
          throw new BadRequestException('Event is not available for purchase');
        }

        const ticketTypes = await tx.ticketType.findMany({
          where: {
            id: {
              in: ticketTypeIds,
            },

            eventId: dto.eventId,
          },
        });

        if (ticketTypes.length !== ticketTypeIds.length) {
          throw new BadRequestException('One or more ticket types are invalid');
        }

        const ticketMap = new Map(
          ticketTypes.map((ticket) => [ticket.id, ticket]),
        );

        let subtotal = new Prisma.Decimal(0);

        const orderItemsData: any[] = [];

        for (const item of dto.items) {
          const ticket = ticketMap.get(item.ticketTypeId);

          if (!ticket) {
            throw new NotFoundException('Ticket type not found');
          }

          const unitPrice = ticket.price;

          const itemSubtotal = unitPrice.mul(item.quantity);

          subtotal = subtotal.add(itemSubtotal);

          orderItemsData.push({
            ticketTypeId: ticket.id,

            ticketName: ticket.name,

            unitPrice,

            quantity: item.quantity,

            subtotal: itemSubtotal,
          });
        }

        let discountAmount = new Prisma.Decimal(0);

        /**
         * Promotion calculation should eventually
         * be delegated to PromotionService.
         *
         * For now we keep it 0.
         */
        if (dto.promotionCode) {
          // TODO:
          // promotionService.validateAndCalculate()
        }

        const serviceFee = this.calculateServiceFee(subtotal);

        const totalAmount = subtotal.sub(discountAmount).add(serviceFee);

        if (totalAmount.lessThan(0)) {
          throw new BadRequestException('Invalid order total');
        }

        const orderNumber = await this.generateOrderNumber(tx);

        const expiredAt = new Date(
          Date.now() + this.ORDER_EXPIRY_MINUTES * 60 * 1000,
        );

        const order = await tx.order.create({
          data: {
            orderNumber,

            userId,

            eventId: dto.eventId,

            subtotal,

            discountAmount,

            serviceFee,

            totalAmount,

            currency: dto.currency ?? 'IDR',

            status: OrderStatus.PENDING_PAYMENT,

            expiredAt,

            items: {
              create: orderItemsData.map((item, index) => ({
                ...item,

                attendees: {
                  create: dto.items[index].attendees.map((attendee) => ({
                    fullName: attendee.fullName,

                    email: attendee.email,

                    phone: attendee.phone,

                    registrationData: attendee.registrationData,
                  })),
                },
              })),
            },
          },

          include: {
            items: {
              include: {
                attendees: true,
                ticketType: true,
              },
            },

            event: true,
          },
        });

        return order;
      },

      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

        maxWait: 5000,

        timeout: 10000,
      },
    );
  }

  async findMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        event: true,

        items: {
          include: {
            attendees: true,
          },
        },

        payments: true,
      },
    });
  }

  async findMyOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,

        userId,
      },

      include: {
        event: true,

        items: {
          include: {
            ticketType: true,

            attendees: {
              include: {
                eventTickets: true,
              },
            },
          },
        },

        payments: true,

        promotionUsage: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findMyOrderByNumber(userId: string, orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNumber,

        userId,
      },

      include: {
        event: true,

        items: {
          include: {
            attendees: true,
          },
        },

        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async cancel(userId: string, orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: orderId,

          userId,
        },

        include: {
          items: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        throw new BadRequestException(
          'Only pending payment orders can be cancelled',
        );
      }

      if (order.expiredAt && order.expiredAt <= new Date()) {
        throw new BadRequestException('Order has expired');
      }

      const cancelled = await tx.order.update({
        where: {
          id: orderId,
        },

        data: {
          status: OrderStatus.CANCELLED,

          cancelledAt: new Date(),
        },

        include: {
          items: {
            include: {
              attendees: true,
            },
          },
        },
      });

      return cancelled;
    });
  }

  async expireOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      return order;
    }

    if (!order.expiredAt || order.expiredAt > new Date()) {
      throw new BadRequestException('Order has not expired yet');
    }

    return this.prisma.order.update({
      where: {
        id: orderId,
      },

      data: {
        status: OrderStatus.EXPIRED,
      },
    });
  }

  private calculateServiceFee(subtotal: Prisma.Decimal) {
    /**
     * Example:
     *
     * 5% service fee
     *
     * Move this to configuration
     * when Payment/Pricing module is ready.
     */
    return subtotal.mul(new Prisma.Decimal('0.05')).toDecimalPlaces(4);
  }

  private async generateOrderNumber(tx: Prisma.TransactionClient) {
    while (true) {
      const timestamp = Date.now().toString().slice(-8);

      const random = Math.floor(1000 + Math.random() * 9000);

      const orderNumber = `HBT-${timestamp}-${random}`;

      const existing = await tx.order.findUnique({
        where: {
          orderNumber,
        },
      });

      if (!existing) {
        return orderNumber;
      }
    }
  }
}
