import { Badge, DataTable, PageHeader } from "@/components/ui";
import { demo, getApi } from "@/lib/api";

type ContentRow = {
  id: string;
  date: string;
  product: { name: string };
  platform: string;
  type: string;
  status: string;
};

export default async function ContentPage() {
  const rows = await getApi<ContentRow[]>("/content", demo.content as ContentRow[]);

  return (
    <>
      <PageHeader
        title="Calendario de contenido"
        description="Planificación semanal de publicaciones por producto, plataforma, tipo y estado."
      />
      <DataTable<ContentRow>
        rows={rows}
        columns={[
          { key: "date", label: "Fecha", render: (row) => new Date(row.date).toLocaleDateString("es-AR") },
          { key: "product", label: "Producto", render: (row) => row.product.name },
          { key: "platform", label: "Plataforma" },
          { key: "type", label: "Tipo", render: (row) => <Badge>{String(row.type)}</Badge> },
          { key: "status", label: "Estado", render: (row) => <Badge tone="amber">{String(row.status)}</Badge> },
        ]}
      />
    </>
  );
}
