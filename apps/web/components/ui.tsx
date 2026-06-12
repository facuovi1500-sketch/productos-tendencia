import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "warning" | "danger" | "success" | "ghost";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "border-blue-700 bg-blue-700 text-white shadow-button hover:bg-blue-800 focus-visible:ring-blue-200",
  secondary: "border-slate-200 bg-white text-slate-800 shadow-button hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-200",
  warning: "border-amber-500 bg-amber-500 text-slate-950 shadow-button hover:bg-amber-400 focus-visible:ring-amber-200",
  danger: "border-red-600 bg-red-600 text-white shadow-button hover:bg-red-700 focus-visible:ring-red-200",
  success: "border-emerald-600 bg-emerald-600 text-white shadow-button hover:bg-emerald-700 focus-visible:ring-emerald-200",
  ghost: "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-slate-200",
};

export const fieldClassName =
  "min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export function buttonClassName(variant: ButtonVariant = "primary", className?: string) {
  return cn(
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-60",
    buttonStyles[variant],
    className,
  );
}

export function Button({
  children,
  className,
  type = "submit",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button className={buttonClassName(variant, className)} type={type} {...props}>
      {children}
    </button>
  );
}

export function ActionCard({
  description,
  href,
  icon,
  label,
  variant = "primary",
}: {
  description: string;
  href: string;
  icon: ReactNode;
  label: string;
  variant?: ButtonVariant;
}) {
  const styles: Record<ButtonVariant, string> = {
    primary: "border-blue-200 bg-blue-50/80 text-blue-950 hover:border-blue-300 hover:bg-blue-100/80",
    secondary: "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50",
    warning: "border-amber-200 bg-amber-50/80 text-amber-950 hover:border-amber-300 hover:bg-amber-100/80",
    danger: "border-red-200 bg-red-50/80 text-red-950 hover:border-red-300 hover:bg-red-100/80",
    success: "border-emerald-200 bg-emerald-50/80 text-emerald-950 hover:border-emerald-300 hover:bg-emerald-100/80",
    ghost: "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
  };

  return (
    <a className={cn("block rounded-2xl border p-4 shadow-soft transition", styles[variant])} href={href}>
      <div className="flex items-center gap-3 text-sm font-bold">
        <span className="rounded-xl bg-white/85 p-2 shadow-sm ring-1 ring-black/5">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-xs leading-5 opacity-80">{description}</p>
    </a>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft", className)}>{children}</section>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{children}</h2>;
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
    green: "border-emerald-200 bg-emerald-50/70",
    amber: "border-amber-200 bg-amber-50/70",
    red: "border-red-200 bg-red-50/70",
    blue: "border-blue-200 bg-blue-50/70",
  };

  return (
    <Card className={cn("min-h-[132px]", styles[tone])}>
      <div className="flex items-start justify-between gap-3">
        <CardTitle>{label}</CardTitle>
        {icon ? <div className="rounded-xl bg-white/85 p-2 text-slate-600 shadow-sm ring-1 ring-slate-200/80">{icon}</div> : null}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{value}</div>
      {helper ? <p className="mt-1 text-sm leading-5 text-slate-500">{helper}</p> : null}
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
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    purple: "bg-violet-50 text-violet-700 ring-violet-200",
    orange: "bg-orange-50 text-orange-700 ring-orange-200",
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
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              {columns.map((column) => {
                const key = String(column.key);
                return (
                  <th className={cn("px-4 py-3.5 font-semibold", isNumericColumn(key) && "text-right")} key={key}>
                    {column.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {rows.map((row, index) => (
              <tr key={String((row as { id?: unknown }).id ?? index)} className="transition hover:bg-blue-50/35">
                {columns.map((column) => {
                  const key = String(column.key);
                  return (
                    <td className={cn("px-4 py-3.5 align-middle", isNumericColumn(key) && "text-right tabular-nums")} key={key}>
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
    <div className="mb-6 flex flex-col gap-2 border-b border-slate-200/70 pb-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Productos Tendencia</p>
      <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
      <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
