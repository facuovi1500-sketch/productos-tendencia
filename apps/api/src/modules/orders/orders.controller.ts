import { Controller, Get, Query } from "@nestjs/common";
import { CrudController } from "../../common/crud.controller";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController extends CrudController<OrdersService> {
  constructor(service: OrdersService) {
    super(service);
  }

  @Get()
  findAll(@Query("status") status?: string) {
    return this.service.findAll(status);
  }
}
