import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";

import { formatOrderNumber } from "@/features/orders/domain/order-number";
import type { JobStatus, PendingQuote, ScheduleJob, ScheduleOverview } from "../domain/types";
import { PEOPLE, VEHICLES, mockJobs, mockQuotes } from "./mock-data";

// Única puerta de entrada a los datos de la agenda: las páginas importan de aquí.
// Paso 5.6 (19/11/2026): los trabajos que nacen al aceptar un orçamento (RF-46) y los orçamentos enviados salen de
// Supabase y se suman a los de ejemplo. Personas, vehículos, asignaciones y la ficha del trabajo siguen siendo de
// ejemplo hasta el paso 6.

type Options = {
  /** Día de hoy en Lisboa (aaaa-mm-dd): las fechas de ejemplo se calculan desde él. */
  today: string;
};

const JOB_STATUS: Record<string, JobStatus | null> = {
  scheduled: "scheduled",
  in_progress: "in-progress",
  delivered: "delivered",
  closed: "closed",
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

/** hh:mm + horas → hh:mm, sin pasar de las 23:59. */
function addHours(time: string, hours: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(h * 60 + m + Math.round(hours * 60), 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

type Addressed = { addresses: { id: string; role: string; sort_order: number }[] };

/** Origen y destino en texto, de la versión del inventario con la que se calculó el orçamento. */
function endsOf(order: Addressed, texts: { address_id: string; address: string }[]): { from: string; to: string } {
  const sorted = [...order.addresses].sort((a, b) => a.sort_order - b.sort_order);
  const text = (slot: { id: string } | undefined) => texts.find((row) => row.address_id === slot?.id)?.address ?? "";
  return { from: text(sorted[0]), to: text(sorted[sorted.length - 1]) };
}

/** Trabajos reales (RF-46) y orçamentos enviados a la espera, con RLS (solo los de la empresa, solo administradores). */
async function getRealSchedule(): Promise<{ jobs: ScheduleJob[]; quotes: PendingQuote[] }> {
  const supabase = await createSupabaseServerClient();
  const [jobs, quotes] = await Promise.all([
    supabase.from("jobs").select(
      `status, scheduled_start,
       shipment:shipments!inner(number, client:clients(name), order:orders!inner(contact_name, addresses(id, role, sort_order))),
       quote:quotes!inner(operator_count, volume_m3, estimated_hours, inventory:inventories(inventory_addresses(address_id, address)))`,
    ),
    supabase.from("quotes").select("number, operator_count, shipment:shipments!inner(client:clients(name), order:orders!inner(contact_name, desired_date))").eq("status", "sent"),
  ]);
  if (jobs.error) throw new Error(`schedule: no se pudieron leer los trabajos (${jobs.error.code})`);
  if (quotes.error) throw new Error(`schedule: no se pudieron leer los orçamentos (${quotes.error.code})`);

  return {
    jobs: jobs.data.flatMap((row) => {
      const status = JOB_STATUS[row.status];
      if (!status) return [];
      const { date, time } = lisbonParts(row.scheduled_start);
      const hours = Number(row.quote.estimated_hours ?? 4);
      const { from, to } = endsOf(row.shipment.order, row.quote.inventory?.inventory_addresses ?? []);
      return [
        {
          id: formatOrderNumber(row.shipment.number),
          client: row.shipment.client?.name ?? row.shipment.order.contact_name,
          date,
          start: time,
          end: addHours(time, hours),
          from,
          to,
          // Equipo y vehículo se asignan en el paso 6
          vehicleId: null,
          crewIds: [],
          crewNeeded: row.quote.operator_count ?? 0,
          status,
          volumeM3: Number(row.quote.volume_m3 ?? 0),
        },
      ];
    }),
    quotes: quotes.data.map((row) => ({
      id: `ORC-${String(row.number).padStart(4, "0")}`,
      client: row.shipment.client?.name ?? row.shipment.order.contact_name,
      date: row.shipment.order.desired_date,
      crewNeeded: row.operator_count ?? 0,
    })),
  };
}

/** Trabajos, presupuestos pendientes, vehículos y personas de la empresa de la sesión. */
export async function getScheduleOverview({ today }: Options): Promise<ScheduleOverview> {
  const real = await getRealSchedule();
  return {
    vehicles: VEHICLES,
    people: PEOPLE,
    jobs: [...real.jobs, ...mockJobs(today)],
    quotes: [...real.quotes, ...mockQuotes(today)],
  };
}
