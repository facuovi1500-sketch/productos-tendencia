"use client";

import { useState, type FormEvent } from "react";
import { clientApi } from "@/lib/client-api";

type CustomerItem = {
  id: string;
  name: string;
  phone: string;
  city: string;
};

export function CustomerForm({ customers }: { customers: CustomerItem[] }) {
  return (
    <div className="mb-6 grid gap-4 xl:grid-cols-2">
      <CreateCustomerForm />
      <EditCustomerForm customers={customers} />
    </div>
  );
}

function CreateCustomerForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      await clientApi("/customers", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), city: city.trim() }),
      });
      setMessage("Cliente creado.");
      window.location.reload();
    } catch {
      setMessage("No se pudo crear el cliente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/70" onSubmit={submit}>
      <h2 className="text-sm font-semibold text-slate-700">Crear cliente</h2>
      <p className="mt-1 text-xs text-slate-500">Queda disponible para consultas y pedidos al guardar.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <TextInput label="Nombre" value={name} onChange={setName} />
        <TextInput label="Teléfono / WhatsApp" value={phone} onChange={setPhone} />
        <TextInput label="Ciudad" value={city} onChange={setCity} />
      </div>
      <button className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60" disabled={isSaving || !name.trim() || !phone.trim() || !city.trim()}>
        {isSaving ? "Guardando..." : "Crear cliente"}
      </button>
      {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}

function EditCustomerForm({ customers }: { customers: CustomerItem[] }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const selected = customers.find((customer) => customer.id === customerId);
  const [name, setName] = useState(selected?.name ?? "");
  const [phone, setPhone] = useState(selected?.phone ?? "");
  const [city, setCity] = useState(selected?.city ?? "");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function selectCustomer(id: string) {
    const customer = customers.find((item) => item.id === id);
    setCustomerId(id);
    setName(customer?.name ?? "");
    setPhone(customer?.phone ?? "");
    setCity(customer?.city ?? "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      await clientApi(`/customers/${customerId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), city: city.trim() }),
      });
      setMessage("Cliente actualizado.");
      window.location.reload();
    } catch {
      setMessage("No se pudo actualizar el cliente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100/70" onSubmit={submit}>
      <h2 className="text-sm font-semibold text-slate-700">Editar cliente</h2>
      <p className="mt-1 text-xs text-slate-500">Actualizá datos básicos sin convertirlo en CRM avanzado.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium">
          Cliente
          <select className="mt-1 w-full rounded-md border border-border px-3 py-2" value={customerId} onChange={(event) => selectCustomer(event.target.value)}>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>
        <TextInput label="Nombre" value={name} onChange={setName} />
        <TextInput label="Teléfono / WhatsApp" value={phone} onChange={setPhone} />
        <TextInput label="Ciudad" value={city} onChange={setCity} />
      </div>
      <button className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60" disabled={isSaving || !customerId || !name.trim() || !phone.trim() || !city.trim()}>
        {isSaving ? "Guardando..." : "Guardar cambios"}
      </button>
      {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input className="mt-1 w-full rounded-md border border-border px-3 py-2" required value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
