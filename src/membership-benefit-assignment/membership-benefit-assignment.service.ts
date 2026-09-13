import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MembershipBenefitAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async assign(membershipId: string, benefitId: string) {
    const membership = await this.prisma.membershipAccount.findUnique({
      where: {
        id: membershipId,
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    const benefit = await this.prisma.membershipBenefit.findUnique({
      where: {
        id: benefitId,
      },
    });

    if (!benefit) {
      throw new NotFoundException('Benefit not found');
    }

    if (!benefit.isActive) {
      throw new ConflictException('Benefit is not active');
    }

    const existing = await this.prisma.membershipBenefitAssignment.findUnique({
      where: {
        membershipId_benefitId: {
          membershipId,
          benefitId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Benefit already assigned');
    }

    return this.prisma.membershipBenefitAssignment.create({
      data: {
        membershipId,
        benefitId,
      },

      include: {
        benefit: true,
        membership: true,
      },
    });
  }

  async findByMembership(membershipId: string) {
    return this.prisma.membershipBenefitAssignment.findMany({
      where: {
        membershipId,
      },

      include: {
        benefit: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async remove(membershipId: string, benefitId: string) {
    const assignment = await this.prisma.membershipBenefitAssignment.findUnique(
      {
        where: {
          membershipId_benefitId: {
            membershipId,
            benefitId,
          },
        },
      },
    );

    if (!assignment) {
      throw new NotFoundException('Benefit assignment not found');
    }

    return this.prisma.membershipBenefitAssignment.delete({
      where: {
        membershipId_benefitId: {
          membershipId,
          benefitId,
        },
      },
    });
  }
}
