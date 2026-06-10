import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_KEY = "productos_tendencia_token";

function getServerToken() {
  return cookies().get(TOKEN_KEY)?.value;
}

export async function getApiStatus(): Promise<"connected" | "preview"> {
  try {
    if (!API_URL) return "preview";
    const token = getServerToken();
    const response = await fetch(`${API_URL}/dashboard`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
    return response.ok ? "connected" : "preview";
  } catch {
    return "preview";
  }
}

export async function getApi<T>(path: string, preview: T): Promise<T> {
  try {
    if (!API_URL) return preview;
    const token = getServerToken();
    const response = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
    if (!response.ok) {
      return preview;
    }
    return (await response.json()) as T;
  } catch {
    return preview;
  }
}

export const demo = {
  dashboard: {
    totalSales: 0,
    collectedRevenue: 0,
    pendingOrders: 1,
    depositedOrders: 0,
    activeProducts: 3,
    registeredCustomers: 0,
    estimatedProfit: 0,
    realizedProfit: 0,
    cashAvailable: 0,
    committedCapital: 0,
    depositsCollected: 0,
    netCashExposure: 0,
    freeCapital: 0,
    lostInquiries: 0,
    reservationsWithoutDeposit: 0,
    topConsultedProducts: [
      { id: "preview-product", name: "PREVIEW SIN API - sin datos reales", inquiries: 0 },
    ],
    productRanking: [
      { productId: "preview-product", productName: "PREVIEW SIN API - sin datos reales", quantity: 0, sales: 0, profit: 0, realizedProfit: 0 },
    ],
    validatedDemand: [
      { productId: "preview-product", productName: "PREVIEW SIN API - sin datos reales", inquiries: 0, deposits: 0, delivered: 0, lost: 0, realProfit: 0, demandScore: 0 },
    ],
    productsToPause: [
      { productId: "preview-product", productName: "PREVIEW SIN API - sin datos reales", inquiries: 0, deposits: 0, delivered: 0, margin: 0, reason: "Conectá la API para ver decisiones operativas.", shouldPause: false },
    ],
    atRiskOrders: [],
  },
  providers: [
    { id: "preview-provider", name: "PREVIEW SIN API - proveedor no real", whatsapp: "", city: "", quality: 0, status: "PRUEBA", leadTimeDays: 0, onTimeDeliveries: 0, lateDeliveries: 0, failedDeliveries: 0, claimsCount: 0 },
  ],
  products: [
    { id: "preview-product", name: "PREVIEW SIN API - producto no real", category: "Preview", cost: 0, retailPrice: 0, wholesalePrice: 0, stock: 0, mode: "ENCARGO", status: "PAUSADO", inquiries: 0, doNotReorder: true, reorderBlockReason: "Conectá la API para operar con datos reales." },
  ],
  customers: [
    { id: "preview-customer", name: "PREVIEW SIN API - cliente no real", phone: "", city: "", orders: [{ amount: 0 }] },
  ],
  orders: [
    { id: "preview-order", customer: { name: "PREVIEW SIN API - cliente no real" }, product: { name: "PREVIEW SIN API - producto no real", cost: 0 }, provider: null, quantity: 0, amount: 0, deposit: 0, amountPaid: 0, supplierCost: 0, pendingBalance: 0, estimatedProfit: 0, realizedProfit: 0, status: "CONSULTA", riskNote: "Conectá la API para ver pedidos reales." },
  ],
  inquiries: [
    { id: "preview-inquiry", product: { name: "PREVIEW SIN API - producto no real" }, customer: null, order: null, source: "OTRO", status: "ABIERTA", note: "Conectá la API para ver consultas reales." },
  ],
  community: [
    { id: "preview-member", name: "PREVIEW SIN API - miembro no real", whatsapp: "", city: "", hasPurchased: false, totalSpent: 0 },
  ],
  content: [
    { id: "preview-content", product: { name: "PREVIEW SIN API - producto no real" }, platform: "OTRO", type: "POST", status: "PLANIFICADO", date: new Date().toISOString() },
  ],
};
