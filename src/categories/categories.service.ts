import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CategoriesDto } from './dto/categories.dto.js';
import { UpdateCategoriesDto } from './dto/updateCategories.dt.js';
import { UpdateCategoryStatusDto } from './dto/updateCategoryStatus.dt.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      // data,
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  create(data: CategoriesDto) {

    return this.prisma.category.create({
      data: {
        name:data.name,
        description:data.description,
        slug:data.slug,
      },
    });
  }

  update(id: string, data: UpdateCategoriesDto) {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }
  updateStatus(id: string, data: UpdateCategoryStatusDto) {
    return this.prisma.category.update({
      where: { id },
      data:{
        isActive:data.isActive
      },
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
