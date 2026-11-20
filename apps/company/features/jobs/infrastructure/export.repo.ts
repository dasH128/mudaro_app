import "server-only";

import { createSupabaseServerClient } from "@mudaro/supabase/server";

import { formatOrderNumber } from "@/features/orders/domain/order-number";
import type { ExportJob, ExportLine } from "../domain/export";

// Exportación para facturar (paso 6.7, RF-60). Lee con RLS y la sesión del administrador: solo trabajos de su empresa.

const lisbonDay = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Lisbon" }).format(new Date(iso));

/** Trabajos cerrados entre dos instantes (fin excluido), con las líneas del orçamento aceptado y las incidencias. */
export async function getClosedJobsForExport(fromInstant: string, toInstant: string): Promise<ExportJob[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      `closed_at, scheduled_start,
       shipment:shipments!inner(number, client:clients(name, tax_id), order:orders!inner(contact_name)),
       quote:quotes!inner(id, number, version, vat_pct,
         quote_lines(id, kind, description, quantity, unit_price_cents, total_cents, optional, sort_order),
         acceptances(selected_line_ids, accepted_at)),
       incidents(type, description, extra_amount_cents, occurred_at)`,
    )
    .eq("status", "closed")
    .gte("closed_at", fromInstant)
    .lt("closed_at", toInstant)
    .order("closed_at");
  if (error) throw new Error(`jobs: no se pudieron leer los trabajos cerrados (${error.code})`);

  return data.map((row) => {
    // La aceptación vigente: la más reciente del orçamento
    const acceptance = [...row.quote.acceptances].sort((a, b) => b.accepted_at.localeCompare(a.accepted_at))[0];
    const selected = new Set(acceptance?.selected_line_ids ?? []);
    const quoteLines: ExportLine[] = [...row.quote.quote_lines]
      .sort((a, b) => a.sort_order - b.sort_order)
      .filter((line) => !line.optional || selected.has(line.id))
      .map((line) => ({
        kind: line.kind,
        description: line.description,
        quantity: Number(line.quantity),
        unitPriceCents: line.unit_price_cents,
        totalCents: line.total_cents,
      }));
    // Incidencias con importe adicional (RF-53): sin IVA, con el IVA del orçamento
    const incidentLines: ExportLine[] = [...row.incidents]
      .filter((incident) => incident.extra_amount_cents > 0)
      .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))
      .map((incident) => ({
        kind: "incident",
        description: incident.description,
        quantity: 1,
        unitPriceCents: incident.extra_amount_cents,
        totalCents: incident.extra_amount_cents,
      }));

    return {
      orderId: formatOrderNumber(row.shipment.number),
      quote: `ORC-${String(row.quote.number).padStart(4, "0")} v${row.quote.version}`,
      closedAt: row.closed_at ?? row.scheduled_start,
      moveDate: lisbonDay(row.scheduled_start),
      client: row.shipment.client?.name ?? row.shipment.order.contact_name,
      taxId: row.shipment.client?.tax_id ?? null,
      vatPct: Number(row.quote.vat_pct),
      lines: [...quoteLines, ...incidentLines],
    };
  });
}

export { lisbonDay };
