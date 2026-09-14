import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrganizerMemberRole,
  OrganizerMemberStatus,
  OrganizerStatus,
} from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { InviteMemberDto } from './dto/invite-member.dto.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';

@Injectable()
export class OrganizerMemberService {
  constructor(private readonly prisma: PrismaService) {}

  async invite(ownerId: string, organizerId: string, dto: InviteMemberDto) {
    const organizer = await this.prisma.organizer.findUnique({
      where: {
        id: organizerId,
      },
    });

    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }

    if (organizer.ownerId !== ownerId) {
      throw new ForbiddenException('You are not the organizer owner');
    }

    if (organizer.status !== OrganizerStatus.APPROVED) {
      throw new BadRequestException('Organizer is not active');
    }

    if (dto.role === OrganizerMemberRole.OWNER) {
      throw new BadRequestException('OWNER role cannot be invited');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found. User must register first.');
    }

    if (user.id === organizer.ownerId) {
      throw new BadRequestException('Organizer owner is already the owner');
    }

    const existing = await this.prisma.organizerMember.findUnique({
      where: {
        organizerId_userId: {
          organizerId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      if (existing.status === OrganizerMemberStatus.INVITED) {
        throw new ConflictException('User already has a pending invitation');
      }

      if (existing.status === OrganizerMemberStatus.ACTIVE) {
        throw new ConflictException('User is already an active member');
      }

      return this.prisma.organizerMember.update({
        where: {
          id: existing.id,
        },
        data: {
          role: dto.role,
          status: OrganizerMemberStatus.INVITED,
          joinedAt: null,
        },
        include: {
          user: true,
        },
      });
    }

    return this.prisma.organizerMember.create({
      data: {
        organizerId,
        userId: user.id,

        role: dto.role,

        status: OrganizerMemberStatus.INVITED,
      },

      include: {
        user: true,
      },
    });
  }

  async findMembers(userId: string, organizerId: string) {
    await this.validateMember(userId, organizerId);

    return this.prisma.organizerMember.findMany({
      where: {
        organizerId,

        status: OrganizerMemberStatus.ACTIVE,
      },

      include: {
        user: true,
      },

      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findAllMembers(userId: string, organizerId: string) {
    const member = await this.validateMember(userId, organizerId);

    if (
      member.role !== OrganizerMemberRole.OWNER &&
      member.role !== OrganizerMemberRole.MANAGER
    ) {
      throw new ForbiddenException('You do not have permission');
    }

    return this.prisma.organizerMember.findMany({
      where: {
        organizerId,
      },

      include: {
        user: true,
      },

      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findMyInvitations(userId: string) {
    return this.prisma.organizerMember.findMany({
      where: {
        userId,

        status: OrganizerMemberStatus.INVITED,
      },

      include: {
        organizer: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async acceptInvitation(userId: string, memberId: string) {
    const member = await this.prisma.organizerMember.findUnique({
      where: {
        id: memberId,
      },
    });

    if (!member) {
      throw new NotFoundException('Invitation not found');
    }

    if (member.userId !== userId) {
      throw new ForbiddenException('This invitation does not belong to you');
    }

    if (member.status !== OrganizerMemberStatus.INVITED) {
      throw new BadRequestException('Invitation is no longer active');
    }

    return this.prisma.organizerMember.update({
      where: {
        id: memberId,
      },

      data: {
        status: OrganizerMemberStatus.ACTIVE,

        joinedAt: new Date(),
      },

      include: {
        organizer: true,
      },
    });
  }

  async rejectInvitation(userId: string, memberId: string) {
    const member = await this.prisma.organizerMember.findUnique({
      where: {
        id: memberId,
      },
    });

    if (!member) {
      throw new NotFoundException('Invitation not found');
    }

    if (member.userId !== userId) {
      throw new ForbiddenException('This invitation does not belong to you');
    }

    if (member.status !== OrganizerMemberStatus.INVITED) {
      throw new BadRequestException('Invitation is no longer active');
    }

    return this.prisma.organizerMember.update({
      where: {
        id: memberId,
      },

      data: {
        status: OrganizerMemberStatus.REJECTED,
      },
    });
  }

  async updateRole(
    ownerId: string,
    organizerId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const owner = await this.validateMember(ownerId, organizerId);

    if (owner.role !== OrganizerMemberRole.OWNER) {
      throw new ForbiddenException('Only organizer owner can change roles');
    }

    if (dto.role === OrganizerMemberRole.OWNER) {
      throw new BadRequestException('Cannot assign OWNER role');
    }

    const member = await this.prisma.organizerMember.findUnique({
      where: {
        id: memberId,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.organizerId !== organizerId) {
      throw new BadRequestException('Member does not belong to this organizer');
    }

    if (member.status !== OrganizerMemberStatus.ACTIVE) {
      throw new BadRequestException(
        'Only active members can have their role changed',
      );
    }

    if (member.role === OrganizerMemberRole.OWNER) {
      throw new BadRequestException('Owner role cannot be changed');
    }

    return this.prisma.organizerMember.update({
      where: {
        id: memberId,
      },

      data: {
        role: dto.role,
      },

      include: {
        user: true,
      },
    });
  }

  async removeMember(ownerId: string, organizerId: string, memberId: string) {
    const owner = await this.validateMember(ownerId, organizerId);

    if (owner.role !== OrganizerMemberRole.OWNER) {
      throw new ForbiddenException('Only organizer owner can remove members');
    }

    const member = await this.prisma.organizerMember.findUnique({
      where: {
        id: memberId,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.organizerId !== organizerId) {
      throw new BadRequestException('Member does not belong to this organizer');
    }

    if (member.role === OrganizerMemberRole.OWNER) {
      throw new BadRequestException('Organizer owner cannot be removed');
    }

    return this.prisma.organizerMember.update({
      where: {
        id: memberId,
      },

      data: {
        status: OrganizerMemberStatus.REMOVED,
      },
    });
  }

  async validateMember(userId: string, organizerId: string) {
    const member = await this.prisma.organizerMember.findUnique({
      where: {
        organizerId_userId: {
          organizerId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this organizer');
    }

    if (member.status !== OrganizerMemberStatus.ACTIVE) {
      throw new ForbiddenException('Your organizer membership is not active');
    }

    return member;
  }

  async hasRole(
    userId: string,
    organizerId: string,
    roles: OrganizerMemberRole[],
  ) {
    const member = await this.validateMember(userId, organizerId);

    return roles.includes(member.role);
  }
}
