"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  LayoutDashboard,
  MessageSquareText,
  PackageSearch,
  ShoppingCart,
  Store,
  Users,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getClientApiStatus, SESSION_EVENT } from "@/lib/client-api";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Operación",
    items: [
      { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
      { href: "/inquiries", label: "Consultas", icon: MessageSquareText },
      { href: "/orders", label: "Pedidos", icon: ShoppingCart },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/products", label: "Productos", icon: Boxes },
      { href: "/providers", label: "Proveedores", icon: Store },
    ],
  },
  {
    label: "Comunidad",
    items: [
      { href: "/customers", label: "Clientes", icon: UserRoundCheck },
      { href: "/community", label: "Comunidad", icon: Users },
      { href: "/content", label: "Contenido", icon: CalendarDays },
    ],
  },
  {
    label: "Análisis",
    items: [{ href: "/metrics", label: "Métricas", icon: BarChart3 }],
  },
];

const mobileItems = groups.flatMap((group) => group.items);

export function SideNav() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    async function refreshSession() {
      const status = await getClientApiStatus();
      if (isMounted) {
        setIsAuthenticated(status === "connected");
      }
    }

    refreshSession();
    window.addEventListener(SESSION_EVENT, refreshSession);
    window.addEventListener("storage", refreshSession);
    window.addEventListener("focus", refreshSession);

    return () => {
      isMounted = false;
      window.removeEventListener(SESSION_EVENT, refreshSession);
      window.removeEventListener("storage", refreshSession);
      window.removeEventListener("focus", refreshSession);
    };
  }, []);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200/80 bg-white/92 px-4 py-5 shadow-soft backdrop-blur-xl md:flex md:flex-col">
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white shadow-sm">
              <PackageSearch className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold leading-tight text-slate-950">Productos Tendencia</div>
              <div className="mt-0.5 text-xs text-slate-500">Control operativo</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">Caja</span>
            <span className="rounded-lg bg-blue-50 px-2 py-1 text-blue-700">Señas</span>
            <span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-700">Pedidos</span>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {!isAuthenticated ? <NavLink href="/login" icon={UserRoundCheck} isActive={pathname === "/login"} label="Iniciar sesión" /> : null}

          {groups.map((group) => (
            <div key={group.label}>
              <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{group.label}</div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink href={item.href} icon={item.icon} isActive={pathname === item.href} key={item.href} label={item.label} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          <div className="font-semibold text-slate-900">Uso diario</div>
          <p className="mt-1">Cargá consultas, cobros y caja con datos reales antes de decidir compras.</p>
        </div>
      </aside>

      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:hidden">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white">
              <PackageSearch className="h-4 w-4" />
            </span>
            <div>
              <span className="block text-sm font-bold text-slate-950">Productos Tendencia</span>
              <span className="block text-xs text-slate-500">Operación diaria</span>
            </div>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {!isAuthenticated ? <MobileLink href="/login" isActive={pathname === "/login"} label="Iniciar sesión" /> : null}
          {mobileItems.map((item) => (
            <MobileLink href={item.href} isActive={pathname === item.href} key={item.href} label={item.label} />
          ))}
        </nav>
      </div>
    </>
  );
}

function NavLink({ href, icon: Icon, isActive, label }: { href: string; icon: LucideIcon; isActive: boolean; label: string }) {
  return (
    <Link
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950",
        isActive && "bg-slate-950 text-white shadow-sm hover:bg-slate-950 hover:text-white",
      )}
      href={href}
    >
      <span className={cn("grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-white group-hover:text-slate-950", isActive && "bg-white/10 text-white")}>
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </Link>
  );
}

function MobileLink({ href, isActive, label }: { href: string; isActive: boolean; label: string }) {
  return (
    <Link
      className={cn(
        "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50",
        isActive && "bg-slate-950 text-white ring-slate-950",
      )}
      href={href}
    >
      {label}
    </Link>
  );
}
