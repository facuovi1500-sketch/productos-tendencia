"use client";

import Link from "next/link";
import { CheckCircle2, LogOut, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { clearToken, getClientApiStatus, getToken, SESSION_EVENT } from "@/lib/client-api";

export function ApiStatusBanner() {
  const [status, setStatus] = useState<"checking" | "connected" | "preview">("checking");
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function refreshStatus() {
      setHasToken(Boolean(getToken()));
      setStatus("checking");
      const nextStatus = await getClientApiStatus();
      if (!isMounted) return;
      setStatus(nextStatus);
      setHasToken(Boolean(getToken()));
    }

    refreshStatus();
    window.addEventListener(SESSION_EVENT, refreshStatus);
    window.addEventListener("storage", refreshStatus);
    window.addEventListener("focus", refreshStatus);

    return () => {
      isMounted = false;
      window.removeEventListener(SESSION_EVENT, refreshStatus);
      window.removeEventListener("storage", refreshStatus);
      window.removeEventListener("focus", refreshStatus);
    };
  }, []);

  if (status === "connected") {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-emerald-200/80 bg-emerald-50/90 px-4 py-2.5 text-sm text-emerald-900 backdrop-blur">
        <span className="inline-flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4" />
          Datos reales conectados a la base online.
        </span>
        <button
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100"
          onClick={() => {
            clearToken();
            window.location.reload();
          }}
          type="button"
        >
          <LogOut className="h-3.5 w-3.5" />
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-200/80 bg-amber-50/95 px-4 py-2.5 text-sm text-amber-950 backdrop-blur">
      <span className="inline-flex items-center gap-2 font-medium">
        <WifiOff className="h-4 w-4" />
        {hasToken ? "Sin conexión con la API. No uses estos datos para decidir compras." : "Iniciá sesión para ver y cargar datos reales."}
      </span>
      <Link className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-amber-950 transition hover:bg-amber-100" href="/login">
        Iniciar sesión
      </Link>
    </div>
  );
}
