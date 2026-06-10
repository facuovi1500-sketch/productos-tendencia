import { Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { orderFinancials, toNumber } from "../../common/money";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(status?: string) {
    return this.prisma.order.findMany({
      where: status ? { status: status as OrderStatus } : undefined,
      include: { customer: true, product: true, provider: true },
      orderBy: { date: "desc" },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { customer: true, product: true, provider: true } });
    if (!order) throw new NotFoundException("Pedido no encontrado");
    return order;
  }

  async create(data: Record<string, unknown>) {
    const product = await this.prisma.product.findUnique({ where: { id: String(data.productId) } });
    if (!product) throw new NotFoundException("Producto no encontrado");

    const quantity = Number(data.quantity ?? 1);
    const amount = Number(data.amount);
    const deposit = Number(data.deposit ?? 0);
    const status = (data.status as OrderStatus | undefined) ?? OrderStatus.CONSULTA;
    const supplierCost = status === OrderStatus.CONSULTA ? 0 : Number(data.supplierCost ?? quantity * toNumber(product.cost));
    const amountPaid = Number(data.amountPaid ?? deposit);
    const financials = orderFinancials({ quantity, amount, deposit, amountPaid, supplierCost, productCost: toNumber(product.cost) });

    return this.prisma.order.create({
      data: {
        ...(data as any),
        quantity,
        amount,
        deposit,
        status,
        amountPaid: financials.amountPaid,
        supplierCost: financials.supplierCost,
        pendingBalance: financials.pendingBalance,
        estimatedProfit: financials.estimatedProfit,
        realizedProfit: financials.realizedProfit,
      },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    const current = await this.findOne(id);
    const quantity = Number(data.quantity ?? current.quantity);
    const amount = Number(data.amount ?? current.amount);
    const deposit = Number(data.deposit ?? current.deposit);
    const status = (data.status as OrderStatus | undefined) ?? current.status;
    const supplierCost = status === OrderStatus.CONSULTA ? 0 : Number(data.supplierCost ?? current.supplierCost);
    const amountPaid = Number(data.amountPaid ?? current.amountPaid ?? deposit);
    const financials = orderFinancials({
      quantity,
      amount,
      deposit,
      amountPaid,
      supplierCost,
      productCost: toNumber(current.product.cost),
    });

    return this.prisma.order.update({
      where: { id },
      data: {
        ...(data as any),
        quantity,
        amount,
        deposit,
        status,
        amountPaid: financials.amountPaid,
        supplierCost: financials.supplierCost,
        pendingBalance: financials.pendingBalance,
        estimatedProfit: financials.estimatedProfit,
        realizedProfit: financials.realizedProfit,
      },
    });
  }

  remove(id: string) {
    return this.prisma.order.delete({ where: { id } });
  }
}
