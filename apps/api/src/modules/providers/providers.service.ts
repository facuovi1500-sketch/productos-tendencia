import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { toNumber } from "../../common/money";

function providerReliabilityScore(provider: {
  onTimeDeliveries: number;
  lateDeliveries: number;
  failedDeliveries: number;
  claimsCount: number;
}) {
  const totalDeliveries = provider.onTimeDeliveries + provider.lateDeliveries + provider.failedDeliveries;
  const onTimeRate = totalDeliveries > 0 ? (provider.onTimeDeliveries / totalDeliveries) * 100 : 60;
  const penalty = provider.lateDeliveries * 6 + provider.failedDeliveries * 15 + provider.claimsCount * 10;
  return Math.max(0, Math.min(100, onTimeRate - penalty));
}

function finalProviderScore(input: {
  price: number;
  cheapestPrice: number;
  reliabilityScore: number;
  quality: number;
  leadTimeDays: number;
}) {
  const priceScore = input.price > 0 ? Math.min(100, (input.cheapestPrice / input.price) * 100) : 0;
  const qualityScore = Math.max(0, Math.min(100, input.quality * 10));
  const deliveryScore = Math.max(0, 100 - input.leadTimeDays * 4);
  return Math.round(priceScore * 0.35 + input.reliabilityScore * 0.4 + qualityScore * 0.15 + deliveryScore * 0.1);
}

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.provider.findMany({ include: { products: { include: { product: true } } } });
  }

  async findOne(id: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      include: { products: { include: { product: true } } },
    });
    if (!provider) throw new NotFoundException("Proveedor no encontrado");
    return provider;
  }

  create(data: Record<string, unknown>) {
    return this.prisma.provider.create({ data: data as any });
  }

  update(id: string, data: Record<string, unknown>) {
    return this.prisma.provider.update({ where: { id }, data: data as any });
  }

  remove(id: string) {
    return this.prisma.provider.delete({ where: { id } });
  }

  async compareProduct(productId: string) {
    const offers = await this.prisma.providerProduct.findMany({
      where: { productId },
      include: { provider: true, product: true },
      orderBy: { purchasePrice: "asc" },
    });

    if (!offers.length) {
      return { productId, cheapest: null, offers: [] };
    }

    const cheapestPrice = toNumber(offers[0].purchasePrice);
    const comparedOffers = offers
      .map((offer) => {
        const price = toNumber(offer.purchasePrice);
        const reliabilityScore = providerReliabilityScore(offer.provider);
        const finalScore = finalProviderScore({
          price,
          cheapestPrice,
          reliabilityScore,
          quality: offer.provider.quality,
          leadTimeDays: offer.provider.leadTimeDays,
        });

        return {
          providerId: offer.providerId,
          providerName: offer.provider.name,
          city: offer.provider.city,
          purchasePrice: price,
          moq: offer.moq,
          leadTimeDays: offer.provider.leadTimeDays,
          quality: offer.provider.quality,
          lateDeliveries: offer.provider.lateDeliveries,
          failedDeliveries: offer.provider.failedDeliveries,
          claimsCount: offer.provider.claimsCount,
          reliabilityScore,
          finalScore,
          recommendation:
            reliabilityScore < 50
              ? "Evitar salvo urgencia: cumplimiento debil"
              : finalScore >= 80
                ? "Proveedor conveniente"
                : finalScore >= 65
                  ? "Proveedor viable con control"
                  : "Usar solo si no hay alternativa mejor",
          priceDifferencePct: cheapestPrice > 0 ? ((price - cheapestPrice) / cheapestPrice) * 100 : 0,
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);

    const cheapest = offers[0];
    const recommended = comparedOffers[0];

    return {
      productId,
      productName: offers[0].product.name,
      cheapest: {
        providerId: cheapest.providerId,
        providerName: cheapest.provider.name,
        purchasePrice: cheapestPrice,
      },
      recommended: recommended
        ? {
            providerId: recommended.providerId,
            providerName: recommended.providerName,
            purchasePrice: recommended.purchasePrice,
            reliabilityScore: recommended.reliabilityScore,
            finalScore: recommended.finalScore,
            recommendation: recommended.recommendation,
          }
        : null,
      offers: comparedOffers,
    };
  }
}
