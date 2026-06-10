import { Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { toNumber } from "../../common/money";

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.customer.findMany({ include: { orders: true, favoriteProducts: true } });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { orders: { include: { product: true } }, favoriteProducts: true },
    });
    if (!customer) throw new NotFoundException("Cliente no encontrado");
    return customer;
  }

  create(data: Record<string, unknown>) {
    return this.prisma.customer.create({ data: data as any });
  }

  update(id: string, data: Record<string, unknown>) {
    return this.prisma.customer.update({ where: { id }, data: data as any });
  }

  remove(id: string) {
    return this.prisma.customer.delete({ where: { id } });
  }

  async ranking() {
    const grouped = await this.prisma.order.groupBy({
      by: ["customerId"],
      where: { status: { not: OrderStatus.CANCELADO } },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    const customers = await this.prisma.customer.findMany({ where: { id: { in: grouped.map((row) => row.customerId) } } });
    const byId = new Map(customers.map((customer) => [customer.id, customer]));

    return grouped.map((row) => ({
      customerId: row.customerId,
      name: byId.get(row.customerId)?.name ?? "Cliente",
      city: byId.get(row.customerId)?.city ?? "",
      purchases: row._count.id,
      totalSpent: toNumber(row._sum.amount),
      vip: toNumber(row._sum.amount) >= 300000 || row._count.id >= 3,
    }));
  }
}
