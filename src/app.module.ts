import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { CheckInModule } from './check-in/check-in.module.js';
import { EventsModule } from './events/events.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { OrganizerMemberModule } from './organizer-member/organizer-member.module.js';
import { OrganizerModule } from './organizers/organizers.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { MailModule } from './resend/resend.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { UsersModule } from './users/users.module.js';
import { VenuesModule } from './venues/venues.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizerModule,
    EventsModule,
    CategoriesModule,
    VenuesModule,
    TicketsModule,
    ReservationsModule,
    OrdersModule,
    PaymentsModule,
    CheckInModule,
    NotificationsModule,
    OrganizerMemberModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
