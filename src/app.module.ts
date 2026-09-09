import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { OrganizersModule } from './modules/organizers/organizers.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { VenuesModule } from './modules/venues/venues.module.js';
import { TicketsModule } from './modules/tickets/tickets.module.js';
import { ReservationsModule } from './modules/reservations/reservations.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { CheckInModule } from './modules/check-in/check-in.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { PrismaModule } from './modules/prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizersModule,
    EventsModule,
    CategoriesModule,
    VenuesModule,
    TicketsModule,
    ReservationsModule,
    OrdersModule,
    PaymentsModule,
    CheckInModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
