import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100/70", className)}>{children}</section>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</h2>;
}

export function StatCard({
  label,
  value,
  helper,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  helper?: string;
  icon?: ReactNode;
  tone?: "default" | "green" | "amber" | "red" | "blue";
}) {
  const styles = {
    default: "border-slate-200 bg-white",
    green: "border-emerald-200 bg-emerald-50/60",
    amber: "border-amber-200 bg-amber-50/60",
    red: "border-red-200 bg-red-50/60",
    blue: "border-sky-200 bg-sky-50/60",
  };

  return (
    <Card className={cn("min-h-[132px]", styles[tone])}>
      <div className="flex items-start justify-between gap-3">
        <CardTitle>{label}</CardTitle>
        {icon ? <div className="rounded-lg bg-white/80 p-2 text-slate-600 shadow-sm ring-1 ring-slate-200">{icon}</div> : null}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{value}</div>
      {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
    </Card>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "green" | "amber" | "red" | "blue" | "purple" | "orange" | "softRed";
}) {
  const styles = {
    default: "bg-slate-100 text-slate-700 ring-slate-200",
    green: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-100 text-amber-800 ring-amber-200",
    red: "bg-red-100 text-red-700 ring-red-200",
    blue: "bg-sky-100 text-sky-700 ring-sky-200",
    purple: "bg-violet-100 text-violet-700 ring-violet-200",
    orange: "bg-orange-100 text-orange-700 ring-orange-200",
    softRed: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1", styles[tone])}>{children}</span>;
}

function isNumericColumn(key: string) {
  const normalized = key.toLowerCase();
  return ["amount", "cost", "price", "profit", "sales", "spent", "margin", "balance", "cash", "revenue", "deposit", "paid"].some((item) =>
    normalized.includes(item),
  );
}

export function DataTable<T extends object>({
  columns,
  rows,
}: {
  columns: Array<{ key: keyof T | string; label: string; render?: (row: T) => ReactNode }>;
  rows: T[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100/70">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => {
                const key = String(column.key);
                return (
                  <th className={cn("px-4 py-3 font-semibold", isNumericColumn(key) && "text-right")} key={key}>
                    {column.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {rows.map((row, index) => (
              <tr key={String((row as { id?: unknown }).id ?? index)} className="transition hover:bg-slate-50/80">
                {columns.map((column) => {
                  const key = String(column.key);
                  return (
                    <td className={cn("px-4 py-3 align-middle", isNumericColumn(key) && "text-right tabular-nums")} key={key}>
                      {column.render ? column.render(row) : String((row as Record<string, unknown>)[String(column.key)] ?? "")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
