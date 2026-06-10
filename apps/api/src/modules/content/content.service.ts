import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.contentItem.findMany({ include: { product: true }, orderBy: { date: "asc" } });
  }

  async findOne(id: string) {
    const item = await this.prisma.contentItem.findUnique({ where: { id }, include: { product: true } });
    if (!item) throw new NotFoundException("Contenido no encontrado");
    return item;
  }

  create(data: Record<string, unknown>) {
    return this.prisma.contentItem.create({ data: data as any });
  }

  update(id: string, data: Record<string, unknown>) {
    return this.prisma.contentItem.update({ where: { id }, data: data as any });
  }

  remove(id: string) {
    return this.prisma.contentItem.delete({ where: { id } });
  }
}
