import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto, CreateTicketTypeDto } from './dto/tickets.dto.js';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(dto: CreateCategoryDto) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    return this.prisma.category.create({
      data: { ...dto, slug },
    });
  }

  async findAllCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createTicketType(dto: CreateTicketTypeDto) {
    const { totalQuantity, ...ticketData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const ticketType = await tx.ticketType.create({
        data: {
          ...ticketData,
          saleStartAt: new Date(ticketData.salesStartAt),
          saleEndAt: new Date(ticketData.salesEndAt),
        },
      });

      await tx.ticketInventory.create({
        data: {
          ticketTypeId: ticketType.id,
          totalQuantity,
          reservedQuantity: 0,
          soldQuantity: 0,
        },
      });

      return tx.ticketType.findUnique({
        where: { id: ticketType.id },
        include: { inventory: true },
      });
    });
  }

  async findByEvent(eventId: string) {
    return this.prisma.ticketType.findMany({
      where: { eventId, isActive: true },
      include: { inventory: true },
    });
  }
}
