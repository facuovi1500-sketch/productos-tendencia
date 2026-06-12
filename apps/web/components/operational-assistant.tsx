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
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-950">Asistente operativo</h2>
        <p className="text-sm text-slate-600">Escribí qué pasó y revisá la vista previa antes de guardar.</p>
      </div>

      <form className="mt-4" onSubmit={interpret}>
        <label className="text-sm font-medium text-slate-700">
          Operación
          <textarea
            className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="Ej: Lucas señó 10 camisetas premium, pagó 50000, falta cobrar saldo"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button disabled={isInterpreting || !text.trim()} variant="primary">
            {isInterpreting ? "Interpretando..." : "Interpretar"}
          </Button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </div>
      </form>

      {preview ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge tone={preview.canConfirm ? "green" : "amber"}>{intentLabels[preview.intent]}</Badge>
              <h3 className="mt-3 text-base font-semibold text-slate-950">{preview.preview.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{preview.preview.summary}</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">Confianza {Math.round(preview.confidence * 100)}%</span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(preview.preview.fields).map(([key, value]) => (
              <div className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200" key={key}>
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">{key}</span>
                <strong className="mt-1 block text-slate-800">{value ?? "Falta confirmar"}</strong>
              </div>
            ))}
          </div>

          {preview.preview.warnings.length > 0 ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <strong>Revisar antes de guardar:</strong>
              <ul className="mt-1 list-inside list-disc">
                {preview.preview.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {preview.preview.missingFields.length > 0 ? (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              Faltan datos: {preview.preview.missingFields.join(", ")}.
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <Button disabled={!preview.canConfirm || isConfirming} type="button" variant="success" onClick={confirm}>
              {isConfirming ? "Guardando..." : "Confirmar y guardar"}
            </Button>
            <Button type="button" variant="secondary" onClick={cancel}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
