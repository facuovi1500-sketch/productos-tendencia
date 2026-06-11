import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "warning" | "danger" | "success" | "ghost";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "border-blue-700 bg-blue-700 text-white hover:bg-blue-800 focus-visible:ring-blue-300",
  secondary: "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-slate-300",
  warning: "border-amber-500 bg-amber-500 text-slate-950 hover:bg-amber-600 focus-visible:ring-amber-300",
  danger: "border-red-700 bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-300",
  success: "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-300",
  ghost: "border-transparent bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-300",
};

export function buttonClassName(variant: ButtonVariant = "primary", className?: string) {
  return cn(
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-60",
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
    primary: "border-blue-200 bg-blue-50 text-blue-950 hover:border-blue-300 hover:bg-blue-100",
    secondary: "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50",
    warning: "border-amber-200 bg-amber-50 text-amber-950 hover:border-amber-300 hover:bg-amber-100",
    danger: "border-red-200 bg-red-50 text-red-950 hover:border-red-300 hover:bg-red-100",
    success: "border-emerald-200 bg-emerald-50 text-emerald-950 hover:border-emerald-300 hover:bg-emerald-100",
    ghost: "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
  };

  return (
    <a className={cn("block rounded-xl border p-4 shadow-sm transition", styles[variant])} href={href}>
      <div className="flex items-center gap-2 text-sm font-bold">
        <span className="rounded-lg bg-white/80 p-2 shadow-sm ring-1 ring-black/5">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-xs leading-5 opacity-80">{description}</p>
    </a>
  );
}

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
