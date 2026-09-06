import { Module } from '@nestjs/common';
import { OrganizersController } from './organizers.controller.js';
import { OrganizersService } from './organizers.service.js';

@Module({
  controllers: [OrganizersController],
  providers: [OrganizersService]
})
export class OrganizersModule {}
