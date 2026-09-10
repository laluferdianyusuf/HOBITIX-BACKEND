import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto, CreateTicketTypeDto } from './dto/tickets.dto.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(dto: CreateCategoryDto) {
    const slug = dto.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    try {
      return await this.prisma.category.create({
        data: {
          ...dto,
          slug,
        },
      });
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Category with this name or slug already exists',
        );
      }
      throw error;
    }
  }

  async findAllCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createTicketType(dto: CreateTicketTypeDto) {
    const {
      totalQuantity,
      salesStartAt,
      salesEndAt,
      accessType,
      ...restTicketData
    } = dto;

    return this.prisma.$transaction(async (tx) => {
      return tx.ticketType.create({
        data: {
          ...restTicketData,
          accessType: accessType,
          saleStartAt: new Date(salesStartAt),
          saleEndAt: new Date(salesEndAt),
          inventory: {
            create: {
              totalQuantity,
              reservedQuantity: 0,
              soldQuantity: 0,
            },
          },
        },
        include: {
          inventory: true,
        },
      });
    });
  }

  async findByEvent(eventId: string) {
    const ticketTypes = await this.prisma.ticketType.findMany({
      where: { eventId, isActive: true },
      include: { inventory: true },
    });

    if (!ticketTypes || ticketTypes.length === 0) {
      throw new NotFoundException(
        `No active ticket types found for event ID ${eventId}`,
      );
    }

    return ticketTypes;
  }
}
