import { Badge, DataTable, PageHeader } from "@/components/ui";
import { demo, getApi } from "@/lib/api";
import { money } from "@/lib/utils";

type MemberRow = {
  id: string;
  name: string;
  whatsapp: string;
  city: string;
  hasPurchased: boolean;
  totalSpent: number | string;
};

export default async function CommunityPage() {
  const rows = await getApi<MemberRow[]>("/community", demo.community as MemberRow[]);

  return (
    <>
      <PageHeader
        title="Comunidad WhatsApp"
        description="Seguimiento de miembros, crecimiento y conversión de comunidad a cliente."
      />
      <DataTable<MemberRow>
        rows={rows}
        columns={[
          { key: "name", label: "Nombre" },
          { key: "whatsapp", label: "WhatsApp" },
          { key: "city", label: "Ciudad" },
          {
            key: "hasPurchased",
            label: "Compró",
            render: (row) => <Badge tone={row.hasPurchased ? "green" : "default"}>{row.hasPurchased ? "Sí" : "No"}</Badge>,
          },
          { key: "totalSpent", label: "Total gastado", render: (row) => money(row.totalSpent as number) },
        ]}
      />
    </>
  );
}
