import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  create(data: any) {
    return this.prisma.category.create({
      data,
    });
  }

  update(id: string, data: any) {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}
