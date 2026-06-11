import { Badge, DataTable, PageHeader, StatCard } from "@/components/ui";
import { InquiryForm } from "@/components/inquiry-form";
import { demo, getApi } from "@/lib/api";
import { inquiryStatusTone, orderStatusTone, statusLabel } from "@/lib/labels";
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
        description="Registrá la demanda diaria y separá interés de compra validada. Una reserva sin seña no valida compra."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Abiertas" value={open} helper="Demanda por responder" tone="blue" />
        <StatCard label="Reservas sin seña" value={noDeposit} helper="Interés, no compra validada" tone="amber" />
        <StatCard label="Pérdidas" value={lost} helper="Registrar motivo de pérdida" tone="red" />
        <StatCard label="Convertidas a pedido" value={converted} helper="Consulta con pedido asociado" tone="green" />
      </div>
      <InquiryForm inquiries={rows} products={products} customers={customers} orders={orders} />
      <DataTable<InquiryRow>
        rows={rows}
        columns={[
          { key: "product", label: "Producto", render: (row) => row.product.name },
          { key: "source", label: "Origen", render: (row) => <Badge>{String(row.source)}</Badge> },
          { key: "status", label: "Estado", render: (row) => <Badge tone={inquiryStatusTone(String(row.status))}>{statusLabel(String(row.status))}</Badge> },
          {
            key: "order",
            label: "Terminó en pedido",
            render: (row) =>
              row.order ? (
                <Badge tone={orderStatusTone(String(row.order.status))}>{`${statusLabel(String(row.order.status))} - ${money(row.order.amount)}`}</Badge>
              ) : (
                <Badge>Sin pedido</Badge>
              ),
          },
          { key: "customer", label: "Cliente", render: (row) => row.customer?.name ?? "Sin registrar" },
          { key: "note", label: "Motivo / nota" },
        ]}
      />
    </>
  );
}
