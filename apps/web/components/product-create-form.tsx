"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import { clientApi } from "@/lib/client-api";

const productModes = ["STOCK", "ENCARGO", "PREVENTA"] as const;
const productStatuses = ["ACTIVO", "PAUSADO"] as const;
const productTypes = ["ESTABLE", "PRODUCTO_DEL_MOMENTO"] as const;

type ProductModeInput = (typeof productModes)[number];
type ProductStatusInput = (typeof productStatuses)[number];
type ProductTypeInput = (typeof productTypes)[number];

const temporaryProductNote = "Producto temporal. No recomprar sin ventas/señas confirmadas.";

export function ProductCreateForm() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [cost, setCost] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [stock, setStock] = useState("0");
  const [mode, setMode] = useState<ProductModeInput>("ENCARGO");
  const [status, setStatus] = useState<ProductStatusInput>("ACTIVO");
  const [productType, setProductType] = useState<ProductTypeInput>("ESTABLE");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const isMomentProduct = productType === "PRODUCTO_DEL_MOMENTO";
    const reorderBlockReason = isMomentProduct ? note.trim() || temporaryProductNote : null;

    try {
      await clientApi("/products", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim(),
          cost: Number(cost || 0),
          retailPrice: Number(retailPrice || 0),
          wholesalePrice: Number(wholesalePrice || 0),
          stock: Number(stock || 0),
          mode: mode === "PREVENTA" ? "ENCARGO" : mode,
          status,
          doNotReorder: isMomentProduct,
          reorderBlockReason,
        }),
      });
      setMessage("Producto creado.");
      setName("");
      setCategory("");
      setCost("");
      setRetailPrice("");
      setWholesalePrice("");
      setStock("0");
      setMode("ENCARGO");
      setStatus("ACTIVO");
      setProductType("ESTABLE");
      setNote("");
      window.location.reload();
    } catch {
      setMessage("No se pudo crear el producto.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/70" onSubmit={submit}>
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-slate-800">Crear producto</h2>
        <p className="text-xs text-slate-500">Alta rápida para operar productos reales. La preventa se guarda como encargo en el modelo actual.</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TextInput label="Nombre" required value={name} onChange={setName} placeholder="Ej: Camiseta titular 2026" />
        <TextInput label="Categoría" required value={category} onChange={setCategory} placeholder="Ej: Camisetas Tailandesas" />
        <NumberInput label="Costo unitario" required value={cost} onChange={setCost} />
        <NumberInput label="Precio minorista" required value={retailPrice} onChange={setRetailPrice} />
        <NumberInput label="Precio mayorista" required value={wholesalePrice} onChange={setWholesalePrice} />
        <NumberInput label="Stock inicial" value={stock} onChange={setStock} />
        <SelectInput label="Modalidad" value={mode} values={productModes} onChange={(value) => setMode(value as ProductModeInput)} />
        <SelectInput label="Estado" value={status} values={productStatuses} onChange={(value) => setStatus(value as ProductStatusInput)} />
        <SelectInput label="Tipo de producto" value={productType} values={productTypes} onChange={(value) => setProductType(value as ProductTypeInput)} />
        <label className="text-sm font-medium xl:col-span-3">
          Nota operativa
          <input
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
            placeholder={productType === "PRODUCTO_DEL_MOMENTO" ? temporaryProductNote : "Opcional"}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      </div>

      {productType === "PRODUCTO_DEL_MOMENTO" ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Producto del momento: se crea bloqueado para recompra hasta tener ventas o señas confirmadas.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button disabled={isSaving || !name.trim() || !category.trim()} variant="primary">
          {isSaving ? "Guardando..." : "Crear producto"}
        </Button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </form>
  );
}

function TextInput({
  label,
  onChange,
  placeholder,
  required,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        className="mt-1 w-full rounded-md border border-border px-3 py-2"
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function NumberInput({ label, onChange, required, value }: { label: string; onChange: (value: string) => void; required?: boolean; value: string }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input className="mt-1 w-full rounded-md border border-border px-3 py-2" min="0" required={required} type="number" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectInput({ label, onChange, value, values }: { label: string; onChange: (value: string) => void; value: string; values: readonly string[] }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select className="mt-1 w-full rounded-md border border-border px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>
        {values.map((item) => (
          <option key={item} value={item}>
            {item.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
