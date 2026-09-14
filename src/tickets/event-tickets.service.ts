import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class EventTicketsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateTicketCode(): string {
    const code = randomBytes(5).toString('hex').toUpperCase();

    return `HBT-${code}`;
  }

  private generateQrToken(): string {
    return randomBytes(32).toString('base64url');
  }

  async issueTicket(
    tx: any,
    params: {
      attendeeId: string;
      ticketTypeId: string;
      eventId: string;
      accessType: any;
    },
  ) {
    const attendee = await tx.attendee.findUnique({
      where: {
        id: params.attendeeId,
      },
    });

    if (!attendee) {
      throw new NotFoundException('Attendee tidak ditemukan');
    }

    const ticketType = await tx.ticketType.findUnique({
      where: {
        id: params.ticketTypeId,
      },
    });

    if (!ticketType) {
      throw new NotFoundException('Ticket type tidak ditemukan');
    }

    const ticket = await tx.eventTicket.create({
      data: {
        attendeeId: params.attendeeId,
        ticketTypeId: params.ticketTypeId,
        eventId: params.eventId,
        ticketCode: this.generateTicketCode(),
        qrToken: this.generateQrToken(),
        accessType: params.accessType,
      },
    });

    return ticket;
  }

  async findMyTickets(userId: string) {
    return this.prisma.eventTicket.findMany({
      where: {
        attendee: {
          orderItem: {
            order: {
              userId,
            },
          },
        },
      },
      include: {
        attendee: true,
        ticketType: true,
        event: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findMyTicket(userId: string, ticketId: string) {
    const ticket = await this.prisma.eventTicket.findFirst({
      where: {
        id: ticketId,
        attendee: {
          orderItem: {
            order: {
              userId,
            },
          },
        },
      },
      include: {
        attendee: true,
        ticketType: true,
        event: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket tidak ditemukan');
    }

    return ticket;
  }

  async findByTicketCode(ticketCode: string) {
    const ticket = await this.prisma.eventTicket.findUnique({
      where: {
        ticketCode,
      },
      include: {
        attendee: true,
        ticketType: true,
        event: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket tidak ditemukan');
    }

    return ticket;
  }

  async findByQrToken(qrToken: string) {
    const ticket = await this.prisma.eventTicket.findUnique({
      where: {
        qrToken,
      },
      include: {
        attendee: true,
        ticketType: true,
        event: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('QR ticket tidak valid');
    }

    return ticket;
  }

  async findByEvent(eventId: string, status?: any) {
    return this.prisma.eventTicket.findMany({
      where: {
        eventId,
        ...(status ? { status } : {}),
      },
      include: {
        attendee: true,
        ticketType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
