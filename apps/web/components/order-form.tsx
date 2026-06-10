"use client";

import { useState, type FormEvent } from "react";
import { clientApi } from "@/lib/client-api";
import { money } from "@/lib/utils";

const orderStatuses = ["CONSULTA", "SENADO", "COMPRADO_PROVEEDOR", "EN_TRANSITO", "ENTREGADO", "CANCELADO"];

type Option = { id: string; name: string };
type NestedEntity = { id?: string; name: string };
type OrderItem = {
  id: string;
  customerId?: string;
  productId?: string;
  providerId?: string | null;
  customer?: NestedEntity;
  product?: NestedEntity;
  provider?: NestedEntity | null;
  quantity: number;
  amount: number | string;
  deposit: number | string;
  amountPaid: number | string;
  supplierCost: number | string;
  status: string;
  riskNote?: string | null;
};

export function OrderForm({
  orders,
  products,
  customers,
  providers,
}: {
  orders: OrderItem[];
  products: Option[];
  customers: Option[];
  providers: Option[];
}) {
  return (
    <div className="mb-6 grid gap-4 xl:grid-cols-2">
      <CreateOrderForm products={products} customers={customers} providers={providers} />
      <EditOrderForm orders={orders} products={products} customers={customers} providers={providers} />
    </div>
  );
}

function CreateOrderForm({ products, customers, providers }: { products: Option[]; customers: Option[]; providers: Option[] }) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [providerId, setProviderId] = useState("");
  const [status, setStatus] = useState("CONSULTA");
  const [quantity, setQuantity] = useState("1");
  const [amount, setAmount] = useState("");
  const [deposit, setDeposit] = useState("0");
  const [amountPaid, setAmountPaid] = useState("0");
  const [supplierCost, setSupplierCost] = useState("0");
  const [riskNote, setRiskNote] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const financials = getFinancials(amount, amountPaid, status === "CONSULTA" ? "0" : supplierCost);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      await clientApi("/orders", {
        method: "POST",
        body: JSON.stringify({
          productId,
          customerId,
          providerId: providerId || undefined,
          status,
          quantity: Number(quantity || 1),
          amount: Number(amount || 0),
          deposit: Number(deposit || 0),
          amountPaid: Number(amountPaid || deposit || 0),
          supplierCost: status === "CONSULTA" ? 0 : Number(supplierCost || 0),
          riskNote: riskNote.trim() || undefined,
        }),
      });
      setMessage("Pedido creado.");
      window.location.reload();
    } catch {
      setMessage("No se pudo crear el pedido.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/70" onSubmit={submit}>
      <h2 className="text-sm font-semibold text-slate-700">Crear pedido</h2>
      <p className="mt-1 text-xs text-slate-500">Usá CONSULTA sin costo real. El costo se carga cuando hay compra o proveedor confirmado.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Select label="Cliente" value={customerId} options={customers} onChange={setCustomerId} />
        <Select label="Producto" value={productId} options={products} onChange={setProductId} />
        <Select label="Proveedor" value={providerId} options={providers} emptyLabel="Sin proveedor" onChange={setProviderId} />
        <EnumSelect label="Estado" value={status} values={orderStatuses} onChange={setStatus} />
        <NumberInput label="Cantidad" value={quantity} onChange={setQuantity} />
        <NumberInput label="Monto venta" value={amount} onChange={setAmount} />
        <NumberInput label="Seña" value={deposit} onChange={setDeposit} />
        <NumberInput label="Cobrado" value={amountPaid} onChange={setAmountPaid} />
        <NumberInput label="Costo real" value={status === "CONSULTA" ? "0" : supplierCost} disabled={status === "CONSULTA"} onChange={setSupplierCost} />
        <label className="text-sm font-medium">
          Riesgo
          <input className="mt-1 w-full rounded-md border border-border px-3 py-2" value={riskNote} onChange={(event) => setRiskNote(event.target.value)} />
        </label>
      </div>
      <FinancialPreview estimated={financials.estimated} realized={financials.realized} pending={financials.pending} />
      <button className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60" disabled={isSaving || !productId || !customerId}>
        {isSaving ? "Guardando..." : "Crear pedido"}
      </button>
      {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}

function EditOrderForm({ orders, providers }: { orders: OrderItem[]; products: Option[]; customers: Option[]; providers: Option[] }) {
  const [orderId, setOrderId] = useState(orders[0]?.id ?? "");
  const selected = orders.find((order) => order.id === orderId);
  const [providerId, setProviderId] = useState(selected?.providerId ?? selected?.provider?.id ?? "");
  const [status, setStatus] = useState(selected?.status ?? "CONSULTA");
  const [amount, setAmount] = useState(String(selected?.amount ?? 0));
  const [deposit, setDeposit] = useState(String(selected?.deposit ?? 0));
  const [amountPaid, setAmountPaid] = useState(String(selected?.amountPaid ?? 0));
  const [supplierCost, setSupplierCost] = useState(String(selected?.supplierCost ?? 0));
  const [riskNote, setRiskNote] = useState(selected?.riskNote ?? "");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const financials = getFinancials(amount, amountPaid, status === "CONSULTA" ? "0" : supplierCost);

  function selectOrder(id: string) {
    const order = orders.find((item) => item.id === id);
    setOrderId(id);
    setProviderId(order?.providerId ?? order?.provider?.id ?? "");
    setStatus(order?.status ?? "CONSULTA");
    setAmount(String(order?.amount ?? 0));
    setDeposit(String(order?.deposit ?? 0));
    setAmountPaid(String(order?.amountPaid ?? 0));
    setSupplierCost(String(order?.supplierCost ?? 0));
    setRiskNote(order?.riskNote ?? "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      await clientApi(`/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({
          providerId: providerId || null,
          status,
          amount: Number(amount || 0),
          deposit: Number(deposit || 0),
          amountPaid: Number(amountPaid || 0),
          supplierCost: status === "CONSULTA" ? 0 : Number(supplierCost || 0),
          riskNote: riskNote.trim() || null,
        }),
      });
      setMessage("Pedido actualizado.");
      window.location.reload();
    } catch {
      setMessage("No se pudo actualizar el pedido.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/70" onSubmit={submit}>
      <h2 className="text-sm font-semibold text-slate-700">Editar pedido</h2>
      <p className="mt-1 text-xs text-slate-500">Separá cobro real, costo proveedor y riesgo para no confundir caja con ganancia teórica.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Select
          label="Pedido"
          value={orderId}
          options={orders.map((order) => ({ id: order.id, name: `${order.customer?.name ?? "Cliente"} - ${order.product?.name ?? "Producto"} - ${order.status}` }))}
          onChange={selectOrder}
        />
        <EnumSelect label="Estado" value={status} values={orderStatuses} onChange={setStatus} />
        <Select label="Proveedor" value={providerId} options={providers} emptyLabel="Sin proveedor" onChange={setProviderId} />
        <NumberInput label="Monto venta" value={amount} onChange={setAmount} />
        <NumberInput label="Seña" value={deposit} onChange={setDeposit} />
        <NumberInput label="Cobrado" value={amountPaid} onChange={setAmountPaid} />
        <NumberInput label="Costo real" value={status === "CONSULTA" ? "0" : supplierCost} disabled={status === "CONSULTA"} onChange={setSupplierCost} />
        <label className="text-sm font-medium">
          Riesgo
          <input className="mt-1 w-full rounded-md border border-border px-3 py-2" value={riskNote} onChange={(event) => setRiskNote(event.target.value)} />
        </label>
      </div>
      <FinancialPreview estimated={financials.estimated} realized={financials.realized} pending={financials.pending} />
      <button className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60" disabled={isSaving || !orderId}>
        {isSaving ? "Guardando..." : "Actualizar pedido"}
      </button>
      {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}

function getFinancials(amount: string, amountPaid: string, supplierCost: string) {
  const sale = Number(amount || 0);
  const paid = Number(amountPaid || 0);
  const cost = Number(supplierCost || 0);
  return {
    estimated: sale - cost,
    realized: paid - cost,
    pending: sale - paid,
  };
}

function FinancialPreview({ estimated, realized, pending }: { estimated: number; realized: number; pending: number }) {
  return (
    <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-3">
      <span className="rounded-lg bg-white px-3 py-2 shadow-sm">Ganancia teórica: <strong className="block text-base text-slate-950">{money(estimated)}</strong></span>
      <span className="rounded-lg bg-white px-3 py-2 shadow-sm">Ganancia cobrada: <strong className="block text-base text-slate-950">{money(realized)}</strong></span>
      <span className="rounded-lg bg-white px-3 py-2 shadow-sm">Saldo pendiente: <strong className="block text-base text-slate-950">{money(pending)}</strong></span>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  emptyLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  emptyLabel?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select className="mt-1 w-full rounded-md border border-border px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>
        {emptyLabel ? <option value="">{emptyLabel}</option> : null}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function EnumSelect({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select className="mt-1 w-full rounded-md border border-border px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>
        {values.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberInput({ label, value, disabled, onChange }: { label: string; value: string; disabled?: boolean; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input className="mt-1 w-full rounded-md border border-border px-3 py-2 disabled:bg-slate-100" disabled={disabled} min="0" type="number" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
