import { PrismaClient, ContentStatus, ContentType, InquirySource, InquiryStatus, OrderStatus, Platform, ProductMode, ProductStatus, ProviderStatus, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@productostendencia.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword && process.env.NODE_ENV === "production") {
    throw new Error("SEED_ADMIN_PASSWORD is required to seed production");
  }
  const passwordHash = await bcrypt.hash(adminPassword ?? "change-me-local-seed-password", 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin Productos Tendencia",
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const proveedorA = await prisma.provider.create({
    data: {
      name: "Importadora Norte",
      whatsapp: "+5491111111111",
      city: "Buenos Aires",
      leadTimeDays: 7,
      quality: 8,
      status: ProviderStatus.ACTIVO,
      onTimeDeliveries: 8,
      lateDeliveries: 1,
      failedDeliveries: 0,
      claimsCount: 1,
      notes: "Buen precio en electronica y entregas semanales.",
    },
  });

  const proveedorB = await prisma.provider.create({
    data: {
      name: "Mayorista Centro",
      whatsapp: "+5492222222222",
      city: "Cordoba",
      leadTimeDays: 10,
      quality: 9,
      status: ProviderStatus.PRUEBA,
      onTimeDeliveries: 3,
      lateDeliveries: 2,
      failedDeliveries: 1,
      claimsCount: 2,
      notes: "Mejor calidad en Stanley y camperas.",
    },
  });

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Body Splash Victoria Trend",
        category: "Body Splash",
        mainProviderId: proveedorA.id,
        alternateProviderId: proveedorB.id,
        cost: 2800,
        retailPrice: 6500,
        wholesalePrice: 5200,
        stock: 24,
        mode: ProductMode.STOCK,
        status: ProductStatus.ACTIVO,
        doNotReorder: true,
        reorderBlockReason: "Muchas consultas sin senas: validar antes de recomprar.",
        inquiries: 42,
      },
    }),
    prisma.product.create({
      data: {
        name: "Parlante JBL Go",
        category: "JBL",
        mainProviderId: proveedorA.id,
        cost: 14500,
        retailPrice: 26000,
        wholesalePrice: 22000,
        stock: 0,
        mode: ProductMode.ENCARGO,
        status: ProductStatus.ACTIVO,
        inquiries: 58,
      },
    }),
    prisma.product.create({
      data: {
        name: "Termo Stanley 1.2L",
        category: "Stanley",
        mainProviderId: proveedorB.id,
        cost: 18500,
        retailPrice: 36000,
        wholesalePrice: 30000,
        stock: 8,
        mode: ProductMode.STOCK,
        status: ProductStatus.ACTIVO,
        inquiries: 76,
      },
    }),
  ]);

  for (const product of products) {
    const isStanley = product.category === "Stanley";
    await prisma.providerProduct.createMany({
      data: [
        {
          providerId: proveedorA.id,
          productId: product.id,
          purchasePrice: isStanley ? Number(product.cost) * 1.02 : Number(product.cost),
          moq: 6,
        },
        {
          providerId: proveedorB.id,
          productId: product.id,
          purchasePrice: isStanley ? Number(product.cost) * 0.95 : Number(product.cost) * 1.08,
          moq: 12,
        },
      ],
      skipDuplicates: true,
    });
  }

  const clienteA = await prisma.customer.create({
    data: {
      name: "Sofia Alvarez",
      phone: "+5491133333333",
      city: "Buenos Aires",
      favoriteProducts: { connect: [{ id: products[2].id }] },
    },
  });

  const clienteB = await prisma.customer.create({
    data: {
      name: "Lucas Pereyra",
      phone: "+5491144444444",
      city: "Rosario",
      favoriteProducts: { connect: [{ id: products[1].id }] },
    },
  });

  await prisma.communityMember.createMany({
    data: [
      {
        name: clienteA.name,
        whatsapp: clienteA.phone,
        city: clienteA.city,
        hasPurchased: true,
        totalSpent: 36000,
        customerId: clienteA.id,
      },
      {
        name: "Martina Lopez",
        whatsapp: "+5491155555555",
        city: "Mendoza",
        hasPurchased: false,
        totalSpent: 0,
      },
      {
        name: clienteB.name,
        whatsapp: clienteB.phone,
        city: clienteB.city,
        hasPurchased: true,
        totalSpent: 26000,
        customerId: clienteB.id,
      },
    ],
  });

  const deliveredOrder = await prisma.order.create({
    data: {
      customerId: clienteA.id,
      productId: products[2].id,
      providerId: proveedorB.id,
      quantity: 1,
      amount: 36000,
      deposit: 12000,
      amountPaid: 36000,
      supplierCost: 18500,
      pendingBalance: 0,
      estimatedProfit: 17500,
      realizedProfit: 17500,
      status: OrderStatus.ENTREGADO,
      deliveredAt: new Date(),
    },
  });

  const depositedOrder = await prisma.order.create({
    data: {
      customerId: clienteB.id,
      productId: products[1].id,
      providerId: proveedorA.id,
      quantity: 1,
      amount: 26000,
      deposit: 10000,
      amountPaid: 10000,
      supplierCost: 14500,
      pendingBalance: 16000,
      estimatedProfit: 11500,
      realizedProfit: -4500,
      status: OrderStatus.SENADO,
      riskNote: "Tiene sena, falta confirmar compra al proveedor.",
    },
  });

  await prisma.order.create({
    data: {
      customerId: clienteA.id,
      productId: products[0].id,
      providerId: proveedorA.id,
      quantity: 3,
      amount: 15600,
      deposit: 0,
      amountPaid: 0,
      supplierCost: 0,
      pendingBalance: 15600,
      estimatedProfit: 0,
      realizedProfit: 0,
      status: OrderStatus.CONSULTA,
    },
  });

  await prisma.inquiry.createMany({
    data: [
      {
        customerId: clienteA.id,
        productId: products[2].id,
        orderId: deliveredOrder.id,
        source: InquirySource.WHATSAPP,
        status: InquiryStatus.CONVERTIDA_PEDIDO,
        note: "Consulta convertida en pedido entregado.",
      },
      {
        customerId: clienteB.id,
        productId: products[1].id,
        orderId: depositedOrder.id,
        source: InquirySource.INSTAGRAM,
        status: InquiryStatus.RESERVA_CON_SENA,
        note: "Sena recibida, falta cobrar saldo.",
      },
      {
        productId: products[0].id,
        source: InquirySource.WHATSAPP,
        status: InquiryStatus.RESERVA_SIN_SENA,
        note: "Pidio reservar pero no envio comprobante.",
      },
      {
        productId: products[0].id,
        source: InquirySource.INSTAGRAM,
        status: InquiryStatus.PERDIDA,
        note: "Precio no cerraba contra competencia.",
      },
    ],
  });

  await prisma.cashSnapshot.create({
    data: {
      cashAvailable: 150000,
      cashInTransit: 24000,
      notes: "Caja inicial simulada para evaluar capital libre y comprometido.",
    },
  });

  await prisma.contentItem.createMany({
    data: [
      {
        date: new Date(),
        productId: products[2].id,
        platform: Platform.INSTAGRAM,
        type: ContentType.REEL,
        status: ContentStatus.PLANIFICADO,
      },
      {
        date: new Date(Date.now() + 86400000),
        productId: products[1].id,
        platform: Platform.WHATSAPP,
        type: ContentType.HISTORIA,
        status: ContentStatus.PLANIFICADO,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
