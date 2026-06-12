import { BadRequestException, Injectable } from "@nestjs/common";
import { InquirySource, InquiryStatus, OrderStatus } from "@prisma/client";
import { orderFinancials, toNumber } from "../../common/money";
import { PrismaService } from "../../prisma/prisma.service";
import type { AssistantConfirmRequest, AssistantIntent, AssistantInterpretResponse } from "./assistant.types";

const openOrderStatuses = [OrderStatus.CONSULTA, OrderStatus.SENADO, OrderStatus.COMPRADO_PROVEEDOR, OrderStatus.EN_TRANSITO];

@Injectable()
export class AssistantService {
  constructor(private readonly prisma: PrismaService) {}

  async interpret(input: { text?: string }): Promise<AssistantInterpretResponse> {
    const text = input.text?.trim();
    if (!text) {
      throw new BadRequestException("Escribí qué pasó en el negocio.");
    }

    const [products, customers] = await Promise.all([
      this.prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
      this.prisma.customer.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    const normalized = normalize(text);
    const intent = detectIntent(normalized);
    const amount = extractAmount(text);
    const quantity = extractQuantity(normalized) ?? 1;
    const source = detectSource(normalized);
    const productMatches = findMatches(text, products, (product) => product.name);
    const customerMatches = findMatches(text, customers, (customer) => customer.name);
    const product = productMatches.length === 1 ? productMatches[0] : null;
    const customer = customerMatches.length === 1 ? customerMatches[0] : null;
    const warnings: string[] = [];
    const missingFields: string[] = [];

    if (normalized.includes("facebook")) warnings.push("Facebook no existe como origen en el modelo actual. Se guardará como OTRO.");
    if (productMatches.length > 1) warnings.push("Hay más de un producto posible. Elegí el producto exacto antes de confirmar.");
    if (customerMatches.length > 1) warnings.push("Hay más de un cliente posible. Elegí el cliente exacto antes de confirmar.");
    if (!product && requiresProduct(intent)) missingFields.push("Producto");
    if (!customer && requiresCustomer(intent)) missingFields.push("Cliente");

    if (intent === "UPDATE_CASH") {
      if (amount == null) missingFields.push("Caja disponible");
      return buildResponse({
        intent,
        confidence: amount == null ? 0.55 : 0.9,
        title: "Actualizar caja real",
        summary: amount == null ? "Falta indicar el monto de caja." : `Actualizar caja real a ${formatMoney(amount)}.`,
        fields: { caja: amount },
        warnings,
        missingFields,
        payload: { cashAvailable: amount, notes: "Actualizado desde Asistente Operativo" },
      });
    }

    if (intent === "REGISTER_DEPOSIT") {
      const order = customer ? await this.findUniqueOpenOrder(customer.id, product?.id) : null;
      if (!order) missingFields.push("Pedido único");
      if (amount == null) missingFields.push("Monto de seña/cobro");
      return buildResponse({
        intent,
        confidence: order && amount != null ? 0.82 : 0.56,
        title: "Registrar seña o cobro",
        summary: order ? `Registrar ${formatMoney(amount ?? 0)} en pedido de ${customer?.name}.` : "No encontré un pedido único para actualizar.",
        fields: {
          cliente: customer?.name ?? null,
          producto: product?.name ?? order?.product.name ?? null,
          monto: amount,
          pedido: order?.id ?? null,
        },
        warnings,
        missingFields,
        payload: { orderId: order?.id, amount },
      });
    }

    if (intent === "MARK_ORDER_DELIVERED") {
      const order = customer ? await this.findUniqueOpenOrder(customer.id, product?.id) : null;
      if (!order) missingFields.push("Pedido único");
      return buildResponse({
        intent,
        confidence: order ? 0.82 : 0.55,
        title: "Marcar pedido como entregado",
        summary: order ? `Marcar como entregado el pedido de ${customer?.name}.` : "No encontré un pedido único para marcar como entregado.",
        fields: {
          cliente: customer?.name ?? null,
          producto: product?.name ?? order?.product.name ?? null,
          estadoNuevo: "ENTREGADO",
          pedido: order?.id ?? null,
        },
        warnings,
        missingFields,
        payload: { orderId: order?.id },
      });
    }

    if (intent === "MARK_INQUIRY_LOST") {
      const inquiry = product ? await this.findUniqueOpenInquiry(product.id, customer?.id) : null;
      if (!inquiry) missingFields.push("Consulta única");
      return buildResponse({
        intent,
        confidence: inquiry ? 0.8 : 0.55,
        title: "Marcar consulta como perdida",
        summary: inquiry ? `Marcar como perdida la consulta por ${inquiry.product.name}.` : "No encontré una consulta única para cerrar.",
        fields: {
          cliente: customer?.name ?? inquiry?.customer?.name ?? null,
          producto: product?.name ?? inquiry?.product.name ?? null,
          estadoNuevo: "PERDIDA",
          consulta: inquiry?.id ?? null,
        },
        warnings,
        missingFields,
        payload: { inquiryId: inquiry?.id, note: text },
      });
    }

    if (intent === "CREATE_ORDER") {
      const inferredAmount = product ? toNumber(product.retailPrice) * quantity : null;
      const totalAmount = extractTotalAmount(normalized, amount) ?? inferredAmount;
      if (totalAmount == null || totalAmount <= 0) missingFields.push("Monto total");
      const hasDeposit = amount != null && amount > 0;
      return buildResponse({
        intent,
        confidence: product && customer ? 0.78 : 0.58,
        title: hasDeposit ? "Crear pedido señado" : "Crear pedido",
        summary: `${customer?.name ?? "Cliente sin confirmar"} reservó ${quantity} unidad/es de ${product?.name ?? "producto sin confirmar"}.`,
        fields: {
          cliente: customer?.name ?? null,
          producto: product?.name ?? null,
          cantidad: quantity,
          montoTotal: totalAmount,
          sena: amount,
          estado: hasDeposit ? "SENADO" : "CONSULTA",
        },
        warnings: totalAmount === inferredAmount ? [...warnings, "Monto total inferido con precio minorista del producto. Confirmá antes de guardar."] : warnings,
        missingFields,
        payload: {
          customerId: customer?.id,
          productId: product?.id,
          quantity,
          amount: totalAmount,
          deposit: hasDeposit ? amount : 0,
          amountPaid: hasDeposit ? amount : 0,
          status: hasDeposit ? OrderStatus.SENADO : OrderStatus.CONSULTA,
        },
      });
    }

    return buildResponse({
      intent: "CREATE_INQUIRY",
      confidence: product ? 0.76 : 0.56,
      title: "Crear consulta",
      summary: `${customer?.name ?? "Cliente sin registrar"} consultó por ${product?.name ?? "producto sin confirmar"}.`,
      fields: {
        cliente: customer?.name ?? null,
        producto: product?.name ?? null,
        origen: source,
        estado: "ABIERTA",
      },
      warnings,
      missingFields,
      payload: {
        productId: product?.id,
        customerId: customer?.id,
        source,
        status: InquiryStatus.ABIERTA,
        note: text,
      },
    });
  }

  async confirm(request: AssistantConfirmRequest) {
    const payload = request.payload ?? {};

    if (request.intent === "CREATE_INQUIRY") {
      const productId = requiredString(payload.productId, "Falta producto para crear la consulta.");
      const inquiry = await this.prisma.inquiry.create({
        data: {
          productId,
          customerId: optionalString(payload.customerId),
          source: parseSource(payload.source),
          status: InquiryStatus.ABIERTA,
          note: optionalString(payload.note),
        },
      });
      await this.prisma.product.update({ where: { id: productId }, data: { inquiries: { increment: 1 } } });
      return { ok: true, message: "Consulta creada correctamente.", result: inquiry };
    }

    if (request.intent === "CREATE_ORDER") {
      const productId = requiredString(payload.productId, "Falta producto para crear el pedido.");
      const customerId = requiredString(payload.customerId, "Falta cliente para crear el pedido.");
      const amount = requiredNumber(payload.amount, "Falta monto total para crear el pedido.");
      const product = await this.prisma.product.findUnique({ where: { id: productId } });
      if (!product) throw new BadRequestException("Producto no encontrado.");
      const quantity = Number(payload.quantity ?? 1);
      const deposit = Number(payload.deposit ?? 0);
      const amountPaid = Number(payload.amountPaid ?? deposit);
      const status = parseOrderStatus(payload.status, deposit > 0 ? OrderStatus.SENADO : OrderStatus.CONSULTA);
      const supplierCost = status === OrderStatus.CONSULTA ? 0 : quantity * toNumber(product.cost);
      const financials = orderFinancials({ quantity, amount, deposit, amountPaid, supplierCost, productCost: toNumber(product.cost) });
      const order = await this.prisma.order.create({
        data: {
          productId,
          customerId,
          quantity,
          amount,
          deposit,
          amountPaid: financials.amountPaid,
          supplierCost: financials.supplierCost,
          pendingBalance: financials.pendingBalance,
          estimatedProfit: financials.estimatedProfit,
          realizedProfit: financials.realizedProfit,
          status,
        },
      });
      return { ok: true, message: "Pedido creado correctamente.", result: order };
    }

    if (request.intent === "UPDATE_CASH") {
      const cashAvailable = requiredNumber(payload.cashAvailable, "Falta el monto de caja disponible.");
      const snapshot = await this.prisma.cashSnapshot.create({
        data: {
          cashAvailable,
          notes: optionalString(payload.notes) ?? "Actualizado desde Asistente Operativo",
        },
      });
      return { ok: true, message: "Caja actualizada correctamente.", result: snapshot };
    }

    if (request.intent === "REGISTER_DEPOSIT") {
      const orderId = requiredString(payload.orderId, "Falta pedido único para registrar la seña.");
      const amount = requiredNumber(payload.amount, "Falta monto de seña/cobro.");
      const current = await this.findOrder(orderId);
      const deposit = toNumber(current.deposit) + amount;
      const amountPaid = toNumber(current.amountPaid) + amount;
      const financials = orderFinancials({
        quantity: current.quantity,
        amount: toNumber(current.amount),
        deposit,
        amountPaid,
        supplierCost: toNumber(current.supplierCost),
        productCost: toNumber(current.product.cost),
      });
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          deposit,
          amountPaid,
          pendingBalance: financials.pendingBalance,
          estimatedProfit: financials.estimatedProfit,
          realizedProfit: financials.realizedProfit,
          status: current.status === OrderStatus.CONSULTA ? OrderStatus.SENADO : current.status,
        },
      });
      return { ok: true, message: "Seña/cobro registrado correctamente.", result: order };
    }

    if (request.intent === "MARK_ORDER_DELIVERED") {
      const orderId = requiredString(payload.orderId, "Falta pedido único para marcar como entregado.");
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.ENTREGADO, deliveredAt: new Date() },
      });
      return { ok: true, message: "Pedido marcado como entregado.", result: order };
    }

    if (request.intent === "MARK_INQUIRY_LOST") {
      const inquiryId = requiredString(payload.inquiryId, "Falta consulta única para marcar como perdida.");
      const current = await this.prisma.inquiry.findUnique({ where: { id: inquiryId } });
      if (!current) throw new BadRequestException("Consulta no encontrada.");
      const note = [current.note, optionalString(payload.note)].filter(Boolean).join(" | ");
      const inquiry = await this.prisma.inquiry.update({
        where: { id: inquiryId },
        data: { status: InquiryStatus.PERDIDA, note: note || current.note },
      });
      return { ok: true, message: "Consulta marcada como perdida.", result: inquiry };
    }

    throw new BadRequestException("Intención no soportada.");
  }

  private async findUniqueOpenOrder(customerId: string, productId?: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        customerId,
        productId,
        status: { in: openOrderStatuses },
      },
      include: { product: true, customer: true },
      orderBy: { date: "desc" },
      take: 2,
    });
    return orders.length === 1 ? orders[0] : null;
  }

  private async findUniqueOpenInquiry(productId: string, customerId?: string) {
    const inquiries = await this.prisma.inquiry.findMany({
      where: {
        productId,
        customerId,
        status: { in: [InquiryStatus.ABIERTA, InquiryStatus.RESERVA_SIN_SENA, InquiryStatus.RESERVA_CON_SENA] },
      },
      include: { product: true, customer: true },
      orderBy: { date: "desc" },
      take: 2,
    });
    return inquiries.length === 1 ? inquiries[0] : null;
  }

  private async findOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { product: true } });
    if (!order) throw new BadRequestException("Pedido no encontrado.");
    return order;
  }
}

function buildResponse(input: {
  intent: AssistantIntent;
  confidence: number;
  title: string;
  summary: string;
  fields: Record<string, string | number | null>;
  warnings: string[];
  missingFields: string[];
  payload: Record<string, unknown>;
}): AssistantInterpretResponse {
  return {
    intent: input.intent,
    confidence: input.confidence,
    requiresConfirmation: true,
    canConfirm: input.missingFields.length === 0 && input.warnings.every((warning) => !warning.toLowerCase().includes("más de un")),
    preview: {
      title: input.title,
      summary: input.summary,
      fields: input.fields,
      warnings: input.warnings,
      missingFields: [...new Set(input.missingFields)],
    },
    action: { type: input.intent, payload: input.payload },
  };
}

function detectIntent(normalized: string): AssistantIntent {
  if (includesAny(normalized, ["actualizar caja", "caja a", "caja disponible"])) return "UPDATE_CASH";
  if (includesAny(normalized, ["entregado", "marcar entregado"])) return "MARK_ORDER_DELIVERED";
  if (includesAny(normalized, ["perdida", "perdio", "no compro", "no respondio"])) return "MARK_INQUIRY_LOST";
  if (includesAny(normalized, ["pago sena", "pago seña", "seña", "sena"]) && !includesAny(normalized, ["seño", "seno", "reservo con sena"])) return "REGISTER_DEPOSIT";
  if (includesAny(normalized, ["seño", "seno", "reservo con sena", "reservó con seña"])) return "CREATE_ORDER";
  if (includesAny(normalized, ["pregunto", "consulto", "consulta"])) return "CREATE_INQUIRY";
  return "CREATE_INQUIRY";
}

function extractAmount(text: string) {
  const matches = text.match(/\$?\s*\d{1,3}(?:[.\s]\d{3})+|\$?\s*\d{4,}/g);
  if (!matches?.length) return null;
  return Number(matches[0].replace(/[^\d]/g, ""));
}

function extractTotalAmount(normalized: string, detectedAmount: number | null) {
  if (includesAny(normalized, ["total", "monto", "venta"])) return detectedAmount;
  return null;
}

function extractQuantity(normalized: string) {
  const match = normalized.match(/\b(\d+)\s+(?:unidades?|camisetas?|remeras?|productos?|pares?|packs?|camperas?)\b/);
  return match ? Number(match[1]) : null;
}

function detectSource(normalized: string): InquirySource {
  if (normalized.includes("facebook")) return InquirySource.OTRO;
  if (normalized.includes("instagram")) return InquirySource.INSTAGRAM;
  if (normalized.includes("tiktok")) return InquirySource.TIKTOK;
  if (normalized.includes("referido")) return InquirySource.REFERIDO;
  if (normalized.includes("whatsapp")) return InquirySource.WHATSAPP;
  return InquirySource.WHATSAPP;
}

function findMatches<T>(text: string, items: T[], getName: (item: T) => string): T[] {
  const normalizedText = normalize(text);
  const scored = items
    .map((item) => {
      const name = normalize(getName(item));
      const tokens = name.split(/\s+/).filter((token) => token.length > 2);
      const score = tokens.filter((token) => normalizedText.includes(token)).length;
      return { item, score, tokenCount: tokens.length };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score / b.tokenCount - a.score / a.tokenCount);

  const best = scored[0];
  if (!best) return [];
  return scored.filter((entry) => entry.score === best.score).map((entry) => entry.item).slice(0, 3);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n");
}

function includesAny(text: string, values: string[]) {
  return values.some((value) => text.includes(normalize(value)));
}

function requiresProduct(intent: AssistantIntent) {
  return ["CREATE_INQUIRY", "CREATE_ORDER", "MARK_INQUIRY_LOST"].includes(intent);
}

function requiresCustomer(intent: AssistantIntent) {
  return ["CREATE_ORDER", "REGISTER_DEPOSIT", "MARK_ORDER_DELIVERED"].includes(intent);
}

function requiredString(value: unknown, message: string) {
  if (typeof value !== "string" || !value.trim()) throw new BadRequestException(message);
  return value;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function requiredNumber(value: unknown, message: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new BadRequestException(message);
  return number;
}

function parseSource(value: unknown): InquirySource {
  return Object.values(InquirySource).includes(value as InquirySource) ? (value as InquirySource) : InquirySource.WHATSAPP;
}

function parseOrderStatus(value: unknown, fallback: OrderStatus): OrderStatus {
  return Object.values(OrderStatus).includes(value as OrderStatus) ? (value as OrderStatus) : fallback;
}

function formatMoney(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}
