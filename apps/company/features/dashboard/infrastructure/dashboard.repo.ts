import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";

import { formatOrderNumber } from "@/features/orders/domain/order-number";
import { getScheduleOverview } from "@/features/schedule/infrastructure/schedule.repo";
import type { ActivityEvent, ActivityItem, ActivityTone, Dashboard, Job, Stage, StageKey } from "../domain/types";

// Única puerta de entrada a los datos de "Operações de hoje" (paso 6.8). Todo sale de Supabase con RLS: los trabajos
// y la flota de la Agenda, las incidencias abiertas, los pedidos por etapa y los últimos eventos de los envíos.

type Options = {
  /** Hoy en Lisboa, aaaa-mm-dd. */
  today: string;
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

function lisbonParts(iso: string): { date: string; time: string } {
  const parts = Object.fromEntries(lisbon.formatToParts(new Date(iso)).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

/** Etapa de la portada de cada estado del envío; perdidos y cancelados no cuentan. */
const STAGE_OF: Record<string, StageKey | null> = {
  new: "new",
  awaiting_inventory: "link-sent",
  inventory_received: "inventory-received",
  quoted: "quote-sent",
  won: "won",
  lost: null,
  cancelled: null,
};

/** Eventos del historial que salen en "Atividade recente". */
const ACTIVITY_KINDS = ["won", "job_assigned", "pickup_recorded", "delivery_recorded", "incident_reported", "incident_resolved", "job_closed"] as const;

/** Evento de la portada y tono de cada uno. */
const ACTIVITY_OF: Record<string, { event: ActivityEvent; tone: ActivityTone } | undefined> = {
  won: { event: "quote-accepted", tone: "success" },
  job_assigned: { event: "crew-assigned", tone: "ink" },
  pickup_recorded: { event: "pickup-done", tone: "primary" },
  delivery_recorded: { event: "delivery-done", tone: "success" },
  incident_reported: { event: "incident-logged", tone: "danger" },
  incident_resolved: { event: "incident-resolved", tone: "ink" },
  job_closed: { event: "job-closed", tone: "success" },
};

/** Resumen de "Operações de hoje" de la empresa de la sesión. */
export async function getDashboard({ today }: Options): Promise<Dashboard> {
  const supabase = await createSupabaseServerClient();
  const [schedule, incidents, shipments, events] = await Promise.all([
    getScheduleOverview(),
    supabase
      .from("incidents")
      .select("description, recorded_at, job:jobs!inner(shipment:shipments!inner(number))")
      .eq("status", "open")
      .order("recorded_at", { ascending: false }),
    supabase.from("shipments").select("status"),
    supabase
      .from("shipment_events")
      .select("id, kind, occurred_at, data, shipment:shipments!inner(number)")
      .in("kind", [...ACTIVITY_KINDS])
      .order("occurred_at", { ascending: false })
      .limit(6),
  ]);
  if (incidents.error) throw new Error(`dashboard: no se pudieron leer las incidencias (${incidents.error.code})`);
  if (shipments.error) throw new Error(`dashboard: no se pudieron leer los pedidos (${shipments.error.code})`);
  if (events.error) throw new Error(`dashboard: no se pudo leer la actividad (${events.error.code})`);

  // Trabajos de hoy y, de otros días, los que siguen en curso
  const todayJobs = schedule.jobs.filter((job) => job.date === today || job.status === "in-progress");
  const vehicleName = (id: string | null) => schedule.vehicles.find((v) => v.id === id)?.name ?? null;
  const jobs: Job[] = todayJobs
    .map((job): Job => {
      const unassigned = job.status === "scheduled" && (job.vehicleId === null || job.crewIds.length === 0);
      return {
        id: job.id,
        client: job.client,
        kind: null,
        typology: null,
        from: job.from,
        to: job.to,
        volumeM3: job.volumeM3,
        trips: 1,
        status: job.status === "in-progress" ? "in-progress" : job.status === "scheduled" ? (unassigned ? "unassigned" : "scheduled") : "done",
        phase: null,
        vehicle: vehicleName(job.vehicleId),
        crewCount: job.crewIds.length,
        time: job.start,
      };
    })
    .sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));

  const stageCount = new Map<StageKey, number>();
  for (const row of shipments.data) {
    const key = STAGE_OF[row.status];
    if (key) stageCount.set(key, (stageCount.get(key) ?? 0) + 1);
  }
  const stages: Stage[] = (["new", "link-sent", "inventory-received", "quote-sent", "won"] as const).map((key) => ({
    key,
    count: stageCount.get(key) ?? 0,
    tone: key === "inventory-received" ? "warn" : key === "won" ? "success" : "neutral",
  }));

  const activity: ActivityItem[] = events.data.flatMap((row): ActivityItem[] => {
    const kind = ACTIVITY_OF[row.kind];
    if (!kind) return [];
    const when = lisbonParts(row.occurred_at);
    const by = String((row.data as { by?: unknown } | null)?.by ?? "");
    return [
      {
        id: String(row.id),
        // Hoy, solo la hora; otro día, la fecha
        time: when.date === today ? when.time : `${when.date.slice(8, 10)}/${when.date.slice(5, 7)}`,
        tone: kind.tone,
        ref: formatOrderNumber(row.shipment.number),
        event: kind.event,
        detail: row.kind === "won" ? { kind: "signed" } : { kind: "text", text: by },
      },
    ];
  });

  // Flota de hoy: un vehículo cuenta una vez, en su estado más ocupado
  const active = schedule.vehicles.filter((vehicle) => vehicle.active);
  const busyNow = new Set(todayJobs.filter((job) => job.status === "in-progress").flatMap((job) => (job.vehicleId ? [job.vehicleId] : [])));
  const busyToday = new Set(
    todayJobs.filter((job) => job.status === "scheduled" && job.vehicleId && !busyNow.has(job.vehicleId)).map((job) => job.vehicleId as string),
  );
  const service = active.filter((v) => busyNow.has(v.id)).length;
  const loading = active.filter((v) => busyToday.has(v.id)).length;

  const [firstIncident] = incidents.data;
  return {
    stats: [
      { kind: "jobs-today", value: todayJobs.filter((job) => job.date === today).length, tone: "warn" },
      { kind: "in-progress", value: todayJobs.filter((job) => job.status === "in-progress").length, tone: "success" },
      { kind: "incidents", value: incidents.data.length, tone: "danger" },
    ],
    attention: firstIncident ? { jobId: formatOrderNumber(firstIncident.job.shipment.number), reason: firstIncident.description } : null,
    jobs,
    stages,
    activity,
    fleet: { service, loading, available: active.length - service - loading },
  };
}
