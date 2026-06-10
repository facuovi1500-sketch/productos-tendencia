import { Badge, DataTable, PageHeader, StatCard } from "@/components/ui";
import { InquiryForm } from "@/components/inquiry-form";
import { demo, getApi } from "@/lib/api";
import { money } from "@/lib/utils";

type ProductOption = { id: string; name: string };
type CustomerOption = { id: string; name: string };
type NestedEntity = { id?: string; name: string };
type OrderOption = { id: string; status: string; amount: number | string; customer?: NestedEntity; product?: NestedEntity };
type InquiryRow = {
  id: string;
  productId?: string;
  customerId?: string | null;
  orderId?: string | null;
  product: NestedEntity;
  customer: NestedEntity | null;
  order: OrderOption | null;
  source: string;
  status: string;
  note?: string | null;
};

function tone(status: string): "default" | "green" | "amber" | "softRed" | "blue" {
  if (status === "CONVERTIDA_PEDIDO") return "green";
  if (status === "RESERVA_CON_SENA") return "blue";
  if (status === "PERDIDA") return "softRed";
  if (status === "RESERVA_SIN_SENA") return "amber";
  return "default";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    ABIERTA: "Abierta",
    RESERVA_SIN_SENA: "Reserva sin seña",
    RESERVA_CON_SENA: "Reserva con seña",
    CONVERTIDA_PEDIDO: "Convertida",
    PERDIDA: "Perdida",
  };
  return labels[status] ?? status;
}

export default async function InquiriesPage() {
  const [rows, products, customers, orders] = await Promise.all([
    getApi<InquiryRow[]>("/inquiries", demo.inquiries as InquiryRow[]),
    getApi<ProductOption[]>("/products", demo.products),
    getApi<CustomerOption[]>("/customers", demo.customers),
    getApi<OrderOption[]>("/orders", demo.orders),
  ]);
  const open = rows.filter((row) => row.status === "ABIERTA").length;
  const noDeposit = rows.filter((row) => row.status === "RESERVA_SIN_SENA").length;
  const lost = rows.filter((row) => row.status === "PERDIDA").length;
  const converted = rows.filter((row) => row.status === "CONVERTIDA_PEDIDO").length;

  return (
    <>
      <PageHeader
        title="Consultas"
        description="Carga diaria de demanda: consultas abiertas, reservas sin seña, consultas perdidas y conversiones a pedido."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Abiertas" value={open} helper="Demanda por responder" tone="blue" />
        <StatCard label="Reservas sin seña" value={noDeposit} helper="Interés sin validación fuerte" tone="amber" />
        <StatCard label="Perdidas" value={lost} helper="Registrar motivo" tone="red" />
        <StatCard label="Convertidas" value={converted} helper="Consulta con pedido asociado" tone="green" />
      </div>
      <InquiryForm inquiries={rows} products={products} customers={customers} orders={orders} />
      <DataTable<InquiryRow>
        rows={rows}
        columns={[
          { key: "product", label: "Producto", render: (row) => row.product.name },
          { key: "source", label: "Origen", render: (row) => <Badge>{String(row.source)}</Badge> },
          { key: "status", label: "Estado", render: (row) => <Badge tone={tone(String(row.status))}>{statusLabel(String(row.status))}</Badge> },
          {
            key: "order",
            label: "Terminó en pedido",
            render: (row) => row.order ? <Badge tone="green">{`${statusLabel(String(row.order.status))} - ${money(row.order.amount)}`}</Badge> : <Badge>Sin pedido</Badge>,
          },
          { key: "customer", label: "Cliente", render: (row) => row.customer?.name ?? "Sin registrar" },
          { key: "note", label: "Motivo / nota" },
        ]}
      />
    </>
  );
}
