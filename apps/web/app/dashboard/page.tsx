import { ArrowRight, Banknote, ClipboardPlus, PackageSearch, PiggyBank, ShoppingCart } from "lucide-react";
import type { ReactNode } from "react";
import { Badge, CardTitle, DataTable } from "@/components/ui";
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
  const pendingTotal = sumPending(pendingCollections);

  return (
    <>
      <header className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Mesa de control</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Inicio operativo</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">Caja, cobros, riesgo y compras pendientes en una vista diaria.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickButton href="/inquiries" label="Nueva consulta" tone="primary" icon={<ClipboardPlus className="h-4 w-4" />} />
          <QuickButton href="#cargar-caja" label="Actualizar caja" tone="success" icon={<Banknote className="h-4 w-4" />} />
          <QuickButton href="/orders" label="Nuevo pedido" tone="warning" icon={<ShoppingCart className="h-4 w-4" />} />
          <QuickButton href="/products" label="Productos en prueba" tone="danger" icon={<PackageSearch className="h-4 w-4" />} />
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_420px]">
        <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-lg shadow-slate-200/70">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Hoy primero</p>
              <h2 className="mt-1 text-xl font-semibold">Resolver antes de comprar más</h2>
            </div>
            <Badge tone={atRiskOrders.length > 0 || pendingCollections.length > 0 ? "amber" : "green"}>
              {atRiskOrders.length + pendingCollections.length} temas activos
            </Badge>
          </div>

          <div className="mt-5 grid gap-3">
            <PriorityTask
              actionHref="/orders"
              actionLabel="Ver saldos"
              detail={`${pendingCollections.length} pedidos con saldo por ${money(pendingTotal)}`}
              priority={pendingCollections.length > 0 ? "Alta" : "Baja"}
              title="Cobrar saldos pendientes"
              tone={pendingCollections.length > 0 ? "amber" : "green"}
            />
            <PriorityTask
              actionHref="/orders"
              actionLabel="Revisar pedidos"
              detail={atRiskOrders.length > 0 ? `${atRiskOrders.length} pedidos abiertos requieren seguimiento` : "No hay pedidos en riesgo activo"}
              priority={atRiskOrders.length > 0 ? "Alta" : "Baja"}
              title="Revisar pedidos en riesgo"
              tone={atRiskOrders.length > 0 ? "red" : "green"}
            />
            <PriorityTask
              actionHref="/products"
              actionLabel="Ver productos"
              detail={productsToPause.length > 0 ? `${productsToPause.length} productos marcados para no recomprar` : "Comprar solo con señas o entregas validadas"}
              priority={productsToPause.length > 0 ? "Media" : "Baja"}
              title="No comprar productos sin señas"
              tone={productsToPause.length > 0 ? "red" : "blue"}
            />
          </div>
        </div>

        <FinancialPanel
          cashAvailable={data.cashAvailable}
          committedCapital={data.committedCapital}
          freeCapital={data.freeCapital}
          realizedProfit={data.realizedProfit}
        />
      </section>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <SignalCard label="Cobrar ahora" value={money(pendingTotal)} helper={`${pendingCollections.length} saldos pendientes`} tone="amber" />
        <SignalCard label="Riesgo activo" value={atRiskOrders.length} helper="Pedidos abiertos para revisar" tone={atRiskOrders.length > 0 ? "red" : "green"} />
        <SignalCard label="Conversión pendiente" value={inquiryActions.length} helper="Consultas para convertir o cerrar" tone={inquiryActions.length > 0 ? "blue" : "green"} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <WorkQueue title="Cobrar ahora" description="Saldos que conviene cobrar antes de comprometer caja." empty="No hay saldos pendientes.">
          {pendingCollections.map((row) => (
            <TaskRow
              key={row.id ?? `${row.customerName}-${row.productName}`}
              title={row.customerName}
              detail={row.productName}
              meta={<Badge tone={orderStatusTone(row.status)}>{statusLabel(row.status)}</Badge>}
              amount={money(row.pendingBalance)}
              action={row.action}
              tone="amber"
            />
          ))}
        </WorkQueue>

        <WorkQueue title="Pedidos en riesgo" description="Pedidos abiertos con demora, exposición o nota de riesgo." empty="No hay pedidos en riesgo.">
          {atRiskOrders.map((row) => (
            <TaskRow
              key={row.id ?? `${row.customerName}-${row.productName}`}
              title={row.productName}
              detail={`${row.customerName} · ${row.providerName}`}
              meta={<Badge tone="red">{row.riskNote}</Badge>}
              action={row.action}
              tone="red"
            />
          ))}
        </WorkQueue>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <WorkQueue title="Consultas para convertir" description="Pedir seña, convertir a pedido o cerrar como perdida." empty="No hay consultas para convertir.">
          {inquiryActions.map((row) => (
            <TaskRow
              key={row.id ?? `${row.productName}-${row.customerName}`}
              title={row.productName}
              detail={`${row.customerName} · ${row.source}`}
              meta={<Badge tone={inquiryStatusTone(row.status)}>{statusLabel(row.status)}</Badge>}
              action={row.action}
              tone={row.status === "RESERVA_CON_SENA" ? "green" : "blue"}
            />
          ))}
        </WorkQueue>

        <WorkQueue title="No recomprar todavía" description="Productos que pueden quemar caja si se compran sin validar." empty="No hay productos para pausar.">
          {productsToPause.map((row) => (
            <TaskRow
              key={row.id ?? row.productName}
              title={row.productName}
              detail={`${row.inquiries} consultas · ${row.deposits} señas`}
              meta={<Badge tone="softRed">{row.reason}</Badge>}
              action={row.action}
              tone="red"
            />
          ))}
        </WorkQueue>

        <WorkQueue title="Candidatos a reponer" description="Con señas o entregas y ganancia cobrada positiva." empty="Todavía no hay productos con demanda suficiente para reponer.">
          {replenishmentCandidates.map((row) => (
            <TaskRow
              key={row.id ?? row.productName}
              title={row.productName}
              detail={`${row.deposits} señas · ${row.delivered} entregados`}
              meta={<Badge tone="green">{money(row.realProfit)}</Badge>}
              action={row.action}
              tone="green"
            />
          ))}
        </WorkQueue>
      </div>

      <div className="mt-6" id="cargar-caja">
        <CashSnapshotForm />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Resumen secundario</CardTitle>
            <p className="mt-1 text-sm text-slate-600">Datos de contexto. No reemplazan las colas de trabajo del día.</p>
          </div>
          <Badge tone="default">Lectura rápida</Badge>
        </div>
        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          <SecondaryList title="Productos más consultados">
            {data.topConsultedProducts.length > 0 ? data.topConsultedProducts.map((product) => (
              <MiniRow key={product.id} label={product.name} value={`${product.inquiries} consultas`} />
            )) : <EmptyState>Todavía no hay consultas registradas.</EmptyState>}
          </SecondaryList>
          <SecondaryList title="Demanda validada">
            <DataTable<ReplenishmentCandidateRow>
              rows={(data.validatedDemand as ValidatedDemandRow[]).map((row) => ({ ...row, action: getReplenishmentAction(row) }))}
              columns={[
                { key: "productName", label: "Producto" },
                { key: "deposits", label: "Señas" },
                { key: "delivered", label: "Entregados" },
                { key: "realProfit", label: "Ganancia cobrada", render: (row) => money(row.realProfit as number) },
              ]}
            />
          </SecondaryList>
        </div>
      </div>
    </>
  );
}

function QuickButton({ href, icon, label, tone }: { href: string; icon: ReactNode; label: string; tone: "primary" | "success" | "warning" | "danger" }) {
  const styles = {
    primary: "border-blue-700 bg-blue-700 text-white hover:bg-blue-800",
    success: "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700",
    warning: "border-amber-500 bg-amber-500 text-slate-950 hover:bg-amber-600",
    danger: "border-red-100 bg-red-50 text-red-800 hover:bg-red-100",
  };

  return (
    <a className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm transition ${styles[tone]}`} href={href}>
      {icon}
      {label}
    </a>
  );
}

function PriorityTask({
  actionHref,
  actionLabel,
  detail,
  priority,
  title,
  tone,
}: {
  actionHref: string;
  actionLabel: string;
  detail: string;
  priority: "Alta" | "Media" | "Baja";
  title: string;
  tone: "red" | "amber" | "green" | "blue";
}) {
  const styles = {
    red: "border-red-400/30 bg-red-500/10",
    amber: "border-amber-300/30 bg-amber-400/10",
    green: "border-emerald-300/30 bg-emerald-400/10",
    blue: "border-sky-300/30 bg-sky-400/10",
  };

  return (
    <div className={`rounded-xl border p-4 ${styles[tone]}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white ring-1 ring-white/15">
            Prioridad {priority}
          </span>
          <h3 className="mt-2 text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-slate-300">{detail}</p>
        </div>
        <a className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-100" href={actionHref}>
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function FinancialPanel({
  cashAvailable,
  committedCapital,
  freeCapital,
  realizedProfit,
}: {
  cashAvailable: number;
  committedCapital: number;
  freeCapital: number;
  realizedProfit: number;
}) {
  return (
    <aside className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-5 shadow-lg shadow-emerald-100/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Resumen financiero</p>
          <h2 className="mt-1 text-sm font-semibold text-slate-700">Caja real disponible</h2>
        </div>
        <span className="rounded-xl bg-white p-2 text-emerald-700 shadow-sm ring-1 ring-emerald-100">
          <PiggyBank className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-5 text-4xl font-bold tracking-tight text-slate-950">{money(cashAvailable)}</div>
      <p className="mt-2 text-sm text-slate-600">Plata real hoy. No se calcula desde ganancia teórica.</p>

      <div className="mt-5 grid gap-3">
        <MoneyLine label="Plata comprometida" value={money(committedCapital)} tone="amber" />
        <MoneyLine label="Plata libre para operar" value={money(freeCapital)} tone="green" />
        <MoneyLine label="Ganancia cobrada" value={money(realizedProfit)} tone="blue" />
      </div>
    </aside>
  );
}

function MoneyLine({ label, tone, value }: { label: string; tone: "amber" | "green" | "blue"; value: string }) {
  const styles = {
    amber: "bg-amber-50 text-amber-900 ring-amber-100",
    green: "bg-emerald-50 text-emerald-900 ring-emerald-100",
    blue: "bg-sky-50 text-sky-900 ring-sky-100",
  };

  return (
    <div className={`flex items-center justify-between rounded-xl px-3 py-3 ring-1 ${styles[tone]}`}>
      <span className="text-sm font-medium">{label}</span>
      <strong className="text-sm tabular-nums">{value}</strong>
    </div>
  );
}

function SignalCard({ helper, label, tone, value }: { helper: string; label: string; tone: "amber" | "red" | "green" | "blue"; value: ReactNode }) {
  const styles = {
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    red: "border-red-200 bg-red-50 text-red-950",
    green: "border-emerald-200 bg-emerald-50 text-emerald-950",
    blue: "border-sky-200 bg-sky-50 text-sky-950",
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${styles[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
      <p className="mt-1 text-sm opacity-75">{helper}</p>
    </div>
  );
}

function WorkQueue({ children, description, empty, title }: { children: ReactNode; description: string; empty: string; title: string }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <Badge tone={items.length > 0 ? "blue" : "default"}>{items.length}</Badge>
      </div>
      <div className="space-y-3">{items.length > 0 ? children : <EmptyState>{empty}</EmptyState>}</div>
    </section>
  );
}

function TaskRow({
  action,
  amount,
  detail,
  meta,
  title,
  tone,
}: {
  action: string;
  amount?: string;
  detail: string;
  meta?: ReactNode;
  title: string;
  tone: "amber" | "red" | "green" | "blue";
}) {
  const styles = {
    amber: "border-l-amber-400",
    red: "border-l-red-500",
    green: "border-l-emerald-500",
    blue: "border-l-sky-500",
  };

  return (
    <div className={`rounded-xl border border-slate-200 border-l-4 bg-white p-3 shadow-sm transition hover:bg-slate-50 ${styles[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{detail}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {meta}
            <span className="text-xs font-medium text-slate-500">{action}</span>
          </div>
        </div>
        {amount ? <strong className="shrink-0 text-sm tabular-nums text-slate-950">{amount}</strong> : null}
      </div>
    </div>
  );
}

function SecondaryList({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{value}</span>
    </div>
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
