import { InquiryStatus, OrderStatus, ProductMode, ProductStatus } from "@prisma/client";
import { toNumber } from "./money";

export type DemandLevel = "ALTA" | "MEDIA" | "BAJA";
export type ProductRecommendation = "REPONER" | "OBSERVAR" | "NO_RECOMPRAR";

type ProductMetricInput = {
  id: string;
  name: string;
  category: string;
  status: ProductStatus;
  mode: ProductMode;
  stock: number;
  doNotReorder: boolean;
  reorderBlockReason: string | null;
};

type OrderMetricInput = {
  productId: string;
  status: OrderStatus;
  amount: unknown;
  deposit: unknown;
  estimatedProfit: unknown;
  realizedProfit: unknown;
};

type InquiryMetricInput = {
  productId: string;
  status: InquiryStatus;
};

export type ProductOperationalMetric = {
  productId: string;
  productName: string;
  category: string;
  status: ProductStatus;
  mode: ProductMode;
  stock: number;
  inquiries: number;
  reservationsWithoutDeposit: number;
  reservationsWithDeposit: number;
  realDeposits: number;
  orders: number;
  delivered: number;
  committedRevenue: number;
  estimatedProfit: number;
  realizedProfit: number;
  demandScore: number;
  demandLevel: DemandLevel;
  recommendation: ProductRecommendation;
  recommendationReason: string;
};

export function buildProductOperationalMetrics(input: {
  products: ProductMetricInput[];
  orders: OrderMetricInput[];
  inquiries: InquiryMetricInput[];
}): ProductOperationalMetric[] {
  return input.products
    .map((product) => {
      const productInquiries = input.inquiries.filter((inquiry) => inquiry.productId === product.id);
      const activeOrders = input.orders.filter(
        (order) => order.productId === product.id && order.status !== OrderStatus.CANCELADO,
      );
      const reservationsWithoutDeposit = productInquiries.filter(
        (inquiry) => inquiry.status === InquiryStatus.RESERVA_SIN_SENA,
      ).length;
      const reservationsWithDeposit = productInquiries.filter(
        (inquiry) => inquiry.status === InquiryStatus.RESERVA_CON_SENA,
      ).length;
      const realDeposits = activeOrders.filter((order) => toNumber(order.deposit) > 0).length;
      const delivered = activeOrders.filter((order) => order.status === OrderStatus.ENTREGADO).length;
      const committedRevenue = activeOrders.reduce((sum, order) => sum + toNumber(order.amount), 0);
      const estimatedProfit = activeOrders.reduce((sum, order) => sum + toNumber(order.estimatedProfit), 0);
      const realizedProfit = activeOrders.reduce((sum, order) => sum + toNumber(order.realizedProfit), 0);
      const demandScore = getDemandScore({
        inquiries: productInquiries.length,
        reservationsWithoutDeposit,
        reservationsWithDeposit,
        realDeposits,
        orders: activeOrders.length,
        delivered,
      });
      const baseMetric = {
        productId: product.id,
        productName: product.name,
        category: product.category,
        status: product.status,
        mode: product.mode,
        stock: product.stock,
        inquiries: productInquiries.length,
        reservationsWithoutDeposit,
        reservationsWithDeposit,
        realDeposits,
        orders: activeOrders.length,
        delivered,
        committedRevenue,
        estimatedProfit,
        realizedProfit,
        demandScore,
        demandLevel: getDemandLevel(demandScore),
      };
      const recommendation = getProductRecommendation({ ...baseMetric, product });

      return {
        ...baseMetric,
        recommendation: recommendation.recommendation,
        recommendationReason: recommendation.recommendationReason,
      };
    })
    .sort((a, b) => b.demandScore - a.demandScore);
}

function getDemandScore(input: {
  inquiries: number;
  reservationsWithoutDeposit: number;
  reservationsWithDeposit: number;
  realDeposits: number;
  orders: number;
  delivered: number;
}) {
  return Math.min(
    100,
    input.inquiries * 1 +
      input.reservationsWithoutDeposit * 3 +
      input.reservationsWithDeposit * 6 +
      input.realDeposits * 8 +
      input.orders * 10 +
      input.delivered * 12,
  );
}

function getDemandLevel(score: number): DemandLevel {
  if (score >= 70) return "ALTA";
  if (score >= 35) return "MEDIA";
  return "BAJA";
}

function getProductRecommendation(input: {
  product: ProductMetricInput;
  inquiries: number;
  realDeposits: number;
  orders: number;
  delivered: number;
  estimatedProfit: number;
}): { recommendation: ProductRecommendation; recommendationReason: string } {
  if (input.product.doNotReorder) {
    return {
      recommendation: "NO_RECOMPRAR",
      recommendationReason: input.product.reorderBlockReason ?? "Producto bloqueado para recompra.",
    };
  }

  if (input.inquiries >= 10 && input.realDeposits <= 1 && input.delivered === 0) {
    return {
      recommendation: "NO_RECOMPRAR",
      recommendationReason: "Muchas consultas, pero pocas señas y sin entregas.",
    };
  }

  if (input.orders > 0 && input.estimatedProfit <= 0) {
    return {
      recommendation: "NO_RECOMPRAR",
      recommendationReason: "Tiene pedidos, pero la ganancia estimada no es sana.",
    };
  }

  if ((input.realDeposits > 0 || input.delivered > 0) && input.orders > 0 && input.estimatedProfit > 0) {
    return {
      recommendation: "REPONER",
      recommendationReason: "Tiene señas, pedidos o entregas con ganancia estimada positiva.",
    };
  }

  return {
    recommendation: "OBSERVAR",
    recommendationReason: "Hay que juntar más señas o pedidos antes de comprar.",
  };
}
