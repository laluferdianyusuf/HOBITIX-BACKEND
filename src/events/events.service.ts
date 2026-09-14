import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EventStatus } from '../generated/prisma/enums.js';
import { CreateEventDto } from './dto/createEvent.dto.js';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  // async create(dto: CreateEventDto) {
  //   const slug =
  //     dto.title
  //       .toLowerCase()
  //       .replace(/[^a-z0-9]+/g, '-')
  //       .replace(/(^-|-$)+/g, '') +
  //     '-' +
  //     Date.now();

  //   return this.prisma.event.create({
  //     data: {
  //       organizerId: dto.organizerId,
  //       categoryId: dto.categoryId,
  //       title: dto.title,
  //       slug,
  //       description: dto.description,
  //       eventType: dto.eventType,
  //       startAt: new Date(dto.startAt),
  //       endAt: new Date(dto.endAt),
  //       timezone: dto.timezone,
  //       status: EventStatus.DRAFT,
  //       ...(dto.location && {
  //         location: {
  //           create: dto.location,
  //         },
  //       }),
  //     },
  //     include: { location: true, category: true },
  //   });
  // }

  async createEvent(createEventDto: CreateEventDto) {
    const { categoryId, organizerId, startAt, endAt, ...data } = createEventDto;

    return this.prisma.event.create({
      data: {
        ...data,

        startAt: new Date(startAt),
        endAt: new Date(endAt),

        category: {
          connect: {
            id: categoryId,
          },
        },
        organizer: {
          connect: {
            id: organizerId,
          },
        },
      },

      include: {
        category: true,
        organizer: true,
      },
    });
  }

  async findAllPublished() {
    return this.prisma.event.findMany({
      where: { status: EventStatus.PUBLISHED, deletedAt: null },
      include: {
        organizer: { select: { id: true, name: true, logoUrl: true } },
        category: { select: { id: true, name: true } },
        location: true,
        ticketTypes: true,
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async findOneBySlug(slug: string) {
    const event = await this.prisma.event.findFirst({
      where: { slug, deletedAt: null },
      include: {
        organizer: true,
        category: true,
        location: true,
        onlineAccess: true,
        ticketTypes: {
          include: { inventory: true },
        },
      },
    });

    if (!event) throw new NotFoundException('Event tidak ditemukan');
    return event;
  }

  async publish(id: string) {
    return this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.PUBLISHED, publishedAt: new Date() },
    });
  }
}
