import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizerStatus, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrganizerDto } from './dto/create-organizer.dto.js';
import { ReviewOrganizerDto } from './dto/review-organizer.dto.js';
import { UpdateOrganizerDto } from './dto/update-organizer.dto.js';

@Injectable()
export class OrganizerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrganizerDto) {
    const existing = await this.prisma.organizer.findFirst({
      where: {
        ownerId: userId,
      },
    });

    if (existing) {
      throw new ConflictException('You already have an organizer');
    }

    const slug = await this.generateUniqueSlug(dto.name);

    try {
      return await this.prisma.organizer.create({
        data: {
          ownerId: userId,

          name: dto.name,
          slug,
          type: dto.type,

          description: dto.description,

          email: dto.email,
          phone: dto.phone,

          logoUrl: dto.logoUrl,
          websiteUrl: dto.websiteUrl,

          status: OrganizerStatus.PENDING,

          settlementSchedule: dto.settlementSchedule,

          settlementDelayDays: dto.settlementDelayDays,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Organizer slug already exists');
      }

      throw error;
    }
  }

  async findMyOrganizer(userId: string) {
    const organizer = await this.prisma.organizer.findFirst({
      where: {
        ownerId: userId,
      },
      include: {
        members: true,
        bankAccounts: true,
      },
    });

    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }

    return organizer;
  }

  async findOne(organizerId: string) {
    const organizer = await this.prisma.organizer.findUnique({
      where: {
        id: organizerId,
      },
    });

    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }

    return organizer;
  }

  async update(userId: string, organizerId: string, dto: UpdateOrganizerDto) {
    const organizer = await this.getOwnedOrganizer(userId, organizerId);

    if (organizer.status !== OrganizerStatus.REJECTED) {
      throw new BadRequestException('Only rejected organizers can be updated');
    }

    let slug = organizer.slug;

    if (dto.name && dto.name !== organizer.name) {
      slug = await this.generateUniqueSlug(dto.name);
    }

    return this.prisma.organizer.update({
      where: {
        id: organizerId,
      },

      data: {
        name: dto.name,
        slug,

        type: dto.type,
        description: dto.description,

        email: dto.email,
        phone: dto.phone,

        logoUrl: dto.logoUrl,
        websiteUrl: dto.websiteUrl,

        settlementSchedule: dto.settlementSchedule,

        settlementDelayDays: dto.settlementDelayDays,
      },
    });
  }

  async resubmit(userId: string, organizerId: string) {
    const organizer = await this.getOwnedOrganizer(userId, organizerId);

    if (organizer.status !== OrganizerStatus.REJECTED) {
      throw new BadRequestException(
        'Only rejected organizers can be resubmitted',
      );
    }

    return this.prisma.organizer.update({
      where: {
        id: organizerId,
      },

      data: {
        status: OrganizerStatus.PENDING,
        verifiedAt: null,
      },
    });
  }

  async findPending() {
    return this.prisma.organizer.findMany({
      where: {
        status: OrganizerStatus.PENDING,
      },

      include: {
        owner: true,
      },

      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async review(organizerId: string, dto: ReviewOrganizerDto) {
    const organizer = await this.prisma.organizer.findUnique({
      where: {
        id: organizerId,
      },
    });

    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }

    if (organizer.status !== OrganizerStatus.PENDING) {
      throw new BadRequestException('Organizer has already been reviewed');
    }

    const status = dto.approved
      ? OrganizerStatus.APPROVED
      : OrganizerStatus.REJECTED;

    return this.prisma.organizer.update({
      where: {
        id: organizerId,
      },

      data: {
        status,

        verifiedAt: dto.approved ? new Date() : null,
      },
    });
  }

  async validateActiveOrganizer(userId: string, organizerId: string) {
    const organizer = await this.getOwnedOrganizer(userId, organizerId);

    if (organizer.status !== OrganizerStatus.APPROVED) {
      throw new ForbiddenException('Organizer is not active');
    }

    return organizer;
  }

  private async getOwnedOrganizer(userId: string, organizerId: string) {
    const organizer = await this.prisma.organizer.findUnique({
      where: {
        id: organizerId,
      },
    });

    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }

    if (organizer.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this organizer');
    }

    return organizer;
  }

  private async generateUniqueSlug(name: string) {
    const baseSlug = this.slugify(name);

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const exists = await this.prisma.organizer.findUnique({
        where: {
          slug,
        },
      });

      if (!exists) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}
