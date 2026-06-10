import { Body, Delete, Get, Param, Patch, Post } from "@nestjs/common";

export abstract class CrudController<TService extends {
  findAll: () => Promise<unknown>;
  findOne: (id: string) => Promise<unknown>;
  create: (data: Record<string, unknown>) => Promise<unknown>;
  update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
}> {
  protected constructor(protected readonly service: TService) {}

  @Get()
  findAll() {
    return this.service.findAll();
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
