import { AlertTriangle, Banknote, CircleDollarSign, ClipboardPlus, PackageSearch, PiggyBank, ShieldAlert, ShoppingCart, TrendingUp } from "lucide-react";
import { ActionCard, Badge, Card, CardTitle, DataTable, PageHeader, StatCard } from "@/components/ui";
import { CashSnapshotForm } from "@/components/cash-snapshot-form";
import { demo, getApi } from "@/lib/api";
import { orderStatusTone, statusLabel } from "@/lib/labels";
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
type TodayAction = {
  label: string;
  text: string;
  tone: "risk" | "cash" | "balance" | "validation";
};

export default async function DashboardPage() {
  const data = await getApi<Dashboard>("/dashboard", demo.dashboard);
  const todayActions = getTodayActions(data);

  return (
    <>
      <PageHeader
        title="Inicio operativo"
        description="Control diario de caja real, plata comprometida, saldos por cobrar, pedidos en riesgo y productos que conviene pausar."
      />

      <Card className="mb-6">
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle>Acciones rápidas</CardTitle>
            <p className="mt-1 text-sm text-slate-600">Cargá datos reales apenas pasan: consulta, pedido, caja o bloqueo de recompra.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ActionCard description="Registrá interés real antes de comprar." href="/inquiries" icon={<ClipboardPlus className="h-4 w-4" />} label="Nueva consulta" variant="primary" />
            <ActionCard description="Cargá plata disponible hoy." href="#cargar-caja" icon={<Banknote className="h-4 w-4" />} label="Actualizar caja" variant="success" />
            <ActionCard description="Usar solo con seña o venta confirmada." href="/orders" icon={<ShoppingCart className="h-4 w-4" />} label="Nuevo pedido" variant="warning" />
            <ActionCard description="Revisá qué no conviene recomprar." href="/products" icon={<PackageSearch className="h-4 w-4" />} label="Productos en prueba" variant="danger" />
          </div>
        </div>
      </Card>

      <Card className="mb-6 border-sky-200 bg-sky-50/60">
        <CardTitle>Qué hacer hoy</CardTitle>
        <div className="mt-3 grid gap-3 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-4">
          {todayActions.map((action) => (
            <PriorityCard action={action} key={`${action.label}-${action.text}`} />
          ))}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Caja disponible" value={money(data.cashAvailable)} helper="Plata real hoy. Se carga manualmente." icon={<PiggyBank className="h-4 w-4" />} tone="green" />
        <StatCard label="Plata comprometida en pedidos" value={money(data.committedCapital)} helper="Costo de pedidos abiertos." icon={<ShieldAlert className="h-4 w-4" />} tone="amber" />
        <StatCard label="Plata libre para operar" value={money(data.freeCapital)} helper="Caja menos compromisos." icon={<CircleDollarSign className="h-4 w-4" />} tone="green" />
        <StatCard label="Ganancia cobrada" value={money(data.realizedProfit)} helper="Plata ganada efectivamente, no teórica." icon={<TrendingUp className="h-4 w-4" />} tone="green" />
        <StatCard label="Pedidos en riesgo" value={data.atRiskOrders.length} helper="Abiertos con riesgo activo." icon={<AlertTriangle className="h-4 w-4" />} tone={data.atRiskOrders.length > 0 ? "red" : "default"} />
        <StatCard label="Consultas perdidas" value={data.lostInquiries} helper="Demanda no convertida." icon={<AlertTriangle className="h-4 w-4" />} tone={data.lostInquiries > 0 ? "amber" : "default"} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Riesgo de plata pendiente" value={money(data.netCashExposure)} helper="Compromiso menos señas cobradas." tone="amber" />
        <StatCard label="Ventas totales" value={money(data.totalSales)} helper={`Dinero cobrado: ${money(data.collectedRevenue)}`} tone="blue" />
        <StatCard label="Pedidos con seña" value={data.depositedOrders} helper="Falta revisar saldo pendiente." tone="blue" />
        <StatCard label="Reservas sin seña" value={data.reservationsWithoutDeposit} helper="Interés, no venta validada." tone="amber" />
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
            { key: "realProfit", label: "Ganancia cobrada", render: (row) => money(row.realProfit as number) },
          ]}
        />

        <DataTable<ProductToPauseRow>
          rows={data.productsToPause as ProductToPauseRow[]}
          columns={[
            { key: "productName", label: "Productos a pausar" },
            { key: "inquiries", label: "Consultas" },
            { key: "deposits", label: "Señas" },
            { key: "margin", label: "Margen estimado", render: (row) => money(row.margin as number) },
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
            { key: "status", label: "Estado", render: (row) => <Badge tone={orderStatusTone(String(row.status))}>{statusLabel(String(row.status))}</Badge> },
            { key: "riskNote", label: "Qué revisar" },
          ]}
        />

        <Card>
          <CardTitle>Productos más consultados</CardTitle>
          <p className="mt-2 text-sm text-slate-600">Muchas consultas no alcanzan para comprar: buscá señas o pedidos antes de recomprar.</p>
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
            { key: "profit", label: "Ganancia teórica", render: (row) => money(row.profit as number) },
            { key: "realizedProfit", label: "Ganancia cobrada", render: (row) => money(row.realizedProfit as number) },
          ]}
        />
      </div>
    </>
  );
}

function getTodayActions(data: Dashboard): TodayAction[] {
  const actions: TodayAction[] = [
    { label: "Cierre diario", text: "Actualizar caja al cierre del día.", tone: "cash" },
    { label: "Validación", text: "No recomprar productos sin señas suficientes.", tone: "validation" },
  ];
  if (Number(data.netCashExposure) > 0) actions.unshift({ label: "Antes de comprar", text: "Cobrar saldos pendientes antes de comprar más.", tone: "balance" });
  if (data.atRiskOrders.length > 0) actions.unshift({ label: "Prioridad alta", text: "Revisar pedidos en riesgo.", tone: "risk" });
  if (data.reservationsWithoutDeposit > 0) actions.push({ label: "Validación", text: "Convertir reservas sin seña o marcarlas como perdidas.", tone: "validation" });
  return actions.slice(0, 5);
}

function PriorityCard({ action }: { action: TodayAction }) {
  const styles: Record<TodayAction["tone"], string> = {
    risk: "border-red-200 bg-red-50 text-red-950",
    cash: "border-emerald-200 bg-emerald-50 text-emerald-950",
    balance: "border-amber-200 bg-amber-50 text-amber-950",
    validation: "border-sky-200 bg-sky-50 text-sky-950",
  };

  return (
    <div className={`rounded-xl border p-3 shadow-sm ${styles[action.tone]}`}>
      <span className="inline-flex rounded-full bg-white/80 px-2 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-black/5">{action.label}</span>
      <p className="mt-2 leading-5">{action.text}</p>
    </div>
  );
}
