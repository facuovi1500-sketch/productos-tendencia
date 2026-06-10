import { Body, Controller, Get, Post } from "@nestjs/common";
import { FinanceService } from "./finance.service";

@Controller("finance")
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @Get("cash")
  getCashPosition() {
    return this.service.getCashPosition();
  }

  @Post("cash")
  createSnapshot(@Body() data: { cashAvailable: number; cashInTransit?: number; notes?: string }) {
    return this.service.createSnapshot(data);
  }
}
