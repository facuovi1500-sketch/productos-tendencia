import { CircleDollarSign, Store, TrendingUp } from "lucide-react";
import { Card, CardTitle, DataTable, PageHeader, StatCard } from "@/components/ui";
import { demo, getApi } from "@/lib/api";
import { money } from "@/lib/utils";

type Metrics = {
  bestSellingProducts: Array<{ productId: string; productName: string; soldUnits: number; inquiries: number; conversionRate: number }>;
  mostConsultedProducts: Array<{ productId: string; productName: string; soldUnits: number; inquiries: number; conversionRate: number }>;
  productConversion: Array<{ productId: string; productName: string; soldUnits: number; inquiries: number; conversionRate: number }>;
  monthlyEstimatedProfit: Array<{ month: string; profit: number }>;
  monthlyRealizedProfit: Array<{ month: string; profit: number }>;
  accumulatedProfit: number;
  accumulatedRealizedProfit: number;
  mostProfitableProvider: { providerName: string; margin: number } | null;
};
type ProductMetricRow = { productId: string; productName: string; soldUnits: number; inquiries: number; conversionRate: number };

const preview: Metrics = {
  bestSellingProducts: [
    { productId: "preview-product", productName: "PREVIEW SIN API - sin datos reales", soldUnits: 0, inquiries: 0, conversionRate: 0 },
  ],
  mostConsultedProducts: [
    { productId: "preview-product", productName: "PREVIEW SIN API - sin datos reales", soldUnits: 0, inquiries: 0, conversionRate: 0 },
  ],
  productConversion: [],
  monthlyEstimatedProfit: [{ month: "SIN API", profit: 0 }],
  monthlyRealizedProfit: [{ month: "SIN API", profit: 0 }],
  accumulatedProfit: 0,
  accumulatedRealizedProfit: 0,
  mostProfitableProvider: null,
};

export default async function MetricsPage() {
  const data = await getApi<Metrics>("/metrics", preview);

  return (
    <>
      <PageHeader
        title="Métricas"
        description="Lectura simple de productos entregados, consultas, conversión, ganancia cobrada y proveedor más rentable."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Ganancia cobrada" value={money(data.accumulatedRealizedProfit)} helper="Plata ganada efectivamente." icon={<CircleDollarSign className="h-4 w-4" />} tone="green" />
        <StatCard label="Ganancia teórica (no es caja real)" value={money(data.accumulatedProfit)} helper="Sirve para estimar, no para comprar." icon={<TrendingUp className="h-4 w-4" />} tone="amber" />
        <StatCard
          label="Proveedor más rentable"
          value={data.mostProfitableProvider?.providerName ?? "Sin datos"}
          helper={`Margen: ${money(data.mostProfitableProvider?.margin ?? 0)}`}
          icon={<Store className="h-4 w-4" />}
          tone="blue"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DataTable<ProductMetricRow>
          rows={data.bestSellingProducts}
          columns={[
            { key: "productName", label: "Más entregados" },
            { key: "soldUnits", label: "Unidades entregadas" },
            { key: "conversionRate", label: "Conversión", render: (row) => `${Number(row.conversionRate).toFixed(1)}%` },
          ]}
        />
        <Card>
          <CardTitle>Ganancia cobrada mensual</CardTitle>
          <p className="mt-2 text-sm text-slate-600">Solo cuenta ganancia efectivamente cobrada.</p>
          <div className="mt-4 space-y-3">
            {data.monthlyRealizedProfit.map((month) => (
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2" key={month.month}>
                <span className="font-medium">{month.month}</span>
                <span className="font-semibold tabular-nums text-slate-950">{money(month.profit)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <DataTable<ProductMetricRow>
          rows={data.mostConsultedProducts}
          columns={[
            { key: "productName", label: "Más consultados" },
            { key: "inquiries", label: "Consultas" },
            { key: "soldUnits", label: "Unidades entregadas" },
          ]}
        />
      </div>
    </>
  );
}
