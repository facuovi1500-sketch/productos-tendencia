import { Badge, DataTable, PageHeader } from "@/components/ui";
import { ProductReorderForm } from "@/components/product-reorder-form";
import { demo, getApi } from "@/lib/api";
import { money } from "@/lib/utils";

type ProductRow = {
  id: string;
  name: string;
  category: string;
  cost: number | string;
  retailPrice: number | string;
  wholesalePrice: number | string;
  stock: number;
  mode: string;
  status: string;
  inquiries: number;
  doNotReorder?: boolean;
  reorderBlockReason?: string | null;
  mainProvider?: { name: string } | null;
  mainProviderId?: string | null;
};

function statusTone(status: string): "green" | "amber" | "red" | "default" {
  if (status === "ACTIVO") return "green";
  if (status === "PAUSADO") return "amber";
  if (status === "DESCARTADO" || status === "AGOTADO") return "red";
  return "default";
}

function productLabel(value: string) {
  const labels: Record<string, string> = {
    ACTIVO: "Activo",
    PAUSADO: "Pausado",
    AGOTADO: "Agotado",
    DESCARTADO: "Descartado",
    STOCK: "Stock",
    ENCARGO: "Encargo",
  };
  return labels[value] ?? value;
}

export default async function ProductsPage() {
  const rows = await getApi<ProductRow[]>("/products", demo.products as ProductRow[]);

  return (
    <>
      <PageHeader
        title="Catálogo maestro"
        description="Estado operativo de productos, costos, precios, stock, modalidad y bloqueo de recompra."
      />
      <ProductReorderForm products={rows} />
      <DataTable<ProductRow>
        rows={rows}
        columns={[
          { key: "name", label: "Producto" },
          { key: "category", label: "Categoría" },
          { key: "mainProvider", label: "Proveedor principal", render: (row) => row.mainProvider?.name ?? "Sin definir" },
          { key: "cost", label: "Costo", render: (row) => money(row.cost as number) },
          { key: "retailPrice", label: "Minorista", render: (row) => money(row.retailPrice as number) },
          { key: "wholesalePrice", label: "Mayorista", render: (row) => money(row.wholesalePrice as number) },
          { key: "margin", label: "Margen estimado", render: (row) => money(Number(row.retailPrice) - Number(row.cost)) },
          { key: "stock", label: "Stock" },
          { key: "mode", label: "Modalidad", render: (row) => <Badge tone={row.mode === "STOCK" ? "blue" : "purple"}>{productLabel(String(row.mode))}</Badge> },
          { key: "status", label: "Estado", render: (row) => <Badge tone={statusTone(String(row.status))}>{productLabel(String(row.status))}</Badge> },
          {
            key: "doNotReorder",
            label: "Recompra",
            render: (row) => <Badge tone={row.doNotReorder ? "red" : "green"}>{row.doNotReorder ? "Bloqueado" : "OK"}</Badge>,
          },
          { key: "reorderBlockReason", label: "Motivo bloqueo", render: (row) => row.reorderBlockReason ?? "" },
        ]}
      />
    </>
  );
}
