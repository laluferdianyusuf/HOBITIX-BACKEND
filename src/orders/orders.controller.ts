import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, dto);
  }

  @Get()
  findMyOrders(@Req() req: any) {
    return this.ordersService.findMyOrders(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') orderId: string) {
    return this.ordersService.findMyOrder(req.user.id, orderId);
  }

  @Get('number/:orderNumber')
  findByNumber(
    @Req() req: any,
    @Param('orderNumber')
    orderNumber: string,
  ) {
    return this.ordersService.findMyOrderByNumber(req.user.id, orderNumber);
  }

  @Delete(':id')
  cancel(@Req() req: any, @Param('id') orderId: string) {
    return this.ordersService.cancel(req.user.id, orderId);
  }
}
