"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import { clientApi } from "@/lib/client-api";

export function CashSnapshotForm() {
  const [cashAvailable, setCashAvailable] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      await clientApi("/finance/cash", {
        method: "POST",
        body: JSON.stringify({
          cashAvailable: Number(cashAvailable),
          notes: notes.trim() || undefined,
        }),
      });
      setMessage("Caja actualizada.");
      setCashAvailable("");
      setNotes("");
      window.location.reload();
    } catch {
      setMessage("No se pudo actualizar caja. Revisá sesión y API.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/70" onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
        <label className="text-sm font-medium">
          Caja disponible
          <input
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
            min="0"
            placeholder="Plata real disponible"
            required
            type="number"
            value={cashAvailable}
            onChange={(event) => setCashAvailable(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Nota
          <input
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
            placeholder="Ej: cierre diario, efectivo + transferencias"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <Button className="self-end" disabled={isSaving} variant="success">
          {isSaving ? "Guardando..." : "Actualizar caja"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Caja disponible = plata real hoy. No se calcula desde ganancia teórica.</p>
      {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}
