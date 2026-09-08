import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { OrganizersController } from './organizers.controller.js';
import { OrganizersService } from './organizers.service.js';
@Module({
  imports: [PrismaModule],
  controllers: [OrganizersController],
  providers: [OrganizersService],
  exports: [OrganizersService],
})
export class OrganizersModule {}
