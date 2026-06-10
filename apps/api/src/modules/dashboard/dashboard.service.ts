import { Injectable } from "@nestjs/common";
import { InquiryStatus, OrderStatus, ProductStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { toNumber } from "../../common/money";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [orders, productsActive, customers, topConsulted, ranking, inquiries, cashSnapshot, products] = await Promise.all([
      this.prisma.order.findMany({ include: { product: true, customer: true, provider: true } }),
      this.prisma.product.count({ where: { status: ProductStatus.ACTIVO } }),
      this.prisma.customer.count(),
      this.prisma.product.findMany({ orderBy: { inquiries: "desc" }, take: 5 }),
      this.prisma.order.groupBy({
        by: ["productId"],
        where: { status: OrderStatus.ENTREGADO },
        _sum: { quantity: true, amount: true, estimatedProfit: true, realizedProfit: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      this.prisma.inquiry.findMany(),
      this.prisma.cashSnapshot.findFirst({ orderBy: { date: "desc" } }),
      this.prisma.product.findMany({ include: { orders: true, inquiryEvents: true } }),
    ]);

    const productIds = ranking.map((item) => item.productId);
    const rankedProducts = await this.prisma.product.findMany({ where: { id: { in: productIds } } });
    const productById = new Map(rankedProducts.map((product) => [product.id, product]));

    const totalSales = orders
      .filter((order) => order.status !== OrderStatus.CANCELADO)
      .reduce((sum, order) => sum + toNumber(order.amount), 0);
    const collectedRevenue = orders.reduce((sum, order) => sum + toNumber(order.amountPaid), 0);
    const committedStatuses = new Set<OrderStatus>([
      OrderStatus.SENADO,
      OrderStatus.COMPRADO_PROVEEDOR,
      OrderStatus.EN_TRANSITO,
    ]);
    const committedOrders = orders.filter((order) => committedStatuses.has(order.status));
    const committedCapital = committedOrders.reduce((sum, order) => sum + toNumber(order.supplierCost), 0);
    const depositsCollected = committedOrders.reduce((sum, order) => sum + toNumber(order.deposit), 0);
    const netCashExposure = Math.max(committedCapital - depositsCollected, 0);
    const cashAvailable = toNumber(cashSnapshot?.cashAvailable);
    const freeCapital = cashAvailable - netCashExposure;

    const validatedDemand = products
      .map((product) => {
        const productOrders = product.orders.filter((order) => order.status !== OrderStatus.CANCELADO);
        const deposits = productOrders.filter((order) => toNumber(order.deposit) > 0).length;
        const delivered = productOrders.filter((order) => order.status === OrderStatus.ENTREGADO).length;
        const lost = product.inquiryEvents.filter((inquiry) => inquiry.status === InquiryStatus.PERDIDA).length;
        const realProfit = productOrders.reduce((sum, order) => sum + toNumber(order.realizedProfit), 0);
        return {
          productId: product.id,
          productName: product.name,
          inquiries: product.inquiries,
          deposits,
          delivered,
          lost,
          realProfit,
          demandScore: deposits * 3 + delivered * 5 + Math.max(realProfit, 0) / 10000 - lost * 2,
        };
      })
      .sort((a, b) => b.demandScore - a.demandScore)
      .slice(0, 5);

    const productsToPause = products
      .map((product) => {
        const productOrders = product.orders.filter((order) => order.status !== OrderStatus.CANCELADO);
        const deposits = productOrders.filter((order) => toNumber(order.deposit) > 0).length;
        const delivered = productOrders.filter((order) => order.status === OrderStatus.ENTREGADO).length;
        const margin = toNumber(product.wholesalePrice) - toNumber(product.cost);
        const shouldPause = product.doNotReorder || (product.inquiries >= 10 && deposits === 0) || margin <= 0;
        return {
          productId: product.id,
          productName: product.name,
          inquiries: product.inquiries,
          deposits,
          delivered,
          margin,
          reason: product.reorderBlockReason ?? (margin <= 0 ? "Margen no sano" : "Demanda sin senas suficientes"),
          shouldPause,
        };
      })
      .filter((product) => product.shouldPause)
      .slice(0, 5);

    const atRiskOrders = orders
      .filter((order) => {
        const isOpen = committedStatuses.has(order.status);
        const capitalExposure = Math.max(toNumber(order.supplierCost) - toNumber(order.deposit), 0);
        return isOpen && (Boolean(order.riskNote) || order.status === OrderStatus.EN_TRANSITO || capitalExposure > 0);
      })
      .map((order) => ({
        orderId: order.id,
        customerName: order.customer.name,
        productName: order.product.name,
        providerName: order.provider?.name ?? "Sin proveedor",
        status: order.status,
        riskNote: order.riskNote ?? "Revisar demora/cumplimiento del proveedor",
      }))
      .slice(0, 5);

    return {
      totalSales,
      collectedRevenue,
      pendingOrders: orders.filter((order) => order.status === OrderStatus.CONSULTA).length,
      depositedOrders: orders.filter((order) => order.status === OrderStatus.SENADO).length,
      activeProducts: productsActive,
      registeredCustomers: customers,
      estimatedProfit: orders.reduce((sum, order) => sum + toNumber(order.estimatedProfit), 0),
      realizedProfit: orders.reduce((sum, order) => sum + toNumber(order.realizedProfit), 0),
      cashAvailable,
      committedCapital,
      depositsCollected,
      netCashExposure,
      freeCapital,
      lostInquiries: inquiries.filter((inquiry) => inquiry.status === InquiryStatus.PERDIDA).length,
      reservationsWithoutDeposit: inquiries.filter((inquiry) => inquiry.status === InquiryStatus.RESERVA_SIN_SENA).length,
      topConsultedProducts: topConsulted.map((product) => ({
        id: product.id,
        name: product.name,
        inquiries: product.inquiries,
      })),
      validatedDemand,
      productsToPause,
      atRiskOrders,
      productRanking: ranking.map((item) => ({
        productId: item.productId,
        productName: productById.get(item.productId)?.name ?? "Producto",
        quantity: item._sum.quantity ?? 0,
        sales: toNumber(item._sum.amount),
        profit: toNumber(item._sum.estimatedProfit),
        realizedProfit: toNumber(item._sum.realizedProfit),
      })),
    };
  }
}
