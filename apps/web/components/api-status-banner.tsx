"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearToken, getClientApiStatus, getToken } from "@/lib/client-api";

export function ApiStatusBanner() {
  const [status, setStatus] = useState<"checking" | "connected" | "preview">("checking");
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getToken()));
    getClientApiStatus().then(setStatus);
  }, []);

  if (status === "connected") {
    return (
      <div className="flex items-center justify-between border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
        <span>API conectada: datos reales de la base configurada.</span>
        <button
          className="font-medium underline"
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
    <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <span>
        {hasToken
          ? "Verificación operativa: la API protegida no responde con el token actual; la interfaz está en preview sin datos reales."
          : "Verificación operativa: no hay sesión iniciada; la interfaz está en preview sin datos reales."}
      </span>
      <Link className="font-medium underline" href="/login">
        Iniciar sesión
      </Link>
    </div>
  );
}
