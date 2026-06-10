import { Controller, Get } from "@nestjs/common";
import { MetricsService } from "./metrics.service";

@Controller("metrics")
export class MetricsController {
  constructor(private readonly service: MetricsService) {}

  @Get()
  getMetrics() {
    return this.service.getMetrics();
  }
}
