import { Injectable } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { toNumber } from "../../common/money";

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getCashPosition() {
    const [snapshot, openOrders] = await Promise.all([
      this.prisma.cashSnapshot.findFirst({ orderBy: { date: "desc" } }),
      this.prisma.order.findMany({
        where: { status: { in: [OrderStatus.SENADO, OrderStatus.COMPRADO_PROVEEDOR, OrderStatus.EN_TRANSITO] } },
      }),
    ]);

    const cashAvailable = toNumber(snapshot?.cashAvailable);
    const cashInTransit = toNumber(snapshot?.cashInTransit);
    const committedCapital = openOrders.reduce((sum, order) => sum + toNumber(order.supplierCost), 0);
    const depositsCollected = openOrders.reduce((sum, order) => sum + toNumber(order.deposit), 0);
    const netCashExposure = Math.max(committedCapital - depositsCollected, 0);

    return {
      cashAvailable,
      cashInTransit,
      committedCapital,
      depositsCollected,
      netCashExposure,
      freeCashAfterCommitments: cashAvailable - netCashExposure,
      snapshotDate: snapshot?.date ?? null,
    };
  }

  createSnapshot(data: { cashAvailable: number; cashInTransit?: number; notes?: string }) {
    return this.prisma.cashSnapshot.create({ data });
  }
}
