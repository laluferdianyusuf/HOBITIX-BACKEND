import { Controller, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/orders.dto.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Post(':id/payment-callback')
  paymentCallback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('providerReference') providerReference: string,
  ) {
    return this.ordersService.handlePaymentSuccess(id, providerReference);
  }
}
