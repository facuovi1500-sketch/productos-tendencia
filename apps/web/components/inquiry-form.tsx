"use client";

import { useState, type FormEvent } from "react";
import { clientApi } from "@/lib/client-api";
import { statusLabel } from "@/lib/labels";

const inquiryStatuses = ["ABIERTA", "PERDIDA", "RESERVA_SIN_SENA", "RESERVA_CON_SENA", "CONVERTIDA_PEDIDO"];
const inquirySources = ["WHATSAPP", "INSTAGRAM", "TIKTOK", "REFERIDO", "OTRO"];

type Option = { id: string; name: string };
type NestedEntity = { id?: string; name: string };
type OrderOption = { id: string; status: string; amount: number | string; customer?: NestedEntity; product?: NestedEntity };
type InquiryItem = {
  id: string;
  productId?: string;
  customerId?: string | null;
  orderId?: string | null;
  product?: NestedEntity;
  customer?: NestedEntity | null;
  order?: OrderOption | null;
  source: string;
  status: string;
  note?: string | null;
};

export function InquiryForm({
  inquiries,
  products,
  customers,
  orders,
}: {
  inquiries: InquiryItem[];
  products: Option[];
  customers: Option[];
  orders: OrderOption[];
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [customerId, setCustomerId] = useState("");
  const [source, setSource] = useState("WHATSAPP");
  const [status, setStatus] = useState("ABIERTA");
  const [note, setNote] = useState("");
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [deposit, setDeposit] = useState("");
  const [editInquiryId, setEditInquiryId] = useState(inquiries[0]?.id ?? "");
  const selectedInquiry = inquiries.find((inquiry) => inquiry.id === editInquiryId);
  const [editStatus, setEditStatus] = useState(selectedInquiry?.status ?? "ABIERTA");
  const [editNote, setEditNote] = useState(selectedInquiry?.note ?? "");
  const [editOrderId, setEditOrderId] = useState(selectedInquiry?.orderId ?? selectedInquiry?.order?.id ?? "");
  const [editAmount, setEditAmount] = useState("");
  const [editDeposit, setEditDeposit] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function selectEditInquiry(id: string) {
    const inquiry = inquiries.find((item) => item.id === id);
    setEditInquiryId(id);
    setEditStatus(inquiry?.status ?? "ABIERTA");
    setEditNote(inquiry?.note ?? "");
    setEditOrderId(inquiry?.orderId ?? inquiry?.order?.id ?? "");
    setEditAmount("");
    setEditDeposit("");
  }

  async function createLinkedOrder(input: { productId: string; customerId?: string | null; amount: string; deposit: string }) {
    if (!input.customerId) throw new Error("La seña requiere cliente registrado.");
    if (!Number(input.amount) || !Number(input.deposit)) throw new Error("La seña requiere monto total y seña.");

    const order = await clientApi<OrderOption>("/orders", {
      method: "POST",
      body: JSON.stringify({
        productId: input.productId,
        customerId: input.customerId,
        quantity: 1,
        amount: Number(input.amount),
        deposit: Number(input.deposit),
        amountPaid: Number(input.deposit),
        supplierCost: 0,
        status: "SENADO",
      }),
    });
    return order.id;
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      if (status === "PERDIDA" && !note.trim()) throw new Error("Una consulta perdida requiere motivo.");
      let linkedOrderId = orderId || undefined;
      if (status === "RESERVA_CON_SENA" && !linkedOrderId && deposit) {
        linkedOrderId = await createLinkedOrder({ productId, customerId, amount, deposit });
      }

      await clientApi("/inquiries", {
        method: "POST",
        body: JSON.stringify({
          productId,
          customerId: customerId || undefined,
          source,
          status,
          note: note.trim() || undefined,
          orderId: linkedOrderId,
        }),
      });
      setMessage("Consulta guardada.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar la consulta.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedInquiry) return;
    setIsSaving(true);
    setMessage("");

    try {
      if (editStatus === "PERDIDA" && !editNote.trim()) throw new Error("Una consulta perdida requiere motivo.");
      let linkedOrderId = editOrderId || undefined;
      const sourceProductId = selectedInquiry.productId ?? selectedInquiry.product?.id;
      const sourceCustomerId = selectedInquiry.customerId ?? selectedInquiry.customer?.id;
      if (editStatus === "RESERVA_CON_SENA" && !linkedOrderId && editDeposit && sourceProductId) {
        linkedOrderId = await createLinkedOrder({
          productId: sourceProductId,
          customerId: sourceCustomerId,
          amount: editAmount,
          deposit: editDeposit,
        });
      }

      await clientApi(`/inquiries/${selectedInquiry.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: editStatus,
          note: editNote.trim() || undefined,
          orderId: linkedOrderId,
        }),
      });
      setMessage("Cambio guardado.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar el cambio.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mb-6 grid gap-4 xl:grid-cols-2">
      <form className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/70" onSubmit={submitCreate}>
        <h2 className="text-sm font-semibold text-slate-700">Nueva consulta</h2>
        <p className="mt-1 text-xs text-slate-500">Cargá cada consulta. Solo las reservas con seña o pedidos convierten en demanda validada.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Select label="Producto" value={productId} onChange={setProductId} options={products} />
          <Select label="Cliente opcional" value={customerId} onChange={setCustomerId} options={customers} emptyLabel="Sin cliente" />
          <EnumSelect label="Origen" value={source} values={inquirySources} onChange={setSource} />
          <EnumSelect label="Estado" value={status} values={inquiryStatuses} onChange={setStatus} />
          <label className="text-sm font-medium md:col-span-2">
            {status === "PERDIDA" ? "Motivo de pérdida" : "Nota"}
            <input
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
              placeholder={status === "PERDIDA" ? "Ej: precio alto, no respondió, compró en otro lado" : "Dato útil para seguimiento"}
              required={status === "PERDIDA"}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          {status === "RESERVA_CON_SENA" ? (
            <>
              <Select label="Pedido asociado" value={orderId} onChange={setOrderId} options={orders.map(orderOption)} emptyLabel="Crear pedido desde la seña" />
              <NumberInput label="Monto total" value={amount} onChange={setAmount} />
              <NumberInput label="Seña cobrada" value={deposit} onChange={setDeposit} />
              <p className="text-xs text-slate-500 md:col-span-2">Si cargás seña sin pedido asociado, se crea un pedido SEÑADO con costo real en cero.</p>
            </>
          ) : null}
        </div>
        <button className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60" disabled={isSaving || !productId}>
          {isSaving ? "Guardando..." : "Guardar consulta"}
        </button>
      </form>

      <form className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/70" onSubmit={submitEdit}>
        <h2 className="text-sm font-semibold text-slate-700">Cambiar estado de consulta</h2>
        <p className="mt-1 text-xs text-slate-500">Marcá pérdida, reserva o conversión para separar interés de demanda validada.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Select label="Consulta" value={editInquiryId} onChange={selectEditInquiry} options={inquiries.map((inquiry) => ({ id: inquiry.id, name: `${inquiry.product?.name ?? "Producto"} - ${statusLabel(inquiry.status)}` }))} />
          <EnumSelect label="Estado" value={editStatus} values={inquiryStatuses} onChange={setEditStatus} />
          <label className="text-sm font-medium md:col-span-2">
            {editStatus === "PERDIDA" ? "Motivo de pérdida" : "Nota"}
            <input
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
              placeholder={editStatus === "PERDIDA" ? "Explicá por qué se perdió" : "Dato útil para seguimiento"}
              required={editStatus === "PERDIDA"}
              value={editNote}
              onChange={(event) => setEditNote(event.target.value)}
            />
          </label>
          {editStatus === "RESERVA_CON_SENA" || editStatus === "CONVERTIDA_PEDIDO" ? (
            <>
              <Select label="Pedido asociado" value={editOrderId} onChange={setEditOrderId} options={orders.map(orderOption)} emptyLabel="Sin pedido" />
              <NumberInput label="Monto total" value={editAmount} onChange={setEditAmount} />
              <NumberInput label="Seña cobrada" value={editDeposit} onChange={setEditDeposit} />
            </>
          ) : null}
        </div>
        <button className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60" disabled={isSaving || !editInquiryId}>
          {isSaving ? "Guardando..." : "Guardar cambio"}
        </button>
        {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
      </form>
    </div>
  );
}

function orderOption(order: OrderOption) {
  return { id: order.id, name: `${statusLabel(order.status)} - ${order.customer?.name ?? "Cliente"} - ${order.product?.name ?? "Producto"}` };
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
            {statusLabel(item)}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input className="mt-1 w-full rounded-md border border-border px-3 py-2" min="0" type="number" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
