import { Injectable } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { toNumber } from "../../common/money";

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics() {
    const [products, deliveredOrders, allOrders, providerOffers, providers] = await Promise.all([
      this.prisma.product.findMany(),
      this.prisma.order.findMany({ where: { status: OrderStatus.ENTREGADO }, include: { product: true } }),
      this.prisma.order.findMany({ include: { product: true } }),
      this.prisma.providerProduct.findMany({ include: { provider: true, product: true } }),
      this.prisma.provider.findMany(),
    ]);

    const productStats = products.map((product) => {
      const orders = allOrders.filter((order) => order.productId === product.id);
      const delivered = orders.filter((order) => order.status === OrderStatus.ENTREGADO);
      return {
        productId: product.id,
        productName: product.name,
        soldUnits: delivered.reduce((sum, order) => sum + order.quantity, 0),
        inquiries: product.inquiries,
        deposits: orders.filter((order) => toNumber(order.deposit) > 0).length,
        realizedProfit: orders.reduce((sum, order) => sum + toNumber(order.realizedProfit), 0),
        shouldPause: product.doNotReorder,
        pauseReason: product.reorderBlockReason,
        conversionRate: product.inquiries > 0 ? (delivered.length / product.inquiries) * 100 : 0,
      };
    });

    const monthlyEstimatedProfit = new Map<string, number>();
    const monthlyRealizedProfit = new Map<string, number>();
    for (const order of deliveredOrders) {
      const month = order.date.toISOString().slice(0, 7);
      monthlyEstimatedProfit.set(month, (monthlyEstimatedProfit.get(month) ?? 0) + toNumber(order.estimatedProfit));
    }

    for (const order of allOrders) {
      const month = order.date.toISOString().slice(0, 7);
      monthlyRealizedProfit.set(month, (monthlyRealizedProfit.get(month) ?? 0) + toNumber(order.realizedProfit));
    }

    const providerProfit = new Map<string, { providerName: string; margin: number }>();
    for (const offer of providerOffers) {
      const margin = toNumber(offer.product.wholesalePrice) - toNumber(offer.purchasePrice);
      const current = providerProfit.get(offer.providerId) ?? { providerName: offer.provider.name, margin: 0 };
      current.margin += margin;
      providerProfit.set(offer.providerId, current);
    }

    return {
      bestSellingProducts: productStats.sort((a, b) => b.soldUnits - a.soldUnits).slice(0, 5),
      mostConsultedProducts: [...productStats].sort((a, b) => b.inquiries - a.inquiries).slice(0, 5),
      productConversion: productStats.sort((a, b) => b.conversionRate - a.conversionRate),
      monthlyEstimatedProfit: Array.from(monthlyEstimatedProfit.entries()).map(([month, profit]) => ({ month, profit })),
      monthlyRealizedProfit: Array.from(monthlyRealizedProfit.entries()).map(([month, profit]) => ({ month, profit })),
      accumulatedProfit: deliveredOrders.reduce((sum, order) => sum + toNumber(order.estimatedProfit), 0),
      accumulatedRealizedProfit: allOrders.reduce((sum, order) => sum + toNumber(order.realizedProfit), 0),
      mostProfitableProvider:
        Array.from(providerProfit.values()).sort((a, b) => b.margin - a.margin)[0] ?? null,
      providerReliability: providers
        .map((provider) => {
          const total = provider.onTimeDeliveries + provider.lateDeliveries + provider.failedDeliveries;
          const reliabilityScore = total > 0 ? (provider.onTimeDeliveries / total) * 100 - provider.claimsCount * 5 : 0;
          return {
            providerId: provider.id,
            providerName: provider.name,
            onTimeDeliveries: provider.onTimeDeliveries,
            lateDeliveries: provider.lateDeliveries,
            failedDeliveries: provider.failedDeliveries,
            claimsCount: provider.claimsCount,
            reliabilityScore,
          };
        })
        .sort((a, b) => b.reliabilityScore - a.reliabilityScore),
      productsNotToReorder: productStats.filter((product) => product.shouldPause),
    };
  }
}
