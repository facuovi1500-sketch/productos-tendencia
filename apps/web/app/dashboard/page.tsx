import { AlertTriangle, Banknote, ClipboardPlus, PackageSearch, PiggyBank, ShieldAlert, ShoppingCart } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { ActionCard, Badge, Card, CardTitle, DataTable, PageHeader, StatCard } from "@/components/ui";
import { CashSnapshotForm } from "@/components/cash-snapshot-form";
import { demo, getApi } from "@/lib/api";
import { inquiryStatusTone, orderStatusTone, statusLabel } from "@/lib/labels";
import { money } from "@/lib/utils";

type Dashboard = typeof demo.dashboard;
type OrderRow = {
  id: string;
  customer: { name: string };
  product: { name: string };
  provider: { name: string } | null;
  amount: number | string;
  deposit: number | string;
  amountPaid: number | string;
  supplierCost: number | string;
  pendingBalance: number | string;
  status: string;
  riskNote?: string | null;
};
type InquiryRow = {
  id: string;
  product: { name: string };
  customer: { name: string } | null;
  order: { id: string; status: string; amount: number | string } | null;
  source: string;
  status: string;
  note?: string | null;
};
type ValidatedDemandRow = {
  id?: string;
  productName: string;
  inquiries: number;
  deposits: number;
  delivered: number;
  realProfit: number;
};
type ReplenishmentCandidateRow = ValidatedDemandRow & {
  action: string;
};
type ProductToPauseBaseRow = {
  id?: string;
  productName: string;
  inquiries: number;
  deposits: number;
  margin: number;
  reason: string;
};
type ProductToPauseRow = ProductToPauseBaseRow & {
  action: string;
};
type AtRiskOrderBaseRow = {
  id?: string;
  customerName: string;
  productName: string;
  providerName: string;
  status: string;
  riskNote: string;
};
type AtRiskOrderRow = AtRiskOrderBaseRow & {
  action: string;
};
type PendingCollectionRow = {
  id?: string;
  customerName: string;
  productName: string;
  pendingBalance: number;
  status: string;
  action: string;
};
type InquiryActionRow = {
  id?: string;
  productName: string;
  customerName: string;
  source: string;
  status: string;
  action: string;
};
type TodayAction = {
  label: string;
  text: string;
  tone: "risk" | "cash" | "balance" | "validation";
};

export default async function DashboardPage() {
  const [data, orders, inquiries] = await Promise.all([
    getApi<Dashboard>("/dashboard", demo.dashboard),
    getApi<OrderRow[]>("/orders", demo.orders as OrderRow[]),
    getApi<InquiryRow[]>("/inquiries", demo.inquiries as InquiryRow[]),
  ]);
  const pendingCollections = getPendingCollections(orders);
  const inquiryActions = getInquiryActions(inquiries);
  const atRiskOrders = getAtRiskRows(data);
  const productsToPause = getProductsToPause(data);
  const replenishmentCandidates = getReplenishmentCandidates(data);
  const todayActions = getTodayActions(data, pendingCollections, inquiryActions);

  return (
    <>
      <PageHeader
        title="Inicio operativo"
        description="Tablero diario para decidir qué cobrar, qué revisar, qué convertir, qué no comprar y qué productos podrían reponerse."
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
        <StatCard label="Cobrar pendientes" value={money(sumPending(pendingCollections))} helper={`${pendingCollections.length} pedidos con saldo.`} icon={<Banknote className="h-4 w-4" />} tone={pendingCollections.length > 0 ? "amber" : "green"} />
        <StatCard label="Pedidos en riesgo" value={atRiskOrders.length} helper="Abiertos con riesgo activo." icon={<AlertTriangle className="h-4 w-4" />} tone={atRiskOrders.length > 0 ? "red" : "default"} />
        <StatCard label="Consultas para convertir" value={inquiryActions.length} helper="Abrir, señar, convertir o cerrar." icon={<ClipboardPlus className="h-4 w-4" />} tone={inquiryActions.length > 0 ? "blue" : "default"} />
        <StatCard label="No recomprar / pausar" value={productsToPause.length} helper="Evita compras sin validación." icon={<ShieldAlert className="h-4 w-4" />} tone={productsToPause.length > 0 ? "red" : "default"} />
        <StatCard label="Candidatos a reponer" value={replenishmentCandidates.length} helper="Con señas o entregas registradas." icon={<PackageSearch className="h-4 w-4" />} tone={replenishmentCandidates.length > 0 ? "green" : "default"} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Plata comprometida en pedidos" value={money(data.committedCapital)} helper="Costo de pedidos abiertos." tone="amber" />
        <StatCard label="Plata libre para operar" value={money(data.freeCapital)} helper="Caja menos compromisos." tone="green" />
        <StatCard label="Riesgo de plata pendiente" value={money(data.netCashExposure)} helper="Compromiso menos señas cobradas." tone="amber" />
        <StatCard label="Ganancia cobrada" value={money(data.realizedProfit)} helper="Plata ganada efectivamente, no teórica." tone="green" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <OperationalTable title="Cobrar pendientes" description="Primero cobrar saldos antes de comprometer más plata." empty="No hay saldos pendientes.">
          <DataTable<PendingCollectionRow>
            rows={pendingCollections}
            columns={[
              { key: "customerName", label: "Cliente" },
              { key: "productName", label: "Producto" },
              { key: "pendingBalance", label: "Saldo", render: (row) => money(row.pendingBalance) },
              { key: "status", label: "Estado", render: (row) => <Badge tone={orderStatusTone(row.status)}>{statusLabel(row.status)}</Badge> },
              { key: "action", label: "Acción sugerida" },
            ]}
          />
        </OperationalTable>

        <OperationalTable title="Pedidos en riesgo" description="Revisar proveedor, demora, saldo o exposición antes de comprar más." empty="No hay pedidos en riesgo.">
          <DataTable<AtRiskOrderRow>
            rows={atRiskOrders}
            columns={[
              { key: "customerName", label: "Cliente" },
              { key: "productName", label: "Producto" },
              { key: "providerName", label: "Proveedor" },
              { key: "riskNote", label: "Motivo" },
              { key: "action", label: "Acción sugerida" },
            ]}
          />
        </OperationalTable>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <OperationalTable title="Consultas para convertir" description="Separar interés de venta validada: pedir seña, convertir o cerrar como perdida." empty="No hay consultas para convertir.">
          <DataTable<InquiryActionRow>
            rows={inquiryActions}
            columns={[
              { key: "productName", label: "Producto" },
              { key: "customerName", label: "Cliente" },
              { key: "source", label: "Origen", render: (row) => <Badge>{row.source}</Badge> },
              { key: "status", label: "Estado", render: (row) => <Badge tone={inquiryStatusTone(row.status)}>{statusLabel(row.status)}</Badge> },
              { key: "action", label: "Acción sugerida" },
            ]}
          />
        </OperationalTable>

        <OperationalTable title="No recomprar / pausar" description="Productos que pueden quemar caja por baja validación, margen débil o bloqueo manual." empty="No hay productos para pausar.">
          <DataTable<ProductToPauseRow>
            rows={productsToPause}
            columns={[
              { key: "productName", label: "Producto" },
              { key: "inquiries", label: "Consultas" },
              { key: "deposits", label: "Señas" },
              { key: "reason", label: "Motivo" },
              { key: "action", label: "Acción" },
            ]}
          />
        </OperationalTable>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <OperationalTable title="Productos candidatos a reponer" description="Criterio simple: señas o entregas registradas, sin bloqueo, y margen real positivo." empty="Todavía no hay productos con demanda suficiente para reponer.">
          <DataTable<ReplenishmentCandidateRow>
            rows={replenishmentCandidates}
            columns={[
              { key: "productName", label: "Producto" },
              { key: "deposits", label: "Señas" },
              { key: "delivered", label: "Entregados" },
              { key: "realProfit", label: "Ganancia cobrada", render: (row) => money(row.realProfit) },
              { key: "action", label: "Acción sugerida" },
            ]}
          />
        </OperationalTable>

        <Card>
          <CardTitle>Productos más consultados</CardTitle>
          <p className="mt-2 text-sm text-slate-600">Muchas consultas no alcanzan para comprar: buscá señas o pedidos antes de recomprar.</p>
          <div className="mt-4 space-y-3">
            {data.topConsultedProducts.length > 0 ? data.topConsultedProducts.map((product) => (
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2" key={product.id}>
                <span className="font-medium">{product.name}</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{product.inquiries} consultas</span>
              </div>
            )) : <p className="text-sm text-slate-500">Todavía no hay consultas registradas.</p>}
          </div>
        </Card>
      </div>

      <div className="mt-6" id="cargar-caja">
        <CashSnapshotForm />
      </div>

      <div className="mt-6">
        <OperationalTable title="Demanda validada" description="Vista secundaria para revisar qué productos ya tienen señales de compra reales." empty="Todavía no hay demanda validada.">
          <DataTable<ReplenishmentCandidateRow>
            rows={(data.validatedDemand as ValidatedDemandRow[]).map((row) => ({ ...row, action: getReplenishmentAction(row) }))}
          columns={[
            { key: "productName", label: "Demanda validada" },
            { key: "inquiries", label: "Consultas" },
            { key: "deposits", label: "Señas" },
            { key: "delivered", label: "Entregados" },
            { key: "realProfit", label: "Ganancia cobrada", render: (row) => money(row.realProfit as number) },
            { key: "action", label: "Lectura operativa" },
          ]}
        />
        </OperationalTable>
      </div>
    </>
  );
}

function getTodayActions(data: Dashboard, pendingCollections: PendingCollectionRow[], inquiryActions: InquiryActionRow[]): TodayAction[] {
  const actions: TodayAction[] = [
    { label: "Cierre diario", text: "Actualizar caja al cierre del día.", tone: "cash" },
    { label: "Validación", text: "No recomprar productos sin señas suficientes.", tone: "validation" },
  ];
  if (pendingCollections.length > 0 || Number(data.netCashExposure) > 0) actions.unshift({ label: "Antes de comprar", text: "Cobrar saldos pendientes antes de comprar más.", tone: "balance" });
  if (data.atRiskOrders.length > 0) actions.unshift({ label: "Prioridad alta", text: "Revisar pedidos en riesgo.", tone: "risk" });
  if (inquiryActions.length > 0) actions.push({ label: "Validación", text: "Convertir consultas o marcarlas como perdidas.", tone: "validation" });
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

function OperationalTable({ children, description, empty, title }: { children: ReactNode; description: string; empty: string; title: string }) {
  const table = children as ReactElement<{ rows?: unknown[] }>;
  const rows = table.props.rows ?? [];
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <div className="mt-4">{rows.length > 0 ? children : <EmptyState>{empty}</EmptyState>}</div>
    </Card>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">{children}</div>;
}

function getPendingCollections(orders: OrderRow[]): PendingCollectionRow[] {
  return orders
    .filter((order) => Number(order.pendingBalance) > 0 && order.status !== "CANCELADO")
    .sort((a, b) => Number(b.pendingBalance) - Number(a.pendingBalance))
    .slice(0, 6)
    .map((order) => ({
      id: order.id,
      customerName: order.customer.name,
      productName: order.product.name,
      pendingBalance: Number(order.pendingBalance),
      status: order.status,
      action: "Cobrar antes de comprar más",
    }));
}

function getInquiryActions(inquiries: InquiryRow[]): InquiryActionRow[] {
  const actionable = new Set(["ABIERTA", "RESERVA_SIN_SENA", "RESERVA_CON_SENA"]);
  return inquiries
    .filter((inquiry) => actionable.has(inquiry.status))
    .slice(0, 6)
    .map((inquiry) => ({
      id: inquiry.id,
      productName: inquiry.product.name,
      customerName: inquiry.customer?.name ?? "Sin cliente",
      source: inquiry.source,
      status: inquiry.status,
      action: getInquiryAction(inquiry),
    }));
}

function getInquiryAction(inquiry: InquiryRow) {
  if (inquiry.status === "RESERVA_CON_SENA") return inquiry.order ? "Convertir a pedido" : "Vincular pedido";
  if (inquiry.status === "RESERVA_SIN_SENA") return "Pedir seña";
  return "Convertir o marcar perdida";
}

function getAtRiskRows(data: Dashboard): AtRiskOrderRow[] {
  return (data.atRiskOrders as AtRiskOrderBaseRow[]).map((order) => ({
    ...order,
    action: "Resolver riesgo antes de avanzar",
  }));
}

function getProductsToPause(data: Dashboard): ProductToPauseRow[] {
  return (data.productsToPause as ProductToPauseBaseRow[]).map((product) => ({
    ...product,
    action: "No comprar todavía",
  }));
}

function getReplenishmentCandidates(data: Dashboard): ReplenishmentCandidateRow[] {
  const pausedIds = new Set((data.productsToPause as ProductToPauseBaseRow[]).map((product) => product.productName));
  return (data.validatedDemand as ValidatedDemandRow[])
    .filter((product) => !pausedIds.has(product.productName))
    .filter((product) => product.deposits > 0 || product.delivered > 0)
    .filter((product) => Number(product.realProfit) > 0)
    .slice(0, 5)
    .map((product) => ({
      ...product,
      action: getReplenishmentAction(product),
    }));
}

function getReplenishmentAction(product: Pick<ReplenishmentCandidateRow, "deposits" | "delivered" | "realProfit">) {
  if (product.deposits > 0 && product.delivered > 0) return "Revisar proveedor y caja";
  if (product.deposits > 0) return "Validar saldo y proveedor";
  if (product.delivered > 0) return "Revisar rotación antes de reponer";
  return "Esperar más validación";
}

function sumPending(rows: PendingCollectionRow[]) {
  return rows.reduce((sum, row) => sum + row.pendingBalance, 0);
}
