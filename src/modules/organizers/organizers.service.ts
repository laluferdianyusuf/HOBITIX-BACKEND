import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrganizerDto } from './dto/organizers.dto.js';

@Injectable()
export class OrganizersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrganizerDto) {
    const slug = await this.slug(dto.name);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.organizer.findFirst({
        where: {
          ownerId: userId,
          name: dto.name,
        },
      });

      if (existing) {
        throw new ConflictException('Organizer sudah ada');
      }

      const organizer = await tx.organizer.create({
        data: {
          ownerId: userId,
          name: dto.name,
          slug,
          type: dto.type,
          description: dto.description,
          email: dto.email,
          phone: dto.phone,
          websiteUrl: dto.websiteUrl,
          status: 'PENDING',
        },
      });

      await tx.organizerMember.create({
        data: {
          organizerId: organizer.id,
          userId,
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
      });

      return organizer;
    });
  }

  async mine(userId: string) {
    return this.prisma.organizer.findMany({
      where: {
        members: {
          some: {
            userId,
            status: 'ACTIVE',
          },
        },
      },
    });
  }

  private async slug(name: string) {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-');

    let slug = base;
    let i = 1;

    while (
      await this.prisma.organizer.findUnique({
        where: { slug },
      })
    ) {
      slug = `${base}-${i++}`;
    }

    return slug;
  }
}
