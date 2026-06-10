import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany({
      include: { mainProvider: true, alternateProvider: true, providerOffers: { include: { provider: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { mainProvider: true, alternateProvider: true, providerOffers: { include: { provider: true } } },
    });
    if (!product) throw new NotFoundException("Producto no encontrado");
    return product;
  }

  create(data: Record<string, unknown>) {
    return this.prisma.product.create({ data: data as any });
  }

  update(id: string, data: Record<string, unknown>) {
    return this.prisma.product.update({ where: { id }, data: data as any });
  }

  remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}
