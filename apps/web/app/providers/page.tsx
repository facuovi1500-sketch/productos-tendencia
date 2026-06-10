import { Badge, DataTable, PageHeader } from "@/components/ui";
import { demo, getApi } from "@/lib/api";

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

function providerTone(status: string): "green" | "amber" | "red" {
  if (status === "ACTIVO") return "green";
  if (status === "DESCARTADO") return "red";
  return "amber";
}

function providerLabel(status: string) {
  const labels: Record<string, string> = {
    ACTIVO: "Activo",
    PRUEBA: "Prueba",
    DESCARTADO: "Descartado",
  };
  return labels[status] ?? status;
}

export default async function ProvidersPage() {
  const rows = await getApi<ProviderRow[]>("/providers", demo.providers as ProviderRow[]);

  return (
    <>
      <PageHeader
        title="Proveedores"
        description="Evalúa precio, cumplimiento, demoras, fallas y reclamos antes de elegir a quién comprar."
      />
      <DataTable<ProviderRow>
        rows={rows}
        columns={[
          { key: "name", label: "Nombre" },
          { key: "whatsapp", label: "WhatsApp" },
          { key: "city", label: "Ciudad" },
          { key: "leadTimeDays", label: "Entrega estimada" },
          { key: "quality", label: "Calidad" },
          { key: "onTimeDeliveries", label: "A tiempo" },
          { key: "lateDeliveries", label: "Demoras" },
          { key: "failedDeliveries", label: "Fallas" },
          { key: "claimsCount", label: "Reclamos" },
          {
            key: "status",
            label: "Estado",
            render: (row) => <Badge tone={providerTone(String(row.status))}>{providerLabel(String(row.status))}</Badge>,
          },
        ]}
      />
    </>
  );
}
