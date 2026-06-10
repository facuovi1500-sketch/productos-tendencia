import { Badge, DataTable, PageHeader } from "@/components/ui";
import { OrderForm } from "@/components/order-form";
import { demo, getApi } from "@/lib/api";
import { money } from "@/lib/utils";

type OrderRow = {
  id: string;
  customer: { name: string };
  product: { name: string; cost?: number | string };
  provider: { name: string } | null;
  quantity: number;
  amount: number | string;
  deposit: number | string;
  amountPaid: number | string;
  supplierCost: number | string;
  pendingBalance: number | string;
  estimatedProfit: number | string;
  realizedProfit: number | string;
  status: string;
  riskNote?: string | null;
};
type ProductOption = { id: string; name: string };
type CustomerOption = { id: string; name: string };
type ProviderOption = { id: string; name: string };

function statusTone(status: string): "default" | "green" | "red" | "amber" | "blue" | "purple" | "orange" {
  if (status === "CONSULTA") return "default";
  if (status === "SENADO") return "blue";
  if (status === "COMPRADO_PROVEEDOR") return "purple";
  if (status === "EN_TRANSITO") return "orange";
  if (status === "ENTREGADO") return "green";
  if (status === "CANCELADO") return "red";
  return "amber";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    CONSULTA: "Consulta",
    SENADO: "Señado",
    COMPRADO_PROVEEDOR: "Comprado",
    EN_TRANSITO: "En tránsito",
    ENTREGADO: "Entregado",
    CANCELADO: "Cancelado",
  };
  return labels[status] ?? status;
}

function needsMoneyAlert(row: OrderRow) {
  return Number(row.deposit ?? 0) > 0 && (!row.provider || Number(row.supplierCost ?? 0) <= 0);
}

export default async function OrdersPage() {
  const [rows, products, customers, providers] = await Promise.all([
    getApi<OrderRow[]>("/orders", demo.orders as OrderRow[]),
    getApi<ProductOption[]>("/products", demo.products),
    getApi<CustomerOption[]>("/customers", demo.customers),
    getApi<ProviderOption[]>("/providers", demo.providers),
  ]);

  return (
    <>
      <PageHeader
        title="Pedidos"
        description="Seguimiento de señas, cobros, costo real, saldo pendiente, ganancia teórica y ganancia cobrada."
      />
      <OrderForm orders={rows} products={products} customers={customers} providers={providers} />
      <DataTable<OrderRow>
        rows={rows}
        columns={[
          { key: "customer", label: "Cliente", render: (row) => row.customer.name },
          { key: "product", label: "Producto", render: (row) => row.product.name },
          {
            key: "status",
            label: "Estado",
            render: (row) => <Badge tone={statusTone(String(row.status))}>{statusLabel(String(row.status))}</Badge>,
          },
          {
            key: "risk",
            label: "Alerta",
            render: (row) =>
              needsMoneyAlert(row) ? <Badge tone="amber">Falta proveedor/costo</Badge> : row.riskNote ? <Badge tone="red">Riesgo</Badge> : <Badge tone="green">OK</Badge>,
          },
          { key: "provider", label: "Proveedor", render: (row) => row.provider?.name ?? <span className="text-amber-700">Sin proveedor</span> },
          { key: "quantity", label: "Cantidad" },
          { key: "amount", label: "Monto", render: (row) => money(row.amount as number) },
          { key: "deposit", label: "Seña", render: (row) => money(row.deposit as number) },
          { key: "amountPaid", label: "Cobrado", render: (row) => money(row.amountPaid as number) },
          { key: "supplierCost", label: "Costo real", render: (row) => money(row.supplierCost as number) },
          { key: "pendingBalance", label: "Saldo", render: (row) => money(row.pendingBalance as number) },
          { key: "estimatedProfit", label: "G. teórica", render: (row) => money(row.estimatedProfit as number) },
          { key: "realizedProfit", label: "G. cobrada", render: (row) => money(row.realizedProfit as number) },
          { key: "riskNote", label: "Riesgo", render: (row) => row.riskNote ?? "" },
        ]}
      />
    </>
  );
}
