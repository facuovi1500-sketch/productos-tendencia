"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, CalendarDays, LayoutDashboard, MessageSquareText, PackageSearch, ShoppingCart, Store, Users, UserRoundCheck, type LucideIcon } from "lucide-react";
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
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur md:block">
        <div className="mb-6 rounded-xl bg-slate-950 px-3 py-4 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/10 p-2">
              <PackageSearch className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <div className="font-bold leading-tight">Productos Tendencia</div>
              <div className="text-xs text-slate-300">Operación diaria</div>
            </div>
          </div>
          <div className="mt-3 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-200">
            Caja, señas y pedidos
          </div>
        </div>
        <nav className="space-y-5">
          {!isAuthenticated ? <NavLink href="/login" icon={UserRoundCheck} isActive={pathname === "/login"} label="Iniciar sesión" /> : null}

          {groups.map((group) => (
            <div key={group.label}>
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink href={item.href} icon={item.icon} isActive={pathname === item.href} key={item.href} label={item.label} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="mb-3 flex items-center gap-2">
          <PackageSearch className="h-5 w-5 text-slate-900" />
          <span className="font-semibold text-slate-950">Productos Tendencia</span>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {!isAuthenticated ? <MobileLink href="/login" isActive={pathname === "/login"} label="Login" /> : null}
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
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950",
        isActive && "bg-slate-950 text-white shadow-sm hover:bg-slate-950 hover:text-white",
      )}
      href={href}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function MobileLink({ href, isActive, label }: { href: string; isActive: boolean; label: string }) {
  return (
    <Link
      className={cn(
        "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200",
        isActive && "bg-slate-950 text-white ring-slate-950",
      )}
      href={href}
    >
      {label}
    </Link>
  );
}
