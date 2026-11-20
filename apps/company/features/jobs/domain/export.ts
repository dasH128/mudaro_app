// Exportación de trabajos cerrados para facturar (paso 6.7, RF-60). Lógica pura: arma el CSV a partir de los datos.
// Formato pensado para Excel en portugués: UTF-8 con BOM, separador ";", coma decimal y fechas dd/mm/aaaa.

export type ExportLineKind = "base" | "extra" | "manual" | "incident";

export type ExportLine = {
  kind: ExportLineKind;
  description: string;
  quantity: number;
  unitPriceCents: number;
  /** Sin IVA. */
  totalCents: number;
};

export type ExportJob = {
  orderId: string;
  /** "ORC-0012 v2". */
  quote: string;
  /** Instante ISO del cierre. */
  closedAt: string;
  /** Día de la mudanza, aaaa-mm-dd (Lisboa). */
  moveDate: string;
  client: string;
  taxId: string | null;
  vatPct: number;
  lines: ExportLine[];
};

export type ExportText = {
  headers: readonly string[];
  kinds: Record<ExportLineKind, string>;
};

/** Céntimos → "1234,50" (sin separador de miles, para que Excel lo lea como número). */
export const csvAmount = (cents: number): string => {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")}`;
};

/** 1.5 → "1,5". */
const csvNumber = (value: number): string => String(Math.round(value * 100) / 100).replace(".", ",");

/** aaaa-mm-dd → dd/mm/aaaa. */
const csvDate = (day: string): string => `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;

/**
 * Una celda segura: entre comillas si lleva separador, comillas o saltos de línea, y con un apóstrofo delante si
 * empieza por =, +, - o @, para que Excel no la ejecute como fórmula (inyección CSV).
 */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[;"\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** IVA de una línea, redondeado al céntimo como en quote_totals. */
export const vatOf = (totalCents: number, vatPct: number): number => Math.round((totalCents * vatPct) / 100);

/**
 * CSV con una fila por línea facturable de cada trabajo: líneas del orçamento aceptado (las opcionales solo si el
 * cliente las eligió) y las incidencias con importe. `closedDay` da el día de Lisboa de un instante.
 */
export function buildInvoiceCsv(jobs: readonly ExportJob[], t: ExportText, closedDay: (iso: string) => string): string {
  const rows = [t.headers.map(csvCell).join(";")];
  for (const job of jobs) {
    for (const line of job.lines) {
      const vat = vatOf(line.totalCents, job.vatPct);
      rows.push(
        [
          job.orderId,
          job.quote,
          csvDate(closedDay(job.closedAt)),
          csvDate(job.moveDate),
          job.client,
          job.taxId ?? "",
          t.kinds[line.kind],
          line.description,
          csvNumber(line.quantity),
          csvAmount(line.unitPriceCents),
          csvAmount(line.totalCents),
          csvNumber(job.vatPct),
          csvAmount(vat),
          csvAmount(line.totalCents + vat),
        ]
          .map(csvCell)
          .join(";"),
      );
    }
  }
  // BOM: Excel solo detecta UTF-8 con él (acentos de nombres y moradas)
  return `﻿${rows.join("\r\n")}\r\n`;
}
