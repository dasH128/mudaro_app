import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";

import { formatOrderNumber } from "@/features/orders/domain/order-number";
import type { Access, HistoryEvent, JobAddress, JobStatus, PendingQuote, ScheduleJob, ScheduleOverview } from "../domain/types";

// Única puerta de entrada a los datos de la agenda: las páginas importan de aquí.
// Paso 6.2 (20/11/2026): todo sale de Supabase. Vehículos, personas del equipo (crew_members), trabajos con sus
// asignaciones y la ficha del trabajo. RLS: solo los datos de la empresa y solo administradores.

const JOB_STATUS: Record<string, JobStatus | null> = {
  scheduled: "scheduled",
  in_progress: "in-progress",
  delivered: "delivered",
  closed: "closed",
  // Un trabajo cancelado ya no está en la agenda
  cancelled: null,
};

const lisbon = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Lisbon",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Instante ISO → día (aaaa-mm-dd) y hora (hh:mm) de Lisboa. */
function lisbonParts(iso: string): { date: string; time: string } {
  const parts = Object.fromEntries(lisbon.formatToParts(new Date(iso)).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

const moment = (iso: string) => {
  const { date, time } = lisbonParts(iso);
  return { date, time };
};

type AddressRow = {
  address_id: string;
  address: string;
  floor: number;
  lift: string;
  parking_distance_m: number;
  needs_permit: boolean;
};

/** Piso, ascensor y estacionamiento de la base → `Access` de la agenda. */
function accessOf(row: AddressRow): Access {
  return {
    floor: row.floor === 0 ? "ground" : row.floor,
    // La base llama `large` al ascensor normal (ver orders/liftOf)
    elevator: row.lift === "none" ? "none" : row.lift === "small" ? "small" : "normal",
    parking: row.needs_permit
      ? { kind: "permit" }
      : row.parking_distance_m > 0
        ? { kind: "walk", meters: row.parking_distance_m }
        : { kind: "door" },
  };
}

type EventRow = { kind: string; occurred_at: string; data: unknown };

/** Eventos del envío que cuentan en el histórico del trabajo, del más reciente al más antiguo. */
function historyOf(events: readonly EventRow[]): HistoryEvent[] {
  return [...events]
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    .flatMap((row): HistoryEvent[] => {
      const by = String((row.data as { by?: unknown } | null)?.by ?? "");
      if (row.kind === "won") return [{ kind: "quote-accepted", at: moment(row.occurred_at) }];
      if (row.kind === "job_assigned") return [{ kind: "crew-assigned", at: moment(row.occurred_at), by }];
      if (row.kind === "job_rescheduled") return [{ kind: "rescheduled", at: moment(row.occurred_at), by }];
      if (row.kind === "pickup_recorded") return [{ kind: "pickup-signed", at: moment(row.occurred_at), by }];
      if (row.kind === "delivery_recorded") return [{ kind: "delivery-signed", at: moment(row.occurred_at), by }];
      if (row.kind === "incident_reported") return [{ kind: "incident-reported", at: moment(row.occurred_at), by }];
      if (row.kind === "incident_resolved") return [{ kind: "incident-resolved", at: moment(row.occurred_at), by }];
      return [];
    });
}

/** Vehículos, personas, trabajos con asignaciones y orçamentos enviados de la empresa de la sesión. */
export async function getScheduleOverview(): Promise<ScheduleOverview> {
  const supabase = await createSupabaseServerClient();
  const [vehicles, people, jobs, quotes] = await Promise.all([
    supabase.from("vehicles").select("id, name, plate, capacity_m3, active").order("created_at"),
    supabase.from("crew_members").select("id, name, position, active").order("name"),
    supabase.from("jobs").select(
      `id, status, scheduled_start, scheduled_end,
       shipment:shipments!inner(number,
         client:clients(name, phone),
         order:orders!inner(contact_name, contact_phone, addresses(id, role, sort_order)),
         events:shipment_events(kind, occurred_at, data)),
       quote:quotes!inner(operator_count, volume_m3, estimated_hours, km,
         inventory:inventories(inventory_addresses(address_id, address, floor, lift, parking_distance_m, needs_permit)),
         acceptances(signed_total_cents, accepted_at)),
       assignments(vehicle_id, crew_member_id, is_lead)`,
    ),
    supabase
      .from("quotes")
      .select("number, operator_count, shipment:shipments!inner(client:clients(name), order:orders!inner(contact_name, desired_date))")
      .eq("status", "sent"),
  ]);
  if (vehicles.error) throw new Error(`schedule: no se pudieron leer los vehículos (${vehicles.error.code})`);
  if (people.error) throw new Error(`schedule: no se pudieron leer las personas (${people.error.code})`);
  if (jobs.error) throw new Error(`schedule: no se pudieron leer los trabajos (${jobs.error.code})`);
  if (quotes.error) throw new Error(`schedule: no se pudieron leer los orçamentos (${quotes.error.code})`);

  const scheduleJobs: ScheduleJob[] = jobs.data.flatMap((row) => {
    const status = JOB_STATUS[row.status];
    if (!status) return [];
    const start = lisbonParts(row.scheduled_start);
    const end = lisbonParts(row.scheduled_end);
    const order = row.shipment.order;

    // Origen y destino de la versión del inventario con la que se calculó el orçamento
    const texts = (row.quote.inventory?.inventory_addresses ?? []) as AddressRow[];
    const slots = [...order.addresses].sort((a, b) => a.sort_order - b.sort_order);
    const ends = [slots[0], slots[slots.length - 1]];
    const addresses: JobAddress[] = ends.flatMap((slot, index) => {
      const text = texts.find((item) => item.address_id === slot?.id);
      return text ? [{ kind: index === 0 ? "origin" : "destination", place: text.address, access: accessOf(text) } as JobAddress] : [];
    });

    const vehicleId = row.assignments.find((a) => a.vehicle_id)?.vehicle_id ?? null;
    const crewIds = row.assignments.flatMap((a) => (a.crew_member_id ? [a.crew_member_id] : []));
    const leadId = row.assignments.find((a) => a.is_lead)?.crew_member_id ?? undefined;
    const acceptance = [...row.quote.acceptances].sort((a, b) => b.accepted_at.localeCompare(a.accepted_at))[0];

    return [
      {
        id: formatOrderNumber(row.shipment.number),
        jobId: row.id,
        client: row.shipment.client?.name ?? order.contact_name,
        date: start.date,
        start: start.time,
        // Un trabajo que acaba otro día se dibuja hasta el final del día de inicio
        end: end.date === start.date ? end.time : "23:59",
        from: addresses.find((a) => a.kind === "origin")?.place ?? "",
        to: addresses.find((a) => a.kind === "destination")?.place ?? "",
        vehicleId,
        crewIds,
        crewNeeded: row.quote.operator_count ?? 0,
        status,
        volumeM3: Number(row.quote.volume_m3 ?? 0),
        detail: {
          addresses,
          history: historyOf(row.shipment.events),
          leadId,
          estimate: { hours: Number(row.quote.estimated_hours ?? 0), km: Number(row.quote.km ?? 0) },
          priceCents: acceptance?.signed_total_cents ?? undefined,
          acceptedOn: acceptance ? lisbonParts(acceptance.accepted_at).date : start.date,
          clientPhone: row.shipment.client?.phone ?? order.contact_phone,
        },
      },
    ];
  });

  const pending: PendingQuote[] = quotes.data.map((row) => ({
    id: `ORC-${String(row.number).padStart(4, "0")}`,
    client: row.shipment.client?.name ?? row.shipment.order.contact_name,
    date: row.shipment.order.desired_date,
    crewNeeded: row.operator_count ?? 0,
  }));

  return {
    vehicles: vehicles.data.map((row) => ({ id: row.id, name: row.name ?? row.plate, capacityM3: Number(row.capacity_m3), active: row.active })),
    people: people.data.map((row) => ({ id: row.id, name: row.name, position: row.position, active: row.active })),
    jobs: scheduleJobs.sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)),
    quotes: pending,
  };
}

export type AssignResult =
  | { ok: true }
  | { ok: false; error: "overlap"; resource: "vehicle" | "crew"; resourceId: string; orderId: string | null }
  | { ok: false; error: "unavailable"; resource: "vehicle" | "crew" | "lead"; resourceId: string }
  | { ok: false; error: "notFound" | "notOpen" | "invalid" | "failed" };

type DbError = { code?: string; details?: string } | null;

/** Lee el detalle JSON que ponen las funciones de la agenda en sus errores. */
function detailOf(error: DbError): { resource?: string; id?: string; jobId?: string } {
  try {
    return JSON.parse(error?.details ?? "{}") as { resource?: string; id?: string; jobId?: string };
  } catch {
    return {};
  }
}

/** Traduce los errores de set_job_assignments, reschedule_job y cancel_job. */
async function resultOf(error: DbError): Promise<AssignResult> {
  if (!error) return { ok: true };
  const detail = detailOf(error);
  switch (error.code) {
    case "23P01": {
      // El pedido del trabajo en conflicto, para que el aviso diga "MD-0836"
      let orderId: string | null = null;
      if (detail.jobId) {
        const supabase = await createSupabaseServerClient();
        const { data } = await supabase.from("jobs").select("shipment:shipments!inner(number)").eq("id", detail.jobId).maybeSingle();
        orderId = data ? formatOrderNumber(data.shipment.number) : null;
      }
      return { ok: false, error: "overlap", resource: detail.resource === "vehicle" ? "vehicle" : "crew", resourceId: detail.id ?? "", orderId };
    }
    case "23514":
      return {
        ok: false,
        error: "unavailable",
        resource: detail.resource === "vehicle" ? "vehicle" : detail.resource === "lead" ? "lead" : "crew",
        resourceId: detail.id ?? "",
      };
    case "P0002":
      return { ok: false, error: "notFound" };
    case "55000":
      return { ok: false, error: "notOpen" };
    case "22023":
      return { ok: false, error: "invalid" };
    default:
      console.error(`schedule: la agenda rechazó el cambio (${error.code ?? "sin código"})`);
      return { ok: false, error: "failed" };
  }
}

/** Sustituye vehículo y equipo del trabajo con `set_job_assignments` (RF-48). */
export async function setJobAssignments(input: {
  jobId: string;
  vehicleIds: string[];
  crewIds: string[];
  leadId: string | null;
}): Promise<AssignResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_job_assignments", {
    p_job_id: input.jobId,
    p_vehicle_ids: input.vehicleIds,
    p_crew_member_ids: input.crewIds,
    // Sin jefe de equipo, null; el generador de tipos marca el argumento como no nulo.
    p_lead_id: input.leadId as string,
  });
  return resultOf(error);
}

/** Cambia inicio y fin del trabajo con `reschedule_job` (RF-50). Instantes ISO. */
export async function rescheduleJob(jobId: string, start: string, end: string): Promise<AssignResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("reschedule_job", { p_job_id: jobId, p_start: start, p_end: end });
  return resultOf(error);
}

/** Cancela el trabajo con motivo y libera las asignaciones con `cancel_job` (RF-50). */
export async function cancelJob(jobId: string, reason: string): Promise<AssignResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("cancel_job", { p_job_id: jobId, p_reason: reason });
  return resultOf(error);
}
