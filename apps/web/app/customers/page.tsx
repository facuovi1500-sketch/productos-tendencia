import { DataTable, PageHeader } from "@/components/ui";
import { CustomerForm } from "@/components/customer-form";
import { demo, getApi } from "@/lib/api";
import { money } from "@/lib/utils";

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  city: string;
  orders: Array<{ amount: number | string }>;
};

export default async function CustomersPage() {
  const rows = await getApi<CustomerRow[]>("/customers", demo.customers as CustomerRow[]);

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Alta rápida de clientes para usarlos en consultas y pedidos. Mantiene el historial de compras y el monto gastado."
      />
      <CustomerForm customers={rows} />
      <DataTable<CustomerRow>
        rows={rows}
        columns={[
          { key: "name", label: "Nombre" },
          { key: "phone", label: "Teléfono / WhatsApp" },
          { key: "city", label: "Ciudad" },
          { key: "orders", label: "Compras", render: (row) => row.orders.length },
          {
            key: "spent",
            label: "Monto gastado",
            render: (row) => money(row.orders.reduce((sum, order) => sum + Number(order.amount), 0)),
          },
        ]}
      />
    </>
  );
}
