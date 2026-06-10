import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.communityMember.findMany({ include: { customer: true }, orderBy: { joinedAt: "desc" } });
  }

  async findOne(id: string) {
    const member = await this.prisma.communityMember.findUnique({ where: { id }, include: { customer: true } });
    if (!member) throw new NotFoundException("Miembro no encontrado");
    return member;
  }

  create(data: Record<string, unknown>) {
    return this.prisma.communityMember.create({ data: data as any });
  }

  update(id: string, data: Record<string, unknown>) {
    return this.prisma.communityMember.update({ where: { id }, data: data as any });
  }

  remove(id: string) {
    return this.prisma.communityMember.delete({ where: { id } });
  }

  async growth() {
    const members = await this.prisma.communityMember.findMany({ orderBy: { joinedAt: "asc" } });
    const byMonth = new Map<string, { joined: number; purchased: number }>();

    for (const member of members) {
      const key = member.joinedAt.toISOString().slice(0, 7);
      const current = byMonth.get(key) ?? { joined: 0, purchased: 0 };
      current.joined += 1;
      current.purchased += member.hasPurchased ? 1 : 0;
      byMonth.set(key, current);
    }

    return Array.from(byMonth.entries()).map(([month, stats]) => ({
      month,
      ...stats,
      conversionRate: stats.joined > 0 ? (stats.purchased / stats.joined) * 100 : 0,
    }));
  }
}
