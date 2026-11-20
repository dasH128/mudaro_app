import { parseDatePt } from "@mudaro/validation";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { hasLocale } from "@/app/i18n/config";
import { loadDictionary } from "@/app/i18n/get-dictionary";
import { ROUTES, localePath } from "@/app/lib/routes";
import { requireCompanySession } from "@/features/auth/application/require-session";
import { addDays } from "@/features/fleet/domain/fleet";
import { buildInvoiceCsv } from "@/features/jobs/domain/export";
import { getClosedJobsForExport, lisbonDay } from "@/features/jobs/infrastructure/export.repo";
import { lisbonInstant } from "@/features/schedule/domain/lisbon-time";

/** Rango máximo de una exportación, para no leer años de trabajos de una vez. */
const MAX_DAYS = 366;

/**
 * CSV de trabajos cerrados entre dos días de Lisboa, ambos incluidos (paso 6.7, RF-60). Comprueba sesión y rol en
 * servidor y lee con RLS (sin clave de servicio). Fechas mal escritas vuelven a la Agenda con un aviso.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/[lang]/jobs/export">) {
  const { lang } = await params;
  if (!hasLocale(lang)) redirect("/");
  await requireCompanySession(lang);

  const from = parseDatePt(request.nextUrl.searchParams.get("from")?.trim() ?? "");
  const to = parseDatePt(request.nextUrl.searchParams.get("to")?.trim() ?? "");
  const fromInstant = from ? lisbonInstant(from, "00:00") : null;
  // El último día entra entero: hasta las 00:00 del día siguiente
  const toInstant = to ? lisbonInstant(addDays(to, 1), "00:00") : null;
  const tooLong = from && to ? Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`) > MAX_DAYS * 86_400_000 : false;
  if (!from || !to || !fromInstant || !toInstant || toInstant <= fromInstant || tooLong) {
    redirect(`${localePath(lang, ROUTES.schedule)}?exportError=1`);
  }

  const [jobs, dict] = await Promise.all([getClosedJobsForExport(fromInstant, toInstant), loadDictionary(lang)]);
  const csv = buildInvoiceCsv(jobs, dict.app.jobs.export, lisbonDay);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mudaro-trabalhos-${from}-a-${to}.csv"`,
      // Datos de clientes y precios: nada de cachés intermedias
      "Cache-Control": "private, no-store",
    },
  });
}
