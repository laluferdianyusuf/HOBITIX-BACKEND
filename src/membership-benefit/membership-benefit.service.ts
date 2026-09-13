import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMembershipBenefitDto } from './dto/create-membership-benefit.dto.js';
import { UpdateMembershipBenefitDto } from './dto/update-membership-benefit.dto.js';

@Injectable()
export class MembershipBenefitService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE
  async create(dto: CreateMembershipBenefitDto) {
    const existing = await this.prisma.membershipBenefit.findUnique({
      where: {
        code: dto.code,
      },
    });

    if (existing) {
      throw new ConflictException('Benefit code already exists');
    }

    return this.prisma.membershipBenefit.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        benefitType: dto.benefitType,
      },
    });
  }

  // GET ACTIVE
  async findActive() {
    return this.prisma.membershipBenefit.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // GET ALL
  async findAll() {
    return this.prisma.membershipBenefit.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // GET ONE
  async findOne(id: string) {
    const benefit = await this.prisma.membershipBenefit.findUnique({
      where: {
        id,
      },
    });

    if (!benefit) {
      throw new NotFoundException('Benefit not found');
    }

    return benefit;
  }

  // UPDATE
  async update(id: string, dto: UpdateMembershipBenefitDto) {
    await this.findOne(id);

    return this.prisma.membershipBenefit.update({
      where: {
        id,
      },

      data: {
        name: dto.name,
        description: dto.description,
        benefitType: dto.benefitType,
        isActive: dto.isActive,
      },
    });
  }
}
