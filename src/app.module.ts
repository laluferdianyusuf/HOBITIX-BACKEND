import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { OrganizersModule } from './organizers/organizers.module.js';
import { EventsModule } from './events/events.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { VenuesModule } from './venues/venues.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { CheckInModule } from './check-in/check-in.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';

@Module({
  imports: [AuthModule, UsersModule, OrganizersModule, EventsModule, CategoriesModule, VenuesModule, TicketsModule, ReservationsModule, OrdersModule, PaymentsModule, CheckInModule, NotificationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
