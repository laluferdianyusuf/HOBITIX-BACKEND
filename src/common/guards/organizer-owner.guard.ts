import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class OrganizerOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const userId = request.user?.id;
    const organizerId = request.params?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!organizerId) {
      throw new ForbiddenException('Organizer ID is required');
    }

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

    request.organizer = organizer;

    return true;
  }
}
