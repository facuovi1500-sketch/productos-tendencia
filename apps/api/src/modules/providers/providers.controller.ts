import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ProvidersService } from "./providers.service";

@Controller("providers")
export class ProvidersController {
  constructor(private readonly service: ProvidersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get("compare/:productId")
  compareProduct(@Param("productId") productId: string) {
    return this.service.compareProduct(productId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: Record<string, unknown>) {
    return this.service.create(data);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() data: Record<string, unknown>) {
    return this.service.update(id, data);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
