import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ScanTicketDto } from './dto/check-in.dto.js';
import { EventTicketStatus } from '../generated/prisma/enums.js';

@Injectable()
export class CheckInService {
  constructor(private readonly prisma: PrismaService) {}

  async validateAndCheckIn(dto: ScanTicketDto) {
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.eventTicket.findUnique({
        where: { qrToken: dto.qrToken },
        include: {
          attendee: true,
          ticketType: true,
          event: true,
        },
      });

      if (!ticket) {
        throw new NotFoundException('Tiket tidak valid atau tidak ditemukan');
      }

      if (ticket.eventId !== dto.eventId) {
        throw new BadRequestException('Tiket tidak terdaftar untuk event ini');
      }

      if (ticket.status === EventTicketStatus.CHECKED_IN) {
        throw new BadRequestException(
          `Tiket sudah digunakan pada ${ticket.checkedInAt?.toLocaleString('id-ID')}`,
        );
      }

      if (
        ticket.status === EventTicketStatus.CANCELLED ||
        ticket.status === EventTicketStatus.EXPIRED
      ) {
        throw new BadRequestException(
          `Tiket tidak dapat digunakan (Status: ${ticket.status})`,
        );
      }

      const updatedTicket = await tx.eventTicket.update({
        where: { id: ticket.id },
        data: {
          status: EventTicketStatus.CHECKED_IN,
          usedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Check-in berhasil!',
        attendeeName: ticket.attendee.fullName,
        ticketType: ticket.ticketType.name,
        checkedInAt: updatedTicket.checkedInAt,
      };
    });
  }
}
