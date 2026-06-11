"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import { clientApi } from "@/lib/client-api";

type ProductOption = {
  id: string;
  name: string;
  doNotReorder?: boolean;
  reorderBlockReason?: string | null;
};

export function ProductReorderForm({ products }: { products: ProductOption[] }) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const current = products.find((product) => product.id === productId);
  const [doNotReorder, setDoNotReorder] = useState(Boolean(current?.doNotReorder));
  const [reason, setReason] = useState(current?.reorderBlockReason ?? "");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function selectProduct(id: string) {
    const product = products.find((item) => item.id === id);
    setProductId(id);
    setDoNotReorder(Boolean(product?.doNotReorder));
    setReason(product?.reorderBlockReason ?? "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      await clientApi(`/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({
          doNotReorder,
          reorderBlockReason: reason.trim() || null,
        }),
      });
      setMessage("Bloqueo de recompra actualizado.");
      window.location.reload();
    } catch {
      setMessage("No se pudo actualizar el producto.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/70" onSubmit={submit}>
      <div className="grid gap-3 lg:grid-cols-[220px_190px_1fr_auto]">
        <label className="text-sm font-medium">
          Producto
          <select className="mt-1 w-full rounded-md border border-border px-3 py-2" value={productId} onChange={(event) => selectProduct(event.target.value)}>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm font-medium text-red-700">
          <input checked={doNotReorder} type="checkbox" onChange={(event) => setDoNotReorder(event.target.checked)} />
          No recomprar todavía
        </label>
        <label className="text-sm font-medium">
          Motivo de bloqueo
          <input className="mt-1 w-full rounded-md border border-border px-3 py-2" placeholder="Ej: muchas consultas sin seña, proveedor con reclamos" value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <Button className="self-end" disabled={isSaving || !productId} variant={doNotReorder ? "danger" : "success"}>
          {isSaving ? "Guardando..." : doNotReorder ? "Guardar bloqueo" : "Guardar como OK"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Bloqueá recompra cuando no hay señas reales, hay reclamos o la ganancia todavía es teórica.</p>
      {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}
