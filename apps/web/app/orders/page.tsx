import { Badge, DataTable, PageHeader } from "@/components/ui";
import { OrderForm } from "@/components/order-form";
import { demo, getApi } from "@/lib/api";
import { orderStatusTone, statusLabel } from "@/lib/labels";
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

function needsMoneyAlert(row: OrderRow) {
  return Number(row.deposit ?? 0) > 0 && (!row.provider || Number(row.supplierCost ?? 0) <= 0);
}

function statusHelp(row: OrderRow) {
  if (row.status === "SENADO") return "Falta cobrar saldo";
  if (row.status === "CONSULTA") return "No compromete costo";
  if (needsMoneyAlert(row)) return "Falta proveedor/costo";
  return row.riskNote ? "Riesgo" : "OK";
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
        description="Controlá seña cobrada, saldo pendiente, costo real proveedor, ganancia cobrada y riesgo. La ganancia teórica no es caja real."
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
            render: (row) => <Badge tone={orderStatusTone(String(row.status))}>{statusLabel(String(row.status))}</Badge>,
          },
          {
            key: "risk",
            label: "Alerta",
            render: (row) =>
              needsMoneyAlert(row) ? <Badge tone="amber">Falta proveedor/costo</Badge> : row.riskNote ? <Badge tone="red">Riesgo</Badge> : <Badge tone="green">{statusHelp(row)}</Badge>,
          },
          { key: "provider", label: "Proveedor", render: (row) => row.provider?.name ?? <span className="text-amber-700">Sin proveedor</span> },
          { key: "quantity", label: "Cantidad" },
          { key: "amount", label: "Venta total", render: (row) => money(row.amount as number) },
          { key: "deposit", label: "Seña cobrada", render: (row) => money(row.deposit as number) },
          { key: "amountPaid", label: "Dinero cobrado", render: (row) => money(row.amountPaid as number) },
          { key: "supplierCost", label: "Costo real proveedor", render: (row) => money(row.supplierCost as number) },
          { key: "pendingBalance", label: "Saldo pendiente", render: (row) => money(row.pendingBalance as number) },
          { key: "estimatedProfit", label: "Ganancia teórica", render: (row) => money(row.estimatedProfit as number) },
          { key: "realizedProfit", label: "Ganancia cobrada", render: (row) => money(row.realizedProfit as number) },
          { key: "riskNote", label: "Nota de riesgo", render: (row) => row.riskNote ?? "" },
        ]}
      />
    </>
  );
}
