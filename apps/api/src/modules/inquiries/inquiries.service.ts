import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class InquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.inquiry.findMany({
      include: { product: true, customer: true, order: { include: { product: true, customer: true, provider: true } } },
      orderBy: { date: "desc" },
    });
  }

  async findOne(id: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: { product: true, customer: true, order: { include: { product: true, customer: true, provider: true } } },
    });
    if (!inquiry) throw new NotFoundException("Consulta no encontrada");
    return inquiry;
  }

  async create(data: Record<string, unknown>) {
    const inquiry = await this.prisma.inquiry.create({ data: data as any });
    await this.prisma.product.update({
      where: { id: String(data.productId) },
      data: { inquiries: { increment: 1 } },
    });
    return inquiry;
  }

  update(id: string, data: Record<string, unknown>) {
    return this.prisma.inquiry.update({ where: { id }, data: data as any });
  }

  remove(id: string) {
    return this.prisma.inquiry.delete({ where: { id } });
  }
}
