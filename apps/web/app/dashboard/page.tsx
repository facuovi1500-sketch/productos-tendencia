import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, Banknote, CircleDollarSign, ClipboardPlus, PackageSearch, PiggyBank, ShieldAlert, ShoppingCart, TrendingUp } from "lucide-react";
import { Badge, Card, CardTitle, DataTable, PageHeader, StatCard } from "@/components/ui";
import { CashSnapshotForm } from "@/components/cash-snapshot-form";
import { demo, getApi } from "@/lib/api";
import { money } from "@/lib/utils";

type Dashboard = typeof demo.dashboard;
type ValidatedDemandRow = {
  id?: string;
  productName: string;
  inquiries: number;
  deposits: number;
  delivered: number;
  realProfit: number;
};
type ProductToPauseRow = {
  id?: string;
  productName: string;
  inquiries: number;
  deposits: number;
  margin: number;
  reason: string;
};
type AtRiskOrderRow = {
  id?: string;
  customerName: string;
  productName: string;
  providerName: string;
  status: string;
  riskNote: string;
};
type ProductRankingRow = {
  id?: string;
  productName: string;
  quantity: number;
  sales: number;
  profit: number;
  realizedProfit: number;
};

export default async function DashboardPage() {
  const data = await getApi<Dashboard>("/dashboard", demo.dashboard);

  return (
    <>
      <PageHeader
        title="Inicio operativo"
        description="Centro de control financiero: caja disponible, capital comprometido, capital libre, ganancia cobrada y pedidos en riesgo."
      />

      <Card className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Acciones rápidas</CardTitle>
            <p className="mt-1 text-sm text-slate-600">Cargá datos reales sin salir del flujo operativo.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction href="/inquiries" icon={<ClipboardPlus className="h-4 w-4" />} label="Nueva consulta" />
            <QuickAction href="/orders" icon={<ShoppingCart className="h-4 w-4" />} label="Nuevo pedido" />
            <QuickAction href="#cargar-caja" icon={<Banknote className="h-4 w-4" />} label="Cargar caja" />
            <QuickAction href="/products" icon={<PackageSearch className="h-4 w-4" />} label="Productos en prueba" />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Caja disponible" value={money(data.cashAvailable)} helper="Último snapshot cargado" icon={<PiggyBank className="h-4 w-4" />} tone="green" />
        <StatCard label="Capital comprometido" value={money(data.committedCapital)} helper="Costo proveedor en pedidos abiertos" icon={<ShieldAlert className="h-4 w-4" />} tone="amber" />
        <StatCard label="Capital libre" value={money(data.freeCapital)} helper="Caja luego de compromisos" icon={<CircleDollarSign className="h-4 w-4" />} tone="green" />
        <StatCard label="Ganancia cobrada" value={money(data.realizedProfit)} helper="No mezcla ganancia teórica" icon={<TrendingUp className="h-4 w-4" />} tone="green" />
        <StatCard label="Pedidos en riesgo" value={data.atRiskOrders.length} helper="Abiertos con riesgo activo" icon={<AlertTriangle className="h-4 w-4" />} tone={data.atRiskOrders.length > 0 ? "red" : "default"} />
        <StatCard label="Consultas perdidas" value={data.lostInquiries} helper="Demanda no convertida" icon={<AlertTriangle className="h-4 w-4" />} tone={data.lostInquiries > 0 ? "amber" : "default"} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Exposición neta" value={money(data.netCashExposure)} helper="Compromiso menos señas cobradas" tone="amber" />
        <StatCard label="Ventas totales" value={money(data.totalSales)} helper={`Cobrado: ${money(data.collectedRevenue)}`} tone="blue" />
        <StatCard label="Pedidos señados" value={data.depositedOrders} tone="blue" />
        <StatCard label="Reservas sin seña" value={data.reservationsWithoutDeposit} tone="amber" />
      </div>

      <div className="mt-6" id="cargar-caja">
        <CashSnapshotForm />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DataTable<ValidatedDemandRow>
          rows={data.validatedDemand as ValidatedDemandRow[]}
          columns={[
            { key: "productName", label: "Demanda validada" },
            { key: "inquiries", label: "Consultas" },
            { key: "deposits", label: "Señas" },
            { key: "delivered", label: "Entregados" },
            { key: "realProfit", label: "Ganancia real", render: (row) => money(row.realProfit as number) },
          ]}
        />

        <DataTable<ProductToPauseRow>
          rows={data.productsToPause as ProductToPauseRow[]}
          columns={[
            { key: "productName", label: "No recomprar / pausar" },
            { key: "inquiries", label: "Consultas" },
            { key: "deposits", label: "Señas" },
            { key: "margin", label: "Margen", render: (row) => money(row.margin as number) },
            { key: "reason", label: "Motivo" },
          ]}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DataTable<AtRiskOrderRow>
          rows={data.atRiskOrders as AtRiskOrderRow[]}
          columns={[
            { key: "customerName", label: "Pedido en riesgo" },
            { key: "productName", label: "Producto" },
            { key: "providerName", label: "Proveedor" },
            { key: "status", label: "Estado", render: (row) => <Badge tone="amber">{String(row.status)}</Badge> },
            { key: "riskNote", label: "Riesgo" },
          ]}
        />

        <Card>
          <CardTitle>Productos más consultados</CardTitle>
          <div className="mt-4 space-y-3">
            {data.topConsultedProducts.map((product) => (
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2" key={product.id}>
                <span className="font-medium">{product.name}</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{product.inquiries} consultas</span>
              </div>
            ))}
          </div>
        </Card>

        <DataTable<ProductRankingRow>
          rows={data.productRanking as ProductRankingRow[]}
          columns={[
            { key: "productName", label: "Ranking de productos" },
            { key: "quantity", label: "Unidades" },
            { key: "sales", label: "Ventas", render: (row) => money(row.sales as number) },
            { key: "profit", label: "G. teórica", render: (row) => money(row.profit as number) },
            { key: "realizedProfit", label: "G. cobrada", render: (row) => money(row.realizedProfit as number) },
          ]}
        />
      </div>
    </>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
      href={href}
    >
      {icon}
      {label}
    </Link>
  );
}
