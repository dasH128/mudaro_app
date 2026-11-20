// Ejecución del trabajo (paso 6.4 y 6.5): actas de recogida y entrega, fotos e incidencias. Instantes ISO e importes
// en céntimos. `source` dice si se registró desde el panel o, más adelante, desde la app del operario.

export const INCIDENT_TYPES = ["damage", "undeclared_item", "delay", "access", "other"] as const;
export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const HANDOVER_MOMENTS = ["pickup", "delivery"] as const;
export type HandoverMoment = (typeof HANDOVER_MOMENTS)[number];

export type RecordSource = "panel" | "app";

/** Foto del trabajo. `url` es un enlace firmado y temporal (RNF-05); `null` si no se pudo firmar. */
export type Photo = { id: string; moment: HandoverMoment | "incident"; incidentId: string | null; takenAt: string; url: string | null; source: RecordSource };

export type Handover = {
  id: string;
  moment: HandoverMoment;
  signerName: string;
  signedAt: string;
  remarks: string | null;
  /** Foto del acta firmada en papel, enlace firmado y temporal. */
  documentUrl: string | null;
  source: RecordSource;
};

export type Incident = {
  id: string;
  type: IncidentType;
  description: string;
  extraAmountCents: number;
  occurredAt: string;
  status: "open" | "resolved";
  resolutionNote: string | null;
  resolvedAt: string | null;
  source: RecordSource;
  photos: Photo[];
};

export type JobExecution = {
  pickup: Handover | null;
  delivery: Handover | null;
  /** Fotos de recogida y entrega (las de incidencias van con su incidencia). */
  photos: Photo[];
  incidents: Incident[];
};

/** Qué se puede hacer según el estado del trabajo (las funciones de la base lo comprueban otra vez). */
export function executionRules(status: "scheduled" | "in-progress" | "delivered" | "closed") {
  const open = status !== "closed";
  return {
    recordPickup: status === "scheduled",
    recordDelivery: status === "in-progress",
    reportIncident: status === "in-progress" || status === "delivered",
    addPhotos: open,
    // Quitar la recogida solo sin entrega ni incidencias; quitar la entrega devuelve el trabajo a "em curso"
    deletePickup: (incidents: number) => status === "in-progress" && incidents === 0,
    deleteDelivery: status === "delivered",
    deleteRecords: open,
  };
}
