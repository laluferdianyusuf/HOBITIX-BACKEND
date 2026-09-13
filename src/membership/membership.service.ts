import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string) {
    const existing = await this.prisma.membershipAccount.findUnique({
      where: {
        userId,
      },
    });

    if (existing) {
      throw new ConflictException('User already has a membership');
    }

    const membershipNumber = await this.generateMembershipNumber();

    return this.prisma.membershipAccount.create({
      data: {
        userId,

        membershipNumber,

        status: MembershipStatus.ACTIVE,
      },
    });
  }

  async findMyMembership(userId: string) {
    const membership = await this.prisma.membershipAccount.findUnique({
      where: {
        userId,
      },

      include: {
        benefitAssignments: {
          include: {
            benefit: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return membership;
  }

  async findByNumber(membershipNumber: string) {
    const membership = await this.prisma.membershipAccount.findUnique({
      where: {
        membershipNumber,
      },

      include: {
        benefitAssignments: {
          include: {
            benefit: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return membership;
  }

  async updateStatus(membershipId: string, status: MembershipStatus) {
    const membership = await this.prisma.membershipAccount.findUnique({
      where: {
        id: membershipId,
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return this.prisma.membershipAccount.update({
      where: {
        id: membershipId,
      },

      data: {
        status,
      },
    });
  }

  private async generateMembershipNumber() {
    while (true) {
      const random = Math.floor(10000000 + Math.random() * 90000000);

      const number = `HBT-${random}`;

      const exists = await this.prisma.membershipAccount.findUnique({
        where: {
          membershipNumber: number,
        },
      });

      if (!exists) {
        return number;
      }
    }
  }
}
