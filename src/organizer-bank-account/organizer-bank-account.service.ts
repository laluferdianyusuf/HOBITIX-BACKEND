import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizerStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBankAccountDto } from './dto/create-bank-account.dto.js';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto.js';

@Injectable()
export class OrganizerBankAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, organizerId: string, dto: CreateBankAccountDto) {
    await this.validateOwner(userId, organizerId);

    const existing = await this.prisma.organizerBankAccount.findFirst({
      where: {
        organizerId,
        accountNumber: dto.accountNumber,
      },
    });

    if (existing) {
      throw new ConflictException('Bank account already exists');
    }

    const shouldPrimary = dto.isPrimary === true;

    return this.prisma.$transaction(async (tx) => {
      if (shouldPrimary) {
        await tx.organizerBankAccount.updateMany({
          where: {
            organizerId,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      return tx.organizerBankAccount.create({
        data: {
          organizerId,

          bankName: dto.bankName,
          accountName: dto.accountName,
          accountNumber: dto.accountNumber,

          isPrimary: shouldPrimary,
          isVerified: false,
        },
      });
    });
  }

  async findAll(userId: string, organizerId: string) {
    await this.validateOwner(userId, organizerId);

    return this.prisma.organizerBankAccount.findMany({
      where: {
        organizerId,
      },
      orderBy: [
        {
          isPrimary: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  async findOne(userId: string, organizerId: string, bankAccountId: string) {
    await this.validateOwner(userId, organizerId);

    const account = await this.prisma.organizerBankAccount.findFirst({
      where: {
        id: bankAccountId,
        organizerId,
      },
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    return account;
  }

  async update(
    userId: string,
    organizerId: string,
    bankAccountId: string,
    dto: UpdateBankAccountDto,
  ) {
    await this.validateOwner(userId, organizerId);

    const account = await this.prisma.organizerBankAccount.findFirst({
      where: {
        id: bankAccountId,
        organizerId,
      },
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    if (account.isVerified) {
      throw new BadRequestException('Verified bank account cannot be edited');
    }

    return this.prisma.organizerBankAccount.update({
      where: {
        id: bankAccountId,
      },
      data: {
        bankName: dto.bankName,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
      },
    });
  }

  async setPrimary(userId: string, organizerId: string, bankAccountId: string) {
    await this.validateOwner(userId, organizerId);

    const account = await this.prisma.organizerBankAccount.findFirst({
      where: {
        id: bankAccountId,
        organizerId,
      },
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    if (!account.isVerified) {
      throw new BadRequestException(
        'Only verified bank accounts can be primary',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.organizerBankAccount.updateMany({
        where: {
          organizerId,
        },
        data: {
          isPrimary: false,
        },
      });

      return tx.organizerBankAccount.update({
        where: {
          id: bankAccountId,
        },
        data: {
          isPrimary: true,
        },
      });
    });
  }

  async remove(userId: string, organizerId: string, bankAccountId: string) {
    await this.validateOwner(userId, organizerId);

    const account = await this.prisma.organizerBankAccount.findFirst({
      where: {
        id: bankAccountId,
        organizerId,
      },
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    if (account.isPrimary) {
      throw new BadRequestException('Primary bank account cannot be deleted');
    }

    return this.prisma.organizerBankAccount.delete({
      where: {
        id: bankAccountId,
      },
    });
  }

  async verify(bankAccountId: string) {
    const account = await this.prisma.organizerBankAccount.findUnique({
      where: {
        id: bankAccountId,
      },
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    if (account.isVerified) {
      throw new BadRequestException('Bank account already verified');
    }

    return this.prisma.organizerBankAccount.update({
      where: {
        id: bankAccountId,
      },
      data: {
        isVerified: true,
      },
    });
  }

  private async validateOwner(userId: string, organizerId: string) {
    const organizer = await this.prisma.organizer.findUnique({
      where: {
        id: organizerId,
      },
    });

    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }

    if (organizer.ownerId !== userId) {
      throw new ForbiddenException(
        'Only organizer owner can manage bank accounts',
      );
    }

    if (organizer.status !== OrganizerStatus.APPROVED) {
      throw new ForbiddenException('Organizer is not active');
    }

    return organizer;
  }
}
