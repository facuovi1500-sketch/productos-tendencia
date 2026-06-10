import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CommunityService } from "./community.service";

@Controller("community")
export class CommunityController {
  constructor(private readonly service: CommunityService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get("growth")
  growth() {
    return this.service.growth();
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
