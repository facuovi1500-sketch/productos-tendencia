"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Badge } from "@/components/ui";
import { clientApi } from "@/lib/client-api";

type AssistantIntent =
  | "CREATE_INQUIRY"
  | "CREATE_ORDER"
  | "UPDATE_CASH"
  | "REGISTER_DEPOSIT"
  | "MARK_ORDER_DELIVERED"
  | "MARK_INQUIRY_LOST";

type AssistantResponse = {
  intent: AssistantIntent;
  confidence: number;
  canConfirm: boolean;
  preview: {
    title: string;
    summary: string;
    fields: Record<string, string | number | null>;
    warnings: string[];
    missingFields: string[];
  };
  action: {
    type: AssistantIntent;
    payload: Record<string, unknown>;
  };
};

const intentLabels: Record<AssistantIntent, string> = {
  CREATE_INQUIRY: "Crear consulta",
  CREATE_ORDER: "Crear pedido",
  UPDATE_CASH: "Actualizar caja",
  REGISTER_DEPOSIT: "Registrar seña/cobro",
  MARK_ORDER_DELIVERED: "Marcar entregado",
  MARK_INQUIRY_LOST: "Marcar consulta perdida",
};

export function OperationalAssistant() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<AssistantResponse | null>(null);
  const [message, setMessage] = useState("");
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  async function interpret(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setPreview(null);
    setIsInterpreting(true);

    try {
      const response = await clientApi<AssistantResponse>("/assistant/interpret", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setPreview(response);
    } catch (error) {
      setMessage(error instanceof Error ? "No pude interpretar la operación. Revisá el texto e intentá de nuevo." : "No pude interpretar la operación.");
    } finally {
      setIsInterpreting(false);
    }
  }

  async function confirm() {
    if (!preview) return;
    setMessage("");
    setIsConfirming(true);

    try {
      const response = await clientApi<{ ok: boolean; message: string }>("/assistant/confirm", {
        method: "POST",
        body: JSON.stringify({
          intent: preview.intent,
          payload: preview.action.payload,
        }),
      });
      setMessage(response.message);
      setText("");
      setPreview(null);
      router.refresh();
    } catch {
      setMessage("No se pudo guardar. Faltan datos o la operación es ambigua.");
    } finally {
      setIsConfirming(false);
    }
  }

  function cancel() {
    setPreview(null);
    setMessage("");
  }

  return (
    <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
      <form className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end" onSubmit={interpret}>
        <label className="block text-sm font-medium text-slate-700">
          <span className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
            <strong className="text-base text-slate-950">Asistente operativo</strong>
            <span className="text-xs font-normal text-slate-500">Carga rápida con vista previa antes de guardar.</span>
          </span>
          <textarea
            className="mt-2 min-h-[68px] w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            placeholder="Ej: Lucas señó 10 camisetas premium, pagó 50000, falta cobrar saldo"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <Button className="w-full sm:w-auto" disabled={isInterpreting || !text.trim()} variant="primary">
            {isInterpreting ? "Interpretando..." : "Interpretar"}
          </Button>
          {message ? <p className="w-full text-xs text-slate-600 xl:max-w-xs">{message}</p> : null}
        </div>
      </form>

      {preview ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={preview.canConfirm ? "green" : "amber"}>{intentLabels[preview.intent]}</Badge>
                <span className="text-xs font-semibold text-slate-500">Confianza {Math.round(preview.confidence * 100)}%</span>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-slate-950">{preview.preview.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{preview.preview.summary}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button disabled={!preview.canConfirm || isConfirming} type="button" variant="success" onClick={confirm}>
                {isConfirming ? "Guardando..." : "Confirmar"}
              </Button>
              <Button type="button" variant="secondary" onClick={cancel}>
                Cancelar
              </Button>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(preview.preview.fields).map(([key, value]) => (
              <div className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200" key={key}>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{key}</span>
                <strong className="mt-1 block truncate text-slate-800">{value ?? "Falta confirmar"}</strong>
              </div>
            ))}
          </div>

          {preview.preview.warnings.length > 0 ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <strong>Revisar:</strong> {preview.preview.warnings.join(" ")}
            </div>
          ) : null}

          {preview.preview.missingFields.length > 0 ? (
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              Faltan datos: {preview.preview.missingFields.join(", ")}.
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
