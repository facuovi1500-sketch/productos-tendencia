"use client";

import Link from "next/link";
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
      <div className="flex items-center justify-between gap-3 border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
        <span>Datos reales conectados a la base online.</span>
        <button
          className="shrink-0 font-medium underline"
          onClick={() => {
            clearToken();
            window.location.reload();
          }}
          type="button"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <span>{hasToken ? "Sin conexión con la API. No uses estos datos para decidir compras." : "Iniciá sesión para ver y cargar datos reales."}</span>
      <Link className="shrink-0 font-medium underline" href="/login">
        Iniciar sesión
      </Link>
    </div>
  );
}
