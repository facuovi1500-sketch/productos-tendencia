import { Badge, Card, CardTitle, DataTable, PageHeader } from "@/components/ui";
import { demo, getApi } from "@/lib/api";
import { providerStatusTone, statusLabel } from "@/lib/labels";

type ProviderRow = {
  id: string;
  name: string;
  whatsapp: string;
  city: string;
  leadTimeDays: number;
  quality: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  failedDeliveries: number;
  claimsCount: number;
  status: string;
};

export default async function ProvidersPage() {
  const rows = await getApi<ProviderRow[]>("/providers", demo.providers as ProviderRow[]);

  return (
    <>
      <PageHeader
        title="Proveedores"
        description="Elegí por conveniencia operativa: precio, cumplimiento, demora, fallas y reclamos. El más barato no siempre conviene."
      />
      <Card className="mb-6 border-amber-200 bg-amber-50/60">
        <CardTitle>Regla de uso</CardTitle>
        <p className="mt-2 text-sm text-slate-700">Antes de comprar, revisá demoras, fallas y reclamos. Un proveedor barato con mala entrega puede poner pedidos y caja en riesgo.</p>
      </Card>
      <DataTable<ProviderRow>
        rows={rows}
        columns={[
          { key: "name", label: "Proveedor" },
          { key: "whatsapp", label: "WhatsApp" },
          { key: "city", label: "Ciudad" },
          { key: "leadTimeDays", label: "Demora estimada", render: (row) => `${row.leadTimeDays} días` },
          { key: "quality", label: "Calidad 1-10" },
          { key: "onTimeDeliveries", label: "Entregas a tiempo" },
          { key: "lateDeliveries", label: "Entregas tarde" },
          { key: "failedDeliveries", label: "Entregas fallidas" },
          { key: "claimsCount", label: "Reclamos" },
          {
            key: "status",
            label: "Estado",
            render: (row) => <Badge tone={providerStatusTone(String(row.status))}>{statusLabel(String(row.status))}</Badge>,
          },
        ]}
      />
    </>
  );
}
