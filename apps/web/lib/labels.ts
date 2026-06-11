export type BadgeTone = "default" | "green" | "amber" | "red" | "blue" | "purple" | "orange" | "softRed";

const statusLabels: Record<string, string> = {
  ABIERTA: "ABIERTA",
  CONSULTA: "CONSULTA",
  SENADO: "SEÑADO",
  COMPRADO_PROVEEDOR: "COMPRADO A PROVEEDOR",
  EN_TRANSITO: "EN TRÁNSITO",
  ENTREGADO: "ENTREGADO",
  CANCELADO: "CANCELADO",
  PERDIDA: "PÉRDIDA",
  RESERVA_SIN_SENA: "RESERVA SIN SEÑA",
  RESERVA_CON_SENA: "RESERVA CON SEÑA",
  CONVERTIDA_PEDIDO: "CONVERTIDA A PEDIDO",
  ACTIVO: "ACTIVO",
  PAUSADO: "PAUSADO",
  AGOTADO: "AGOTADO",
  DESCARTADO: "DESCARTADO",
  STOCK: "STOCK",
  ENCARGO: "ENCARGO",
  PRUEBA: "PRUEBA",
  PLANIFICADO: "PLANIFICADO",
  PUBLICADO: "PUBLICADO",
};

export function statusLabel(status: string) {
  return statusLabels[status] ?? status.replaceAll("_", " ");
}

export function orderStatusTone(status: string): BadgeTone {
  if (status === "CONSULTA") return "amber";
  if (status === "SENADO") return "blue";
  if (status === "COMPRADO_PROVEEDOR") return "purple";
  if (status === "EN_TRANSITO") return "orange";
  if (status === "ENTREGADO") return "green";
  if (status === "CANCELADO") return "red";
  return "default";
}

export function inquiryStatusTone(status: string): BadgeTone {
  if (status === "CONVERTIDA_PEDIDO") return "green";
  if (status === "RESERVA_CON_SENA") return "green";
  if (status === "PERDIDA") return "softRed";
  if (status === "RESERVA_SIN_SENA") return "amber";
  return "default";
}

export function productStatusTone(status: string): BadgeTone {
  if (status === "ACTIVO") return "green";
  if (status === "PAUSADO") return "amber";
  if (status === "DESCARTADO" || status === "AGOTADO") return "red";
  return "default";
}

export function providerStatusTone(status: string): BadgeTone {
  if (status === "ACTIVO") return "green";
  if (status === "DESCARTADO") return "red";
  return "amber";
}
